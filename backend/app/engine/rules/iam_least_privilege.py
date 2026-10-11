from typing import Dict, Any, List
from app.engine.models import RuleResult, RuleCheckStatus, RuleSeverity
from app.engine.rules.base import BaseRule


DANGEROUS_ESCALATION_ACTIONS = {
    "iam:passrole",
    "iam:attachrolepolicy",
    "iam:putrolepolicy",
    "iam:createpolicyversion",
    "iam:setdefaultpolicyversion",
    "iam:createaccesskey",
    "iam:createuser",
    "iam:addusertogroup",
    "iam:putuserpolicy",
    "iam:attachuserpolicy"
}


class RuleNoWildcardActions(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="CP-IAM-001",
            name="No Wildcard Actions in Inline Policy",
            description="Disallows wildcard Action '*' or full service wildcards in Allow statements.",
            severity=RuleSeverity.CRITICAL,
            points=20,
            resource_type="aws_iam"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        policy = state.get("inline_policy") or {}
        statements = policy.get("Statement", [])
        if isinstance(statements, dict):
            statements = [statements]

        wildcards_found = []
        for stmt in statements:
            if stmt.get("Effect", "").lower() == "allow":
                actions = stmt.get("Action", [])
                if isinstance(actions, str):
                    actions = [actions]
                for act in actions:
                    act_clean = act.strip()
                    if act_clean == "*" or act_clean.endswith(":*"):
                        wildcards_found.append(act_clean)

        if wildcards_found:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.FAIL,
                severity=self.severity,
                expected="Specific least-privilege actions (e.g. s3:GetObject, logs:PutLogEvents)",
                actual=f"Wildcard actions found: {', '.join(set(wildcards_found))}",
                evidence=f"Policy contains wildcard actions: {', '.join(set(wildcards_found))}. Wildcard actions violate AWS CIS Benchmark 1.16.",
                points_earned=0,
                max_points=self.points
            )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="Specific least-privilege actions",
            actual="Explicit non-wildcard actions",
            evidence="All policy statements specify explicit non-wildcard actions.",
            points_earned=self.points,
            max_points=self.points
        )


class RuleNoAdminAccessManagedPolicy(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="CP-IAM-002",
            name="AdministratorAccess Managed Policy Detached",
            description="Ensures the AWS managed AdministratorAccess policy is not attached to the Lambda role.",
            severity=RuleSeverity.CRITICAL,
            points=20,
            resource_type="aws_iam"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        attached_policies = state.get("attached_managed_policies", [])
        admin_policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
        is_attached = any(
            p == admin_policy_arn or p.lower().endswith("administratoraccess")
            for p in attached_policies
        )

        if is_attached:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.FAIL,
                severity=self.severity,
                expected="AdministratorAccess managed policy detached",
                actual="arn:aws:iam::aws:policy/AdministratorAccess attached",
                evidence="Role has AdministratorAccess attached, granting unconditional full cloud administration.",
                points_earned=0,
                max_points=self.points
            )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="AdministratorAccess managed policy detached",
            actual="AdministratorAccess not attached",
            evidence="AdministratorAccess policy is successfully detached from the role.",
            points_earned=self.points,
            max_points=self.points
        )


class RuleCloudWatchLoggingPreserved(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="CP-IAM-003",
            name="CloudWatch Logging Permissions Preserved",
            description="Ensures Lambda execution role retains permissions to write logs so operations do not break.",
            severity=RuleSeverity.MEDIUM,
            points=15,
            resource_type="aws_iam"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        attached = state.get("attached_managed_policies", [])
        policy = state.get("inline_policy") or {}
        statements = policy.get("Statement", [])
        if isinstance(statements, dict):
            statements = [statements]

        has_basic_execution = any("AWSLambdaBasicExecutionRole" in p for p in attached)
        if has_basic_execution:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.PASS,
                severity=self.severity,
                expected="CloudWatch logging permissions granted",
                actual="AWSLambdaBasicExecutionRole attached",
                evidence="Role has AWSLambdaBasicExecutionRole attached, granting necessary CloudWatch logging access.",
                points_earned=self.points,
                max_points=self.points
            )

        allowed_actions = set()
        for stmt in statements:
            if stmt.get("Effect", "").lower() == "allow":
                actions = stmt.get("Action", [])
                if isinstance(actions, str):
                    actions = [actions]
                for a in actions:
                    allowed_actions.add(a.lower())

        has_log_stream = "logs:createlogstream" in allowed_actions or "logs:putlogevents" in allowed_actions
        if has_log_stream:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.PASS,
                severity=self.severity,
                expected="CloudWatch logging permissions granted",
                actual="Inline logging actions allowed",
                evidence="Inline policy retains CloudWatch logging permissions (logs:CreateLogStream, logs:PutLogEvents).",
                points_earned=self.points,
                max_points=self.points
            )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.FAIL,
            severity=self.severity,
            expected="Permissions for logs:CreateLogStream and logs:PutLogEvents",
            actual=f"Found actions: {list(allowed_actions)[:4]}",
            evidence="Lambda role lacks CloudWatch logging permissions. The Lambda function will fail silently in production.",
            points_earned=0,
            max_points=self.points
        )


