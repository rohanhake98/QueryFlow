"""
Schema introspection service.
Connects to the user's database and extracts all table/column/FK metadata.
"""
from sqlalchemy import text, create_engine
from sqlalchemy.exc import OperationalError


POSTGRES_SCHEMA_QUERY = """
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.ordinal_position,
    tc.constraint_type,
    kcu2.table_name AS ref_table,
    kcu2.column_name AS ref_column
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
    ON kcu.table_name = c.table_name AND kcu.column_name = c.column_name
    AND kcu.table_schema = c.table_schema
LEFT JOIN information_schema.table_constraints tc
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
    AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
LEFT JOIN information_schema.key_column_usage kcu2
    ON kcu2.constraint_name = rc.unique_constraint_name
    AND kcu2.ordinal_position = kcu.ordinal_position
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
"""

MYSQL_SCHEMA_QUERY = """
SELECT
    c.TABLE_NAME AS table_name,
    c.COLUMN_NAME AS column_name,
    c.DATA_TYPE AS data_type,
    c.IS_NULLABLE AS is_nullable,
    c.ORDINAL_POSITION AS ordinal_position,
    kcu.REFERENCED_TABLE_NAME AS ref_table,
    kcu.REFERENCED_COLUMN_NAME AS ref_column
FROM information_schema.COLUMNS c
LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
    ON kcu.TABLE_SCHEMA = c.TABLE_SCHEMA
    AND kcu.TABLE_NAME = c.TABLE_NAME
    AND kcu.COLUMN_NAME = c.COLUMN_NAME
    AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
WHERE c.TABLE_SCHEMA = DATABASE()
ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;
"""


def build_connection_url(db_type: str, host: str, port: int, database_name: str, username: str, password: str, ssl_mode: str) -> str:
    if db_type == "postgresql":
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database_name}"
    elif db_type == "mysql":
        return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database_name}"
    else:
        raise ValueError(f"Unsupported DB type: {db_type}")


def test_and_introspect(db_type: str, host: str, port: int, database_name: str, username: str, password: str, ssl_mode: str) -> dict:
    """
    Tests the connection and returns the full schema as a dict.
    Raises an exception on failure.
    """
    url = build_connection_url(db_type, host, port, database_name, username, password, ssl_mode)
    try:
        engine = create_engine(url, connect_args={"connect_timeout": 10} if db_type == "postgresql" else {})
        with engine.connect() as conn:
            query = POSTGRES_SCHEMA_QUERY if db_type == "postgresql" else MYSQL_SCHEMA_QUERY
            rows = conn.execute(text(query)).fetchall()
    except OperationalError as e:
        raise ConnectionError(str(e))

    # Build schema dict
    tables: dict[str, dict] = {}
    for row in rows:
        tname = row[0]
        col_name = row[1]
        col_type = row[2]
        ref_table = row[6] if len(row) > 6 else None
        ref_column = row[7] if len(row) > 7 else None

        if tname not in tables:
            tables[tname] = {"name": tname, "columns": [], "foreign_keys": []}

        # Add column if not already added
        existing_cols = [c["name"] for c in tables[tname]["columns"]]
        if col_name not in existing_cols:
            tables[tname]["columns"].append({"name": col_name, "type": col_type})

        # Add FK
        if ref_table and ref_column:
            fk = {"column": col_name, "ref_table": ref_table, "ref_column": ref_column}
            if fk not in tables[tname]["foreign_keys"]:
                tables[tname]["foreign_keys"].append(fk)

    return {"tables": list(tables.values())}


def format_schema_for_prompt(schema_json: dict) -> str:
    """
    Converts stored schema JSON into a compact, LLM-readable string.
    Minimizes token usage while preserving all necessary information.
    """
    lines = []
    for table in schema_json.get("tables", []):
        col_defs = ", ".join([
            f"{col['name']} ({col['type']})"
            for col in table["columns"]
        ])
        lines.append(f"Table: {table['name']} | Columns: {col_defs}")

        if table.get("foreign_keys"):
            for fk in table["foreign_keys"]:
                lines.append(f"  → FK: {table['name']}.{fk['column']} → {fk['ref_table']}.{fk['ref_column']}")

    return "\n".join(lines)
