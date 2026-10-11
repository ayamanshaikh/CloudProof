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


async def init_db():
    """Create all tables in the database and seed initial mission catalog."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await seed_initial_data(session)
