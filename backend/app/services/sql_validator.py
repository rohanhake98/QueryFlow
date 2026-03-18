import sqlparse
from sqlparse.tokens import Keyword, DDL, DML

BLOCKED_KEYWORDS = {
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE',
    'ALTER', 'CREATE', 'GRANT', 'REVOKE', 'EXEC',
    'EXECUTE', 'CALL', 'MERGE'
}


def validate_sql_safety(sql: str) -> tuple[bool, str]:
    """
    Returns (is_safe, reason).
    Returns (False, reason) if dangerous operations are detected.
    """
    parsed = sqlparse.parse(sql)

    for statement in parsed:
        stmt_type = statement.get_type()
        if stmt_type and stmt_type.upper() != 'SELECT':
            return False, f"Only SELECT queries are allowed. Detected: {stmt_type}"

        flat_tokens = list(statement.flatten())
        for token in flat_tokens:
            if token.ttype in (Keyword, DDL, DML):
                if token.normalized.upper() in BLOCKED_KEYWORDS:
                    return False, f"Blocked keyword detected: {token.normalized}"

    return True, "OK"
