import ipaddress
from typing import Dict, Any, List
from app.engine.rules.base import BaseRule
from app.engine.models import RuleResult, RuleCheckStatus, RuleSeverity


def is_rule_covering_port(rule: Dict[str, Any], target_port: int) -> bool:
    """Helper to check if a security group rule covers a specific port."""
    protocol = str(rule.get("IpProtocol", "")).lower()
    from_port = rule.get("FromPort")
    to_port = rule.get("ToPort")

    if protocol in ("-1", "all"):
        return True

    if protocol == "tcp":
        if from_port is None and to_port is None:
            return True
        if from_port is not None and to_port is not None:
            return from_port <= target_port <= to_port

    return False


def has_public_cidr(rule: Dict[str, Any]) -> bool:
    """Helper to check if rule allows 0.0.0.0/0 or ::/0."""
    for ip_range in rule.get("IpRanges", []):
        cidr = ip_range.get("CidrIp", "")
        if cidr in ("0.0.0.0/0", "0.0.0.0"):
            return True

    for ipv6_range in rule.get("Ipv6Ranges", []):
        cidr6 = ipv6_range.get("CidrIpv6", "")
        if cidr6 in ("::/0", "::"):
            return True

    return False


def is_private_or_trusted_cidr(cidr_str: str) -> bool:
    """Checks if a CIDR block belongs strictly to private RFC 1918 space."""
    try:
        net = ipaddress.ip_network(cidr_str, strict=False)
        return net.is_private and net.prefixlen > 0
    except ValueError:
        return False


class RulePostgresPortNotPublic(BaseRule):
    """
    CP-NET-001: PostgreSQL Port 5432 Ingress Not Public (30 pts).
    Ensures that port 5432 is not exposed to 0.0.0.0/0 or ::/0.
    """

    def __init__(self):
        super().__init__(
            rule_id="CP-NET-001",
            name="PostgreSQL Port 5432 Ingress Not Public",
            description="Verifies that database port 5432 is not open to 0.0.0.0/0 or ::/0 on the public internet.",
            severity=RuleSeverity.CRITICAL,
            points=30,
            resource_type="aws_ec2_security_group"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        ip_permissions = state.get("ip_permissions") or state.get("IpPermissions", [])

        exposed_rules = []
        for r in ip_permissions:
            if is_rule_covering_port(r, 5432) and has_public_cidr(r):
                exposed_rules.append(r)

        if exposed_rules:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.FAIL,
                severity=self.severity,
                expected="Inbound port 5432 restricted to internal private VPC CIDR or application security group",
                actual=f"Found {len(exposed_rules)} inbound rule(s) opening port 5432 to 0.0.0.0/0",
                evidence=f"CRITICAL VULNERABILITY: Inbound Security Group rule permits traffic on PostgreSQL port 5432 directly from 0.0.0.0/0. Port scanners can brute-force database credentials.",
                points_earned=0,
                max_points=self.points
            )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="Port 5432 not exposed to 0.0.0.0/0",
            actual="No public 0.0.0.0/0 rules found for port 5432",
            evidence="CONFIRMED: Database port 5432 is not accessible from 0.0.0.0/0 or ::/0.",
            points_earned=self.points,
            max_points=self.points
        )


class RuleDatabaseIngressScoped(BaseRule):
    """
    CP-NET-002: Database Ingress Scoped to Application Tier (25 pts).
    Ensures that port 5432 ingress is specifically scoped to an authorized Security Group
    or private RFC 1918 VPC CIDR (e.g. 10.0.0.0/16).
    """

    def __init__(self):
        super().__init__(
            rule_id="CP-NET-002",
            name="Database Ingress Scoped to Application Tier",
            description="Verifies that port 5432 ingress allows connections only from trusted application Security Groups or private RFC 1918 VPC CIDRs.",
            severity=RuleSeverity.HIGH,
            points=25,
            resource_type="aws_ec2_security_group"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        ip_permissions = state.get("ip_permissions") or state.get("IpPermissions", [])

        postgres_rules = [r for r in ip_permissions if is_rule_covering_port(r, 5432)]

        if not postgres_rules:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.FAIL,
                severity=self.severity,
                expected="At least one inbound rule permitting port 5432 from private subnet or app security group",
                actual="0 inbound rules exist for port 5432",
                evidence="APPLICATION OUTAGE: No inbound rules exist for PostgreSQL port 5432. Application servers cannot reach the database.",
                points_earned=0,
                max_points=self.points
            )

        for r in postgres_rules:
            group_pairs = r.get("UserIdGroupPairs", [])
            ip_ranges = r.get("IpRanges", [])
            ipv6_ranges = r.get("Ipv6Ranges", [])

            if not group_pairs and not ip_ranges and not ipv6_ranges:
                return RuleResult(
                    rule_id=self.rule_id,
                    name=self.name,
                    status=RuleCheckStatus.FAIL,
                    severity=self.severity,
                    expected="Valid source Security Group or private CIDR block",
                    actual="Inbound rule on port 5432 with empty sources",
                    evidence="MALFORMED RULE: Inbound rule on port 5432 has no valid source targets.",
                    points_earned=0,
                    max_points=self.points
                )

            for r6 in ipv6_ranges:
                cidr6 = r6.get("CidrIpv6", "")
                if cidr6 in ("::/0", "::"):
                    return RuleResult(
                        rule_id=self.rule_id,
                        name=self.name,
                        status=RuleCheckStatus.FAIL,
                        severity=self.severity,
                        expected="No global public IPv6 ingress on port 5432",
                        actual=f"Found public IPv6 ingress from {cidr6}",
                        evidence=f"UNSCOPED INGRESS: Inbound rule on port 5432 permits IPv6 traffic from {cidr6}.",
                        points_earned=0,
                        max_points=self.points
                    )

            for r4 in ip_ranges:
                cidr4 = r4.get("CidrIp", "")
                if not is_private_or_trusted_cidr(cidr4):
                    return RuleResult(
                        rule_id=self.rule_id,
                        name=self.name,
                        status=RuleCheckStatus.FAIL,
                        severity=self.severity,
                        expected="Private RFC 1918 CIDR (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)",
                        actual=f"Non-private CIDR found: '{cidr4}'",
                        evidence=f"UNTRUSTED SOURCE: Port 5432 ingress rule contains untrusted or non-private CIDR '{cidr4}'.",
                        points_earned=0,
                        max_points=self.points
                    )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="Port 5432 scoped to private RFC 1918 CIDRs or application Security Groups",
            actual="All port 5432 rules scoped to private ranges or security groups",
            evidence="CONFIRMED: Database port 5432 is strictly scoped to private RFC 1918 subnets and/or application Security Groups.",
            points_earned=self.points,
            max_points=self.points
        )


