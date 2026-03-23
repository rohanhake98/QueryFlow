import os
import uuid
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import create_engine, text
from app.services.auth_service import get_current_user
from app.models.user import User
from app.services.schema_introspector import format_schema_for_prompt

router = APIRouter(prefix="/upload", tags=["Upload"])

# Simple in-memory storage for virtual connections (in production, use Redis or a temp DB)
VIRTUAL_CONNECTIONS = {}

@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a CSV or Excel file, parses it, and stores it in an in-memory SQLite database.
    Returns a virtual connection ID and schema.
    """
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")

    try:
        # Read file into pandas DataFrame
        if file_ext == ".csv":
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)

        # Generate a unique table name from filename
        table_name = "".join(e for e in os.path.splitext(file.filename)[0] if e.isalnum()).lower()
        if not table_name:
            table_name = "uploaded_table"

        # Create in-memory SQLite engine
        connection_id = str(uuid.uuid4())
        engine = create_engine("sqlite://")
        
        # Write DataFrame to SQLite
        df.to_sql(table_name, engine, index=False)

        # Extract schema for the LLM
        columns = []
        for col_name, dtype in df.dtypes.items():
            col_type = str(dtype).replace("object", "text").replace("int64", "integer").replace("float64", "float")
            columns.append({"name": col_name, "type": col_type})

        # Get sample rows
        sample_rows = df.head(1).to_dict(orient="records")

        schema = {
            "tables": [
                {
                    "name": table_name,
                    "columns": columns,
                    "sample_rows": sample_rows,
                    "foreign_keys": []
                }
            ]
        }

        # Store engine and schema in our virtual registry
        VIRTUAL_CONNECTIONS[connection_id] = {
            "engine": engine,
            "schema": schema,
            "db_type": "sqlite",
            "user_id": current_user.id,
            "display_name": file.filename
        }

        return {
            "connection_id": connection_id,
            "display_name": file.filename,
            "table_name": table_name,
            "schema": schema,
            "message": f"File '{file.filename}' uploaded and processed successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

def get_virtual_connection(connection_id: str, user_id: uuid.UUID):
    """Retrieves a virtual connection if it exists and belongs to the user."""
    conn = VIRTUAL_CONNECTIONS.get(connection_id)
    if not conn:
        return None
    if conn["user_id"] != user_id:
        return None
    return conn
