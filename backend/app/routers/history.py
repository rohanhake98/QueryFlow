import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.history import QueryHistory
from app.services.auth_service import get_current_user
from app.schemas.query import HistoryListResponse, HistoryItem, SaveQueryRequest, SaveQueryResponse

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryListResponse)
async def get_history(
    connection_id: str | None = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    saved_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(QueryHistory).where(QueryHistory.user_id == current_user.id)

    if connection_id:
        query = query.where(QueryHistory.connection_id == uuid.UUID(connection_id))
    if saved_only:
        query = query.where(QueryHistory.is_saved == True)

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    # Fetch paginated
    query = query.order_by(QueryHistory.is_saved.desc(), QueryHistory.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return HistoryListResponse(
        total=total,
        items=[
            HistoryItem(
                id=str(h.id),
                question=h.question,
                generated_sql=h.generated_sql,
                chart_type=h.chart_type,
                row_count=h.row_count,
                execution_time_ms=h.execution_time_ms,
                status=h.status,
                is_saved=h.is_saved,
                saved_name=h.saved_name,
                was_corrected=h.was_corrected,
                created_at=h.created_at,
            )
            for h in items
        ],
    )


@router.patch("/{query_id}/save", response_model=SaveQueryResponse)
async def save_query(
    query_id: uuid.UUID,
    payload: SaveQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(QueryHistory).where(QueryHistory.id == query_id, QueryHistory.user_id == current_user.id)
    )
    history = result.scalar_one_or_none()
    if not history:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query not found")

    history.is_saved = True
    history.saved_name = payload.saved_name
    await db.commit()
    return SaveQueryResponse(message="Query saved.", saved_name=payload.saved_name)