class RuleResourceScopingEnforced(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="CP-IAM-004",
            name="Sensitive Actions Resource-Scoped",
            description="Ensures sensitive actions like s3:GetObject are scoped to specific ARNs rather than wildcard '*'.",
            severity=RuleSeverity.HIGH,
            points=15,
            resource_type="aws_iam"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        policy = state.get("inline_policy") or {}
        statements = policy.get("Statement", [])
        if isinstance(statements, dict):
            statements = [statements]

        unscoped_actions = []
        for stmt in statements:
            if stmt.get("Effect", "").lower() == "allow":
                actions = stmt.get("Action", [])
                if isinstance(actions, str):
                    actions = [actions]
                resources = stmt.get("Resource", [])
                if isinstance(resources, str):
                    resources = [resources]

                is_wildcard_resource = any(r.strip() == "*" for r in resources)
                if is_wildcard_resource:
                    for a in actions:
                        if a.lower().startswith("s3:") or a.lower().startswith("secretsmanager:"):
                            unscoped_actions.append(a)

        if unscoped_actions:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.FAIL,
                severity=self.severity,
                expected="Scoped resource ARN (e.g. arn:aws:s3:::acme-media-uploads-2026/*)",
                actual=f"Resource: '*' specified for sensitive actions {unscoped_actions}",
                evidence=f"Sensitive actions {unscoped_actions} are unscoped with Resource: '*'. Attacker can access any bucket or secret in the account.",
                points_earned=0,
                max_points=self.points
            )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="Resource ARN scoping",
            actual="Resource ARNs are scoped",
            evidence="All sensitive S3 and secret access statements are restricted to specific resource ARNs.",
            points_earned=self.points,
            max_points=self.points
        )


class RuleNoPrivilegeEscalationPrimitives(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="CP-IAM-005",
            name="No Privilege Escalation Primitives",
            description="Ensures zero permissions for iam:PassRole, iam:CreateAccessKey, or iam:Attach* that enable privilege escalation.",
            severity=RuleSeverity.CRITICAL,
            points=20,
            resource_type="aws_iam"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        policy = state.get("inline_policy") or {}
        statements = policy.get("Statement", [])
        if isinstance(statements, dict):
            statements = [statements]

        escalation_found = []
        for stmt in statements:
            if stmt.get("Effect", "").lower() == "allow":
                actions = stmt.get("Action", [])
                if isinstance(actions, str):
                    actions = [actions]
                for act in actions:
                    act_lower = act.strip().lower()
                    if act_lower in DANGEROUS_ESCALATION_ACTIONS or act_lower.startswith("iam:"):
                        escalation_found.append(act)

        if escalation_found:
            return RuleResult(
                rule_id=self.rule_id,
                name=self.name,
                status=RuleCheckStatus.FAIL,
                severity=self.severity,
                expected="Zero IAM administrative or escalation actions",
                actual=f"Found dangerous actions: {', '.join(set(escalation_found))}",
                evidence=f"Found dangerous IAM actions {', '.join(set(escalation_found))}. These actions allow an attacker to escalate privileges to full account admin.",
                points_earned=0,
                max_points=self.points
            )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="Zero privilege escalation actions",
            actual="No IAM actions granted",
            evidence="No privilege escalation actions found in role statements.",
            points_earned=self.points,
            max_points=self.points
        )


class RuleRestrictedTrustPolicy(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="CP-IAM-006",
            name="Trust Policy Restricted to Lambda Service",
            description="Ensures AssumeRolePolicyDocument strictly trusts lambda.amazonaws.com and contains no wildcard principals.",
            severity=RuleSeverity.HIGH,
            points=10,
            resource_type="aws_iam"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        trust = state.get("trust_policy") or {}
        statements = trust.get("Statement", [])
        if isinstance(statements, dict):
            statements = [statements]

        for stmt in statements:
            if stmt.get("Effect", "").lower() == "allow":
                principal = stmt.get("Principal", {})
                if principal == "*":
                    return RuleResult(
                        rule_id=self.rule_id,
                        name=self.name,
                        status=RuleCheckStatus.FAIL,
                        severity=self.severity,
                        expected="Service: lambda.amazonaws.com",
                        actual="Principal: *",
                        evidence="Trust policy has Principal: '*'. Anyone on the internet or AWS can assume this role.",
                        points_earned=0,
                        max_points=self.points
                    )
                if isinstance(principal, dict):
                    service = principal.get("Service", "")
                    if isinstance(service, list):
                        service = service[0] if service else ""
                    if service != "lambda.amazonaws.com":
                        return RuleResult(
                            rule_id=self.rule_id,
                            name=self.name,
                            status=RuleCheckStatus.FAIL,
                            severity=self.severity,
                            expected="Service: lambda.amazonaws.com",
                            actual=f"Service: {service}",
                            evidence=f"Trust policy specifies unexpected service: '{service}'.",
                            points_earned=0,
                            max_points=self.points
                        )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=RuleCheckStatus.PASS,
            severity=self.severity,
            expected="Service: lambda.amazonaws.com",
            actual="Service: lambda.amazonaws.com",
            evidence="Trust policy is properly restricted to the Lambda service principal.",
            points_earned=self.points,
            max_points=self.points
        )


def get_mission_2_rules() -> List[BaseRule]:
    return [
        RuleNoWildcardActions(),
        RuleNoAdminAccessManagedPolicy(),
        RuleCloudWatchLoggingPreserved(),
        RuleResourceScopingEnforced(),
        RuleNoPrivilegeEscalationPrimitives(),
        RuleRestrictedTrustPolicy(),
    ]
