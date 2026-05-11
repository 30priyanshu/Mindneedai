"""Add profile detail fields to user_profiles.

Revision ID: a2b3c4d5e6f7
Revises: f9148a721195
Create Date: 2026-03-26
"""
from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f7"
down_revision = "f9148a721195"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_profiles", sa.Column("first_name", sa.String(100), nullable=True))
    op.add_column("user_profiles", sa.Column("last_name", sa.String(100), nullable=True))
    op.add_column("user_profiles", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column("user_profiles", sa.Column("date_of_birth", sa.Date, nullable=True))
    op.add_column("user_profiles", sa.Column("gender", sa.String(20), nullable=True))
    op.add_column("user_profiles", sa.Column("emergency_contact_name", sa.String(200), nullable=True))
    op.add_column("user_profiles", sa.Column("emergency_contact_phone", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("user_profiles", "emergency_contact_phone")
    op.drop_column("user_profiles", "emergency_contact_name")
    op.drop_column("user_profiles", "gender")
    op.drop_column("user_profiles", "date_of_birth")
    op.drop_column("user_profiles", "phone")
    op.drop_column("user_profiles", "last_name")
    op.drop_column("user_profiles", "first_name")
