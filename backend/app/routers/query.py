import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.user import User
from app.models.history import QueryHistory
from app.services.auth_service import get_current_user
from app.services.connection_service import get_connection_or_403
from app.services.nl2sql_engine import NL2SQLEngine
from app.services.sql_validator import validate_sql_safety
from app.services.visualization_service import decide_chart_type
from app.utils.encryption import decrypt_password
from app.schemas.query import (
    QueryAskRequest, QueryAskResponse, QueryResult, ColumnMeta, VisualizationMeta,
    HistoryListResponse, HistoryItem, SaveQueryRequest, SaveQueryResponse,
)
from app.services.schema_introspector import build_connection_url
from app.routers.upload import get_virtual_connection
from sqlalchemy import select

router = APIRouter(prefix="/query", tags=["Query"])


def _infer_col_type(value) -> str:
    """Infer column type from a Python value."""
    if isinstance(value, (int, float)):
        return "number"
    if hasattr(value, 'isoformat'):
        return "date"
    return "string"


def _execute_query_with_pagination(engine, sql: str, limit: int, offset: int):
    """Executes a query with pagination and total count using subqueries."""
    # Ensure SQL doesn't end with a semicolon for wrapping
    sql = sql.strip().rstrip(';')
    
    # Wrap in subquery for pagination
    paginated_sql = f"SELECT * FROM ({sql}) AS subquery LIMIT :limit OFFSET :offset"
    # Wrap in subquery for total count
    count_sql = f"SELECT COUNT(*) FROM ({sql}) AS subquery"
    
    with engine.connect() as conn:
        # Get total count
        count_result = conn.execute(text(count_sql))
        total_count = count_result.scalar() or 0
        
        # Get paginated results
        result = conn.execute(text(paginated_sql), {"limit": limit, "offset": offset})
        raw_rows = result.fetchall()
        col_names = list(result.keys())
        
        return raw_rows, col_names, total_count


@router.post("/ask", response_model=QueryAskResponse)
async def ask_query(
    payload: QueryAskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Try finding connection in DB first
    connection = None
    virtual_conn = None
    schema_cache = None
    db_type = None

    try:
        connection = await get_connection_or_403(
            uuid.UUID(payload.connection_id), current_user.id, db
        )
        schema_cache = connection.schema_cache
        db_type = connection.db_type
    except HTTPException:
        # Fall back to virtual connections (file uploads)
        virtual_conn = get_virtual_connection(payload.connection_id, current_user.id)
        if not virtual_conn:
            raise HTTPException(status_code=404, detail="Database connection or virtual source not found.")
        schema_cache = virtual_conn["schema"]
        db_type = virtual_conn["db_type"]

    if not schema_cache:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schema not cached. Please refresh the connection schema first.",
        )

    # Generate SQL
    engine_svc = NL2SQLEngine()
    generated_sql = await engine_svc.generate_sql(payload.question, schema_cache, db_type)

    # Safety check
    is_safe, reason = validate_sql_safety(generated_sql)
    if not is_safe:
        # Only log DB-backed queries to history for now, or skip logging if it's virtual
        if connection:
            history = QueryHistory(
                user_id=current_user.id,
                connection_id=connection.id,
                question=payload.question,
                generated_sql=generated_sql,
                status="blocked",
                error_message=reason,
            )
            db.add(history)
            await db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Query blocked: {reason}")

    # Set up engine for execution
    if connection:
        plain_pw = decrypt_password(connection.encrypted_password)
        db_url = build_connection_url(
            connection.db_type, connection.host, connection.port,
            connection.database_name, connection.username, plain_pw, connection.ssl_mode
        )
        user_engine = create_engine(db_url)
    else:
        user_engine = virtual_conn["engine"]

    was_corrected = False
    start_time = time.time()
    rows_data = []
    columns_meta = []
    total_count = 0

    try:
        raw_rows, col_names, total_count = _execute_query_with_pagination(
            user_engine, generated_sql, payload.limit, payload.offset
        )

        if raw_rows:
            columns_meta = [
                ColumnMeta(name=col, type=_infer_col_type(raw_rows[0][i]))
                for i, col in enumerate(col_names)
            ]
        else:
            columns_meta = [ColumnMeta(name=col, type="string") for col in col_names]

        rows_data = [dict(zip(col_names, row)) for row in raw_rows]

    except Exception as exec_error:
        # Auto-retry once
        try:
            corrected_sql = await engine_svc.generate_sql_with_retry(
                payload.question, schema_cache, db_type, str(exec_error)
            )
            is_safe2, reason2 = validate_sql_safety(corrected_sql)
            if not is_safe2:
                raise HTTPException(status_code=403, detail=f"Corrected query blocked: {reason2}")

            raw_rows, col_names, total_count = _execute_query_with_pagination(
                user_engine, corrected_sql, payload.limit, payload.offset
            )
            columns_meta = [
                ColumnMeta(name=col, type=_infer_col_type(raw_rows[0][i]) if raw_rows else "string")
                for i, col in enumerate(col_names)
            ]
            rows_data = [dict(zip(col_names, row)) for row in raw_rows]

            generated_sql = corrected_sql
            was_corrected = True
        except Exception as retry_error:
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Advanced Error Analysis: Let the LLM explain why it's failing
            error_explanation = await engine_svc.explain_query_failure(
                payload.question, schema_cache, str(retry_error)
            )
            
            if connection:
                history = QueryHistory(
                    user_id=current_user.id,
                    connection_id=connection.id,
                    question=payload.question,
                    generated_sql=generated_sql,
                    status="error",
                    error_message=f"{str(retry_error)} | Explanation: {error_explanation}",
                    execution_time_ms=execution_time_ms,
                )
                db.add(history)
                await db.commit()
            
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": str(retry_error),
                    "explanation": error_explanation
                }
            )

    execution_time_ms = int((time.time() - start_time) * 1000)
    visualization = decide_chart_type(columns_meta, rows_data)

    # Save to history
    if connection:
        history = QueryHistory(
            user_id=current_user.id,
            connection_id=connection.id,
            question=payload.question,
            generated_sql=generated_sql,
            was_corrected=was_corrected,
            execution_time_ms=execution_time_ms,
            row_count=len(rows_data),
            chart_type=visualization.chart_type,
            status="success",
        )
        db.add(history)
        await db.commit()
        await db.refresh(history)
        query_id = str(history.id)
    else:
        # Virtual queries don't have persistent history IDs yet
        query_id = f"virtual-{uuid.uuid4()}"

    return QueryAskResponse(
        query_id=query_id,
        question=payload.question,
        generated_sql=generated_sql,
        was_corrected=was_corrected,
        execution_time_ms=execution_time_ms,
        result=QueryResult(
            columns=columns_meta,
            rows=rows_data,
            row_count=len(rows_data),
            total=total_count,
            limit=payload.limit,
            offset=payload.offset
        ),
        visualization=visualization,
    )
