"""
NL2SQL Engine — converts plain English questions into SQL using LangChain + LLM.
Supports Google Gemini (default, free tier) and OpenAI GPT-4o.
"""
from app.config import get_settings

settings = get_settings()

SYSTEM_PROMPT_TEMPLATE = """You are an expert SQL query generator. Your job is to convert a user's question
written in plain English into a valid, safe, and efficient SQL query.

RULES YOU MUST FOLLOW:
1. ONLY generate SELECT queries. NEVER generate INSERT, UPDATE, DELETE, DROP, 
   TRUNCATE, ALTER, CREATE, or any other data-modifying statement.
2. Use ONLY the tables and columns listed in the schema below.
3. Do NOT invent column names. If you are unsure, use the closest matching column.
4. Always use table aliases for readability (e.g., c for customers, o for orders).
5. For date filtering, use appropriate SQL functions based on the DB dialect.
6. Add LIMIT 1000 if the query does not already have a LIMIT clause.
7. Return ONLY the SQL query, with no explanation, no markdown, no backticks.
8. The SQL must be valid for {db_type} syntax.

DATABASE SCHEMA:
{schema}

USER QUESTION:
{question}

SQL QUERY:
"""


def _build_llm():
    """Create and return the configured LLM instance."""
    provider = settings.DEFAULT_LLM_PROVIDER

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0,
            google_api_key=settings.GEMINI_API_KEY,
            convert_system_message_to_human=True,
        )
    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            max_tokens=1000,
            api_key=settings.OPENAI_API_KEY,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}. Choose 'gemini' or 'openai'.")


class NL2SQLEngine:
    def __init__(self, llm_provider: str | None = None):
        # Allow override per-request, fall back to settings
        if llm_provider:
            original = settings.DEFAULT_LLM_PROVIDER
            settings.DEFAULT_LLM_PROVIDER = llm_provider
            self.llm = _build_llm()
            settings.DEFAULT_LLM_PROVIDER = original
        else:
            self.llm = _build_llm()

        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        self.chain = (
            ChatPromptTemplate.from_template(SYSTEM_PROMPT_TEMPLATE)
            | self.llm
            | StrOutputParser()
        )

    async def generate_sql(self, question: str, schema: dict, db_type: str) -> str:
        from app.services.schema_introspector import format_schema_for_prompt
        formatted_schema = format_schema_for_prompt(schema)

        raw_sql = await self.chain.ainvoke({
            "question": question,
            "schema": formatted_schema,
            "db_type": db_type,
        })

        # Clean any accidental markdown code fences
        sql = raw_sql.strip()
        for fence in ["```sql", "```SQL", "```"]:
            sql = sql.replace(fence, "")
        return sql.strip()

    async def generate_sql_with_retry(
        self,
        question: str,
        schema: dict,
        db_type: str,
        error_message: str,
    ) -> str:
        """Called when the first SQL attempt failed. Feeds the error back to the LLM."""
        from app.services.schema_introspector import format_schema_for_prompt
        retry_prompt = f"""The previous SQL query failed with this error:
ERROR: {error_message}

Original question: {question}

Please generate a corrected SQL query that avoids this error.
Use ONLY these tables and columns:
{format_schema_for_prompt(schema)}

Return ONLY the corrected SQL query with no explanation.
"""
        result = await self.llm.ainvoke(retry_prompt)
        raw = result.content.strip() if hasattr(result, "content") else str(result).strip()
        for fence in ["```sql", "```SQL", "```"]:
            raw = raw.replace(fence, "")
        return raw.strip()

    async def explain_query_failure(self, question: str, schema: dict, error_message: str) -> str:
        """Explains to the user why their question might be resulting in SQL errors."""
        from app.services.schema_introspector import format_schema_for_prompt
        explain_prompt = f"""The user asked: "{question}"
The database returned this error: {error_message}

Based on the schema below, explain in plain English why this query might be failing or if the question is impossible to answer with the current data.
{format_schema_for_prompt(schema)}

Keep the explanation concise and helpful (2-3 sentences max).
"""
        result = await self.llm.ainvoke(explain_prompt)
        raw = result.content.strip() if hasattr(result, "content") else str(result).strip()
        return raw
