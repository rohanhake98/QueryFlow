import pytest
from app.services.schema_introspector import format_schema_for_prompt


SAMPLE_SCHEMA = {
    "tables": [
        {
            "name": "customers",
            "columns": [
                {"name": "id", "type": "integer"},
                {"name": "name", "type": "varchar"},
                {"name": "email", "type": "varchar"},
            ],
            "foreign_keys": [],
        },
        {
            "name": "orders",
            "columns": [
                {"name": "id", "type": "integer"},
                {"name": "customer_id", "type": "integer"},
                {"name": "total_amount", "type": "decimal"},
            ],
            "foreign_keys": [
                {"column": "customer_id", "ref_table": "customers", "ref_column": "id"}
            ],
        },
    ]
}


def test_format_schema_contains_table_names():
    formatted = format_schema_for_prompt(SAMPLE_SCHEMA)
    assert "customers" in formatted
    assert "orders" in formatted


def test_format_schema_contains_columns():
    formatted = format_schema_for_prompt(SAMPLE_SCHEMA)
    assert "name (varchar)" in formatted
    assert "total_amount (decimal)" in formatted


def test_format_schema_contains_foreign_keys():
    formatted = format_schema_for_prompt(SAMPLE_SCHEMA)
    assert "→ FK: orders.customer_id → customers.id" in formatted


def test_format_schema_empty():
    formatted = format_schema_for_prompt({"tables": []})
    assert formatted == ""
