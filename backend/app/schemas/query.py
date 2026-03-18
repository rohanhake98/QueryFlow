from pydantic import BaseModel
from datetime import datetime
from typing import Any


class QueryAskRequest(BaseModel):
    connection_id: str
    question: str


class ColumnMeta(BaseModel):
    name: str
    type: str


class QueryResult(BaseModel):
    columns: list[ColumnMeta]
    rows: list[dict[str, Any]]
    row_count: int


class VisualizationMeta(BaseModel):
    chart_type: str  # bar | line | pie | kpi | table
    x_axis: str | None = None
    y_axis: str | None = None
    title: str | None = None


class QueryAskResponse(BaseModel):
    query_id: str
    question: str
    generated_sql: str
    was_corrected: bool
    execution_time_ms: int
    result: QueryResult
    visualization: VisualizationMeta


class HistoryItem(BaseModel):
    id: str
    question: str
    generated_sql: str
    chart_type: str | None
    row_count: int | None
    execution_time_ms: int | None
    status: str
    is_saved: bool
    saved_name: str | None = None
    was_corrected: bool
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryListResponse(BaseModel):
    total: int
    items: list[HistoryItem]


class SaveQueryRequest(BaseModel):
    saved_name: str


class SaveQueryResponse(BaseModel):
    message: str
    saved_name: str
