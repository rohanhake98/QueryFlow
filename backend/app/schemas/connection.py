from pydantic import BaseModel
from datetime import datetime
import uuid


class ConnectionCreateRequest(BaseModel):
    display_name: str
    db_type: str  # postgresql | mysql
    host: str
    port: int
    database_name: str
    username: str
    password: str
    ssl_mode: str = "prefer"


class ConnectionCreateResponse(BaseModel):
    connection_id: str
    display_name: str
    status: str
    schema_tables_count: int
    message: str


class ConnectionListItem(BaseModel):
    id: str
    display_name: str
    db_type: str
    host: str
    database_name: str
    schema_cached_at: datetime | None
    is_active: bool

    class Config:
        from_attributes = True


class ConnectionListResponse(BaseModel):
    connections: list[ConnectionListItem]


class SchemaRefreshResponse(BaseModel):
    message: str
    tables_count: int
    refreshed_at: datetime
