# SQLAlchemy ORM models package
#
# Import all models here so that Base.metadata is aware of them.
# This is required for Alembic autogenerate to detect tables.

from app.models.user import User  # noqa: F401
from app.models.subject import Subject  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.quiz import Quiz, QuizQuestion, QuizResult  # noqa: F401
from app.models.flashcard import Flashcard  # noqa: F401
from app.models.exam import Exam, ExamQuestion, ExamResult  # noqa: F401
from app.models.planner import PlannerItem  # noqa: F401
