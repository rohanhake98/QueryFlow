"""
Connection Service — manages db_connections CRUD and schema operations.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.connection import DBConnection
from app.utils.encryption import encrypt_password, decrypt_password
from app.services.schema_introspector import test_and_introspect


async def create_connection(
    user_id: uuid.UUID,
    display_name: str,
    db_type: str,
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    ssl_mode: str,
    db: AsyncSession,
) -> DBConnection:
    # Test connection and get schema
    try:
        schema = test_and_introspect(db_type, host, port, database_name, username, password, ssl_mode)
    except ConnectionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Connection failed: {str(e)}")

    connection = DBConnection(
        user_id=user_id,
        display_name=display_name,
        db_type=db_type,
        host=host,
        port=port,
        database_name=database_name,
        username=username,
        encrypted_password=encrypt_password(password),
        ssl_mode=ssl_mode,
        schema_cache=schema,
        schema_cached_at=datetime.now(timezone.utc),
        last_tested_at=datetime.now(timezone.utc),
        is_active=True,
    )
    db.add(connection)
    await db.commit()
    await db.refresh(connection)
    return connection


async def get_user_connections(user_id: uuid.UUID, db: AsyncSession) -> list[DBConnection]:
    result = await db.execute(
        select(DBConnection).where(DBConnection.user_id == user_id, DBConnection.is_active == True)
    )
    return result.scalars().all()


async def get_connection_or_403(connection_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> DBConnection:
    result = await db.execute(
        select(DBConnection)
        .where(DBConnection.id == connection_id)
        .where(DBConnection.user_id == user_id)
    )
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Connection not found or access denied")
    return connection


async def refresh_schema(connection: DBConnection, db: AsyncSession) -> int:
    plain_pw = decrypt_password(connection.encrypted_password)
    schema = test_and_introspect(
        connection.db_type, connection.host, connection.port,
        connection.database_name, connection.username, plain_pw, connection.ssl_mode
    )
    connection.schema_cache = schema
    connection.schema_cached_at = datetime.now(timezone.utc)
    await db.commit()
    return len(schema["tables"])


async def delete_connection(connection: DBConnection, db: AsyncSession) -> None:
    connection.is_active = False
    await db.commit()