class RuleSSHPortNotPublic(BaseRule):
    """
    CP-NET-003: SSH Port 22 Ingress Restricted or Closed (25 pts).
    Ensures that port 22 is not open to 0.0.0.0/0.
    """

    def __init__(self):
        super().__init__(
            rule_id="CP-NET-003",
            name="SSH Port 22 Ingress Restricted or Closed",
            description="Verifies that administrative SSH port 22 is not exposed to the public internet (0.0.0.0/0).",
            severity=RuleSeverity.HIGH,
            points=25,
            resource_type="aws_ec2_security_group"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        ip_permissions = state.get("ip_permissions") or state.get("IpPermissions", [])

        exposed_ssh = []
        for r in ip_permissions:
            if is_rule_covering_port(r, 22) and has_public_cidr(r):
                exposed_ssh.append(r)

        if exposed_ssh:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.FAIL,
                severity=self.severity,
                expected="Port 22 closed or restricted to private management bastion",
                actual="Found inbound rule allowing port 22 from 0.0.0.0/0",
                evidence="EXPOSED MANAGEMENT PORT: Inbound rule allows SSH (port 22) from 0.0.0.0/0. This exposes database instances to automated credential brute-forcing.",
                points_earned=0,
                max_points=self.points
            )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="Port 22 not exposed to 0.0.0.0/0",
            actual="Port 22 is closed or restricted",
            evidence="CONFIRMED: SSH port 22 is not exposed to 0.0.0.0/0.",
            points_earned=self.points,
            max_points=self.points
        )


class RuleNoWildcardIngress(BaseRule):
    """
    CP-NET-004: No Wildcard All-Traffic Ingress (20 pts).
    Ensures that no inbound rule permits all protocols (-1) or all ports (0-65535) from 0.0.0.0/0.
    """

    def __init__(self):
        super().__init__(
            rule_id="CP-NET-004",
            name="No Wildcard All-Traffic Ingress",
            description="Verifies that no inbound rule permits all protocols or all ports from 0.0.0.0/0 or ::/0.",
            severity=RuleSeverity.CRITICAL,
            points=20,
            resource_type="aws_ec2_security_group"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        ip_permissions = state.get("ip_permissions") or state.get("IpPermissions", [])

        for r in ip_permissions:
            protocol = str(r.get("IpProtocol", "")).lower()
            from_port = r.get("FromPort")
            to_port = r.get("ToPort")

            is_wildcard = (protocol in ("-1", "all")) or (from_port == 0 and to_port == 65535)
            if is_wildcard and has_public_cidr(r):
                return RuleResult(
                    rule_id=self.rule_id,
                    name=self.name,
                    status=RuleCheckStatus.FAIL,
                    severity=self.severity,
                    expected="No all-traffic (-1) wildcard inbound rules from 0.0.0.0/0",
                    actual=f"Inbound rule allows all protocols/ports from 0.0.0.0/0",
                    evidence="DANGEROUS PERMISSIVENESS: Inbound rule allows ALL traffic (all protocols/ports) from 0.0.0.0/0.",
                    points_earned=0,
                    max_points=self.points
                )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="No all-traffic wildcard rules",
            actual="Perimeter ingress is explicitly defined by specific ports",
            evidence="CONFIRMED: No unrestricted all-traffic inbound rules exist.",
            points_earned=self.points,
            max_points=self.points
        )


def get_mission_3_rules() -> List[BaseRule]:
    """Factory returning ordered deterministic verification rules for Mission 3."""
    return [
        RulePostgresPortNotPublic(),
        RuleDatabaseIngressScoped(),
        RuleSSHPortNotPublic(),
        RuleNoWildcardIngress()
    ]
