"""
RAG API server
- POST /api/query  -> {answer, sources}
- GET  /api/health -> {status, collection, chunks}

Run: uvicorn api:app --reload --port 8000
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag_project.rag_core import DEFAULT_LLM, answer_query

load_dotenv()

app = FastAPI(title="Startup RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(4, ge=1, le=20)
    model: str = DEFAULT_LLM
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    max_tokens: int = Field(1024, ge=64, le=8192)


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "collection": os.getenv("QDRANT_COLLECTION_NAME", "startup_docs"),
        "model": DEFAULT_LLM,
    }


@app.post("/api/query", response_model=QueryResponse)
def query(req: QueryRequest):
    return answer_query(
        req.query,
        top_k=req.top_k,
        model=req.model,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)