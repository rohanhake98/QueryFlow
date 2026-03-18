"""
Visualization service — analyzes query result shape and decides chart type.
"""
from app.schemas.query import ColumnMeta, VisualizationMeta


DATE_TYPES = {"date", "timestamp", "timestamp without time zone", "timestamp with time zone", "datetime"}
NUMBER_TYPES = {"integer", "bigint", "smallint", "decimal", "numeric", "real", "double precision", "float", "int", "number"}
STRING_TYPES = {"character varying", "varchar", "text", "char", "string", "name"}


def classify_type(col_type: str) -> str:
    t = col_type.lower()
    if any(dt in t for dt in DATE_TYPES):
        return "date"
    if any(nt in t for nt in NUMBER_TYPES):
        return "number"
    return "string"


def decide_chart_type(columns: list[ColumnMeta], rows: list[dict]) -> VisualizationMeta:
    """Determines the best chart type based on result shape."""
    num_cols = len(columns)
    num_rows = len(rows)
    col_types = [classify_type(col.type) for col in columns]

    # Single metric → KPI Card
    if num_cols == 1 and num_rows == 1:
        return VisualizationMeta(
            chart_type="kpi",
            title=columns[0].name.replace("_", " ").title(),
        )

    # Two columns: categorical + numeric → Bar Chart
    if num_cols == 2 and col_types[0] == "string" and col_types[1] == "number":
        return VisualizationMeta(
            chart_type="bar",
            x_axis=columns[0].name,
            y_axis=columns[1].name,
            title=f"{columns[1].name.replace('_', ' ').title()} by {columns[0].name.replace('_', ' ').title()}",
        )

    # Two columns: date + numeric → Line Chart
    if num_cols == 2 and col_types[0] == "date" and col_types[1] == "number":
        return VisualizationMeta(
            chart_type="line",
            x_axis=columns[0].name,
            y_axis=columns[1].name,
            title=f"{columns[1].name.replace('_', ' ').title()} Over Time",
        )

    # Two columns: categorical + numeric, few rows → Pie Chart
    if num_cols == 2 and col_types[0] == "string" and col_types[1] == "number" and num_rows <= 10:
        return VisualizationMeta(
            chart_type="pie",
            x_axis=columns[0].name,
            y_axis=columns[1].name,
            title=f"Distribution by {columns[0].name.replace('_', ' ').title()}",
        )

    # Default → Data Table
    return VisualizationMeta(chart_type="table")
