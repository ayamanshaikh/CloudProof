from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Engine configuration
# Note: check_same_thread=False is needed only for SQLite
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding an active asynchronous database session."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def seed_initial_data(session: AsyncSession):
    """Seed initial Mission 1 and hints if not already present."""
    from sqlalchemy import select
    from app.models.mission import Mission, Hint

    stmt = select(Mission).where(Mission.slug == "s3-public-invoices")
    result = await session.execute(stmt)
    existing_mission = result.scalar_one_or_none()

    if not existing_mission:
        mission_1 = Mission(
            slug="s3-public-invoices",
            title="The Public Invoice Bucket",
            description="A startup accidentally exposed customer PDF invoices through an Amazon S3 bucket. Investigate why the bucket is publicly accessible, fix the permissions and block settings, and verify your remediation.",
            category="Storage Security",
            difficulty="Beginner",
            base_points=100,
            initial_state={
                "bucket_name": "cloudproof-acme-invoices-2026",
                "public_access_block": {
                    "BlockPublicAcls": False,
                    "IgnorePublicAcls": False,
                    "BlockPublicPolicy": False,
                    "RestrictPublicBuckets": False
                },
                "bucket_acl": "public-read",
                "bucket_policy": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "PublicReadGetObject",
                            "Effect": "Allow",
                            "Principal": "*",
                            "Action": "s3:GetObject",
                            "Resource": "arn:aws:s3:::cloudproof-acme-invoices-2026/*"
                        }
                    ]
                }
            }
        )
        session.add(mission_1)
        await session.flush()

        hints = [
            Hint(
                mission_id=mission_1.id,
                level=1,
                title="Understanding S3 Public Access Mechanisms",
                content="In AWS S3, a bucket can become publicly accessible through three mechanisms: Bucket ACLs, Bucket Policies, or S3 Block Public Access settings being disabled. Both the bucket policy and the block public access controls must be aligned to prevent public exposure.",
                token_cost=1,
                penalty_percent=5
            ),
            Hint(
                mission_id=mission_1.id,
                level=2,
                title="Inspecting the Bucket Policy and Block Settings",
                content="Examine the Statement block in the bucket policy. Notice that Principal is set to '*', granting unconditional anonymous access to s3:GetObject. Additionally, check whether S3 Block Public Access is disabled on the bucket.",
                token_cost=2,
                penalty_percent=15
            ),
            Hint(
                mission_id=mission_1.id,
                level=3,
                title="Remediation Targets",
                content="To completely secure this bucket: (1) Enable all four S3 Block Public Access settings (BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets). (2) Remove the public read statement granting anonymous access to Principal: '*'.",
                token_cost=3,
                penalty_percent=30
            ),
            Hint(
                mission_id=mission_1.id,
                level=4,
                title="Complete Solution State",
                content="Remove the public bucket policy statement or restrict the Principal to authenticated roles. Set BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, and RestrictPublicBuckets: true.",
                token_cost=4,
                penalty_percent=60
            )
        ]
        session.add_all(hints)
        await session.commit()

    # Seed Mission 2: The Overprivileged Lambda Role
    stmt2 = select(Mission).where(Mission.slug == "iam-overprivileged-lambda")
    result2 = await session.execute(stmt2)
    existing_mission_2 = result2.scalar_one_or_none()

    if not existing_mission_2:
        mission_2 = Mission(
            slug="iam-overprivileged-lambda",
            title="The Overprivileged Lambda Role",
            description="A background image-processing Lambda worker was assigned an overly broad execution role with AdministratorAccess and wildcard actions. If exploited, an attacker can take over the AWS account. Enforce IAM least privilege, detach administrative policies, and scope permissions to target resources.",
            category="Identity & Access Management",
            difficulty="Intermediate",
            base_points=100,
            initial_state={
                "role_name": "WorkerLambdaExecutionRole",
                "attached_managed_policies": [
                    "arn:aws:iam::aws:policy/AdministratorAccess"
                ],
                "inline_policy": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AllowAllWorkerActions",
                            "Effect": "Allow",
                            "Action": "*",
                            "Resource": "*"
                        }
                    ]
                },
                "trust_policy": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
            }
        )
        session.add(mission_2)
        await session.flush()

        hints_2 = [
            Hint(
                mission_id=mission_2.id,
                level=1,
                title="IAM Least Privilege Principles",
                content="AWS Lambda functions should only possess the minimum permissions necessary to perform their function. Check both the attached managed policies and inline policy statements for wildcards ('*').",
                token_cost=1,
                penalty_percent=5
            ),
            Hint(
                mission_id=mission_2.id,
                level=2,
                title="Detaching Dangerous Administrative Policies",
                content="Notice that 'arn:aws:iam::aws:policy/AdministratorAccess' is attached to this role. Detach it immediately. In addition, look for 'Action': '*' in the inline policy.",
                token_cost=2,
                penalty_percent=10
            ),
            Hint(
                mission_id=mission_2.id,
                level=3,
                title="Preserving CloudWatch Logging & Scoping S3",
                content="The worker only needs to: (1) Write logs to CloudWatch (logs:CreateLogStream, logs:PutLogEvents) and (2) Read incoming images from 'arn:aws:s3:::acme-media-uploads-2026/*'. Do not grant wildcard Resource '*'.",
                token_cost=3,
                penalty_percent=15
            ),
            Hint(
                mission_id=mission_2.id,
                level=4,
                title="Complete Remediated Policy State",
                content="Detach AdministratorAccess. In inline_policy, permit only 's3:GetObject' on 'arn:aws:s3:::acme-media-uploads-2026/*' and 'logs:CreateLogStream', 'logs:PutLogEvents' on CloudWatch log group ARNs. Revoke all iam:* actions.",
                token_cost=4,
                penalty_percent=20
            )
        ]
        session.add_all(hints_2)
        await session.commit()

    # Seed Mission 3: The World-Readable Database Port
    stmt3 = select(Mission).where(Mission.slug == "vpc-exposed-database")
    result3 = await session.execute(stmt3)
    existing_mission_3 = result3.scalar_one_or_none()

    if not existing_mission_3:
        mission_3 = Mission(
            slug="vpc-exposed-database",
            title="The World-Readable Database Port",
            description="During late-night debugging of a connection timeout issue, a DevOps engineer added an inbound Security Group rule allowing 0.0.0.0/0 on PostgreSQL port 5432. Automated bots and port scanners immediately began attacking the exposed database. Your mission is to isolate the database port, scope access strictly to private application tiers, and close public SSH management exposure.",
            category="Network Security & VPC",
            difficulty="Intermediate",
            base_points=100,
            initial_state={
                "group_id": "sg-04a89bc21345d6e7f",
                "group_name": "prod-aurora-postgres-sg",
                "description": "Security group for production Aurora PostgreSQL cluster",
                "vpc_id": "vpc-01a2b3c4d5e6f7g8h",
                "ip_permissions": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 5432,
                        "ToPort": 5432,
                        "IpRanges": [
                            {
                                "CidrIp": "0.0.0.0/0",
                                "Description": "Temporary dev troubleshooting rule"
                            }
                        ],
                        "Ipv6Ranges": [],
                        "PrefixListIds": [],
                        "UserIdGroupPairs": []
                    },
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 22,
                        "ToPort": 22,
                        "IpRanges": [
                            {
                                "CidrIp": "0.0.0.0/0",
                                "Description": "Emergency SSH bastion access"
                            }
                        ],
                        "Ipv6Ranges": [],
                        "PrefixListIds": [],
                        "UserIdGroupPairs": []
                    }
                ],
                "ip_permissions_egress": [
                    {
                        "IpProtocol": "-1",
                        "IpRanges": [
                            {"CidrIp": "0.0.0.0/0"}
                        ],
                        "Ipv6Ranges": [],
                        "PrefixListIds": [],
                        "UserIdGroupPairs": []
                    }
                ]
            }
        )
        session.add(mission_3)
        await session.flush()

        hints_3 = [
            Hint(
                mission_id=mission_3.id,
                level=1,
                title="VPC Ingress Attack Surface",
                content="Databases must never be exposed to the public internet (0.0.0.0/0). Review the Inbound Rules of this Security Group and examine the source CIDR blocks.",
                token_cost=1,
                penalty_percent=5
            ),
            Hint(
                mission_id=mission_3.id,
                level=2,
                title="Isolating PostgreSQL Port 5432",
                content="Notice that TCP port 5432 is mapped to 0.0.0.0/0. Remove this public rule and replace it with a rule that permits connections only from the private application subnet (e.g. 10.0.0.0/16) or an application Security Group (e.g. sg-app-backend).",
                token_cost=2,
                penalty_percent=10
            ),
            Hint(
                mission_id=mission_3.id,
                level=3,
                title="Closing Management SSH Port 22",
                content="SSH on port 22 is also open to 0.0.0.0/0. Modern AWS architectures do not expose port 22 to the world; remove the rule or restrict it to an internal management bastion.",
                token_cost=3,
                penalty_percent=15
            ),
            Hint(
                mission_id=mission_3.id,
                level=4,
                title="Complete Remediated Configuration",
                content="Inbound Rules: (1) TCP port 5432 from 10.0.0.0/16 or sg-app-backend. (2) Remove port 22 from 0.0.0.0/0. (3) Ensure no rules allow all traffic (-1) from 0.0.0.0/0.",
                token_cost=4,
                penalty_percent=20
            )
        ]
        session.add_all(hints_3)
        await session.commit()



async def init_db():
    """Create all tables in the database and seed initial mission catalog."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await seed_initial_data(session)
