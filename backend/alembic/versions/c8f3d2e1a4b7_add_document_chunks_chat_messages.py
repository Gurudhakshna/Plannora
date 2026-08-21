"""add_document_chunks_chat_messages

Revision ID: c8f3d2e1a4b7
Revises: 6975030d988a
Create Date: 2026-08-21 12:30:00.000000

Adds two new tables:
  - document_chunks: stores chunked text from uploaded documents for RAG
  - chat_messages:   persists chat conversation history

NOTE: The embedding vector column for document_chunks is NOT included in
this migration. It will be added in a separate migration after Member 3
(AI/RAG) confirms the embedding model and dimension. That migration will
also enable the pgvector extension and create the vector similarity index.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8f3d2e1a4b7'
down_revision: Union[str, Sequence[str], None] = '6975030d988a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create document_chunks and chat_messages tables."""
    # ------------------------------------------------------------------
    # document_chunks — stores chunked text from uploaded documents
    # ------------------------------------------------------------------
    op.create_table('document_chunks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=True),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('chunk_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_chunks_id'), 'document_chunks', ['id'], unique=False)
    op.create_index(op.f('ix_document_chunks_document_id'), 'document_chunks',
                    ['document_id'], unique=False)
    op.create_index(op.f('ix_document_chunks_user_id'), 'document_chunks',
                    ['user_id'], unique=False)

    # ------------------------------------------------------------------
    # chat_messages — persists chat conversation history
    # ------------------------------------------------------------------
    op.create_table('chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_id'), 'chat_messages', ['id'], unique=False)
    op.create_index(op.f('ix_chat_messages_user_id'), 'chat_messages',
                    ['user_id'], unique=False)
    op.create_index(op.f('ix_chat_messages_session_id'), 'chat_messages',
                    ['session_id'], unique=False)


def downgrade() -> None:
    """Drop document_chunks and chat_messages tables."""
    op.drop_index(op.f('ix_chat_messages_session_id'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_user_id'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_id'), table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_index(op.f('ix_document_chunks_user_id'), table_name='document_chunks')
    op.drop_index(op.f('ix_document_chunks_document_id'), table_name='document_chunks')
    op.drop_index(op.f('ix_document_chunks_id'), table_name='document_chunks')
    op.drop_table('document_chunks')
