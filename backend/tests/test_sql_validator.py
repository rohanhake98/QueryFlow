import pytest
from app.services.sql_validator import validate_sql_safety


def test_select_query_passes():
    sql = "SELECT name, total FROM customers ORDER BY total DESC LIMIT 5"
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is True


def test_drop_table_is_blocked():
    sql = "DROP TABLE customers"
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is False
    assert "DROP" in reason


def test_delete_without_where_is_blocked():
    sql = "DELETE FROM orders"
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is False


def test_update_is_blocked():
    sql = "UPDATE users SET email = 'hacked@evil.com' WHERE id = 1"
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is False


def test_insert_is_blocked():
    sql = "INSERT INTO users (email) VALUES ('hacker@evil.com')"
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is False


def test_truncate_is_blocked():
    sql = "TRUNCATE TABLE orders"
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is False


def test_select_with_join_passes():
    sql = """
    SELECT c.name, SUM(o.total_amount) as total
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    GROUP BY c.name
    ORDER BY total DESC
    LIMIT 10
    """
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is True


def test_select_with_subquery_passes():
    sql = "SELECT * FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE country = 'US')"
    is_safe, reason = validate_sql_safety(sql)
    assert is_safe is True
