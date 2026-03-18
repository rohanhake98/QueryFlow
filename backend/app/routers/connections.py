import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.connection_service import (
    create_connection, get_user_connections, get_connection_or_403, refresh_schema, delete_connection
)
from app.schemas.connection import (
    ConnectionCreateRequest, ConnectionCreateResponse,
    ConnectionListResponse, ConnectionListItem, SchemaRefreshResponse,
)

router = APIRouter(prefix="/connections", tags=["Connections"])


@router.post("", response_model=ConnectionCreateResponse, status_code=201)
async def add_connection(
    payload: ConnectionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    connection = await create_connection(
        user_id=current_user.id,
        display_name=payload.display_name,
        db_type=payload.db_type,
        host=payload.host,
        port=payload.port,
        database_name=payload.database_name,
        username=payload.username,
        password=payload.password,
        ssl_mode=payload.ssl_mode,
        db=db,
    )
    tables_count = len(connection.schema_cache.get("tables", [])) if connection.schema_cache else 0
    return ConnectionCreateResponse(
        connection_id=str(connection.id),
        display_name=connection.display_name,
        status="connected",
        schema_tables_count=tables_count,
        message="Connection successful. Schema cached.",
    )


@router.get("", response_model=ConnectionListResponse)
async def list_connections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    connections = await get_user_connections(current_user.id, db)
    items = [
        ConnectionListItem(
            id=str(c.id),
            display_name=c.display_name,
            db_type=c.db_type,
            host=c.host,
            database_name=c.database_name,
            schema_cached_at=c.schema_cached_at,
            is_active=c.is_active,
        )
        for c in connections
    ]
    return ConnectionListResponse(connections=items)


@router.post("/{connection_id}/refresh-schema", response_model=SchemaRefreshResponse)
async def refresh_connection_schema(
    connection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    connection = await get_connection_or_403(connection_id, current_user.id, db)
    tables_count = await refresh_schema(connection, db)
    return SchemaRefreshResponse(
        message="Schema refreshed.",
        tables_count=tables_count,
        refreshed_at=datetime.now(timezone.utc),
    )


@router.delete("/{connection_id}", status_code=204)
async def remove_connection(
    connection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    connection = await get_connection_or_403(connection_id, current_user.id, db)
    await delete_connection(connection, db)
