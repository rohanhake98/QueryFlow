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
from sqlalchemy import select

router = APIRouter(prefix="/query", tags=["Query"])


def _infer_col_type(value) -> str:
    """Infer column type from a Python value."""
    if isinstance(value, (int, float)):
        return "number"
    if hasattr(value, 'isoformat'):
        return "date"
    return "string"


@router.post("/ask", response_model=QueryAskResponse)
async def ask_query(
    payload: QueryAskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    connection = await get_connection_or_403(
        uuid.UUID(payload.connection_id), current_user.id, db
    )

    if not connection.schema_cache:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schema not cached. Please refresh the connection schema first.",
        )

    # Generate SQL
    engine_svc = NL2SQLEngine()
    generated_sql = await engine_svc.generate_sql(payload.question, connection.schema_cache, connection.db_type)

    # Safety check
    is_safe, reason = validate_sql_safety(generated_sql)
    if not is_safe:
        # Log blocked query
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

    # Execute SQL against user's DB
    plain_pw = decrypt_password(connection.encrypted_password)
    db_url = build_connection_url(
        connection.db_type, connection.host, connection.port,
        connection.database_name, connection.username, plain_pw, connection.ssl_mode
    )

    was_corrected = False
    start_time = time.time()
    rows_data = []
    columns_meta = []

    try:
        user_engine = create_engine(db_url)
        with user_engine.connect() as conn:
            result = conn.execute(text(generated_sql))
            raw_rows = result.fetchall()
            col_names = list(result.keys())

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
                payload.question, connection.schema_cache, connection.db_type, str(exec_error)
            )
            is_safe2, reason2 = validate_sql_safety(corrected_sql)
            if not is_safe2:
                raise HTTPException(status_code=403, detail=f"Corrected query blocked: {reason2}")

            user_engine = create_engine(db_url)
            with user_engine.connect() as conn:
                result = conn.execute(text(corrected_sql))
                raw_rows = result.fetchall()
                col_names = list(result.keys())
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
                payload.question, connection.schema_cache, str(retry_error)
            )
            
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

    return QueryAskResponse(
        query_id=str(history.id),
        question=payload.question,
        generated_sql=generated_sql,
        was_corrected=was_corrected,
        execution_time_ms=execution_time_ms,
        result=QueryResult(columns=columns_meta, rows=rows_data, row_count=len(rows_data)),
        visualization=visualization,
    )
