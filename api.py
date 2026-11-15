"""
RAG API server
- POST /api/query      -> {answer, sources}
- POST /api/transcribe -> {text, language}  (speech-to-text via Groq Whisper)
- GET  /api/health     -> {status, collection, model, languages}

Run: uvicorn api:app --reload --port 8000
"""

import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

from rag_project.rag_core import (
    DEFAULT_LANGUAGE,
    DEFAULT_LLM,
    SUPPORTED_LANGUAGES,
    answer_query,
)

load_dotenv()

Language = Literal["en", "hi"]
WHISPER_MODEL = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")

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
    language: Language = DEFAULT_LANGUAGE


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]


class TranscriptionResponse(BaseModel):
    text: str
    language: str


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "collection": os.getenv("QDRANT_COLLECTION_NAME", "startup_docs"),
        "model": DEFAULT_LLM,
        "languages": list(SUPPORTED_LANGUAGES),
        "speech_to_text": WHISPER_MODEL,
    }


@app.post("/api/query", response_model=QueryResponse)
def query(req: QueryRequest):
    return answer_query(
        req.query,
        top_k=req.top_k,
        model=req.model,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        language=req.language,
    )


@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(...),
    language: Literal["auto", "en", "hi"] = Form("auto"),
):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in .env")

    audio = await file.read()
    if not audio:
        raise HTTPException(status_code=400, detail="Empty audio file")

    params = {
        "model": WHISPER_MODEL,
        "response_format": "verbose_json",
        "temperature": 0.0,
    }
    if language in SUPPORTED_LANGUAGES:
        params["language"] = language

    try:
        result = Groq(api_key=api_key).audio.transcriptions.create(
            file=(file.filename or "audio.webm", audio),
            **params,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Transcription failed: {exc}"
        ) from exc

    return {
        "text": (getattr(result, "text", "") or "").strip(),
        "language": getattr(result, "language", None) or (
            language if language != "auto" else ""
        ),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)