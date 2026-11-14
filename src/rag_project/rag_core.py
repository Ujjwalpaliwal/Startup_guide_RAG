"""
Shared RAG core: retrieval from Qdrant + generation via Groq.
Used by the phase5 CLI and the FastAPI server.
"""

import os
import re

from dotenv import load_dotenv
from fastembed import TextEmbedding
from groq import Groq

from .qdrant_conn import get_qdrant

load_dotenv()

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_LLM = "openai/gpt-oss-120b"

SYSTEM_PROMPT = (
    "You are a helpful assistant for entrepreneurs researching startups in India. "
    "Answer the user's question using ONLY the provided context. "
    "If the context does not contain the answer, say you couldn't find it in the documents. "
    "Cite your sources using bracketed numbers like [1], [2] matching the provided sources. "
    "Be concise but complete, and use bullet points when helpful. "
    "Do not include internal citation tokens such as \u30101\u2020L1-L3\u3011."
)

_CITATION_ARTIFACT = re.compile(r"\u3010[^\u3011]*\u3011")


def clean_answer(text: str) -> str:
    text = _CITATION_ARTIFACT.sub("", text)
    text = re.sub(r"[\u00a0\u202f]", " ", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

_embedder: TextEmbedding | None = None


def get_embedder() -> TextEmbedding:
    global _embedder
    if _embedder is None:
        _embedder = TextEmbedding(MODEL_NAME)
    return _embedder


def retrieve(query: str, top_k: int = 4):
    collection = os.getenv("QDRANT_COLLECTION_NAME", "startup_docs")
    query_vector = next(get_embedder().embed([query])).tolist()

    client = get_qdrant()
    response = client.query_points(
        collection_name=collection,
        query=query_vector,
        limit=top_k,
        with_payload=True,
    )
    return response.points


def build_context(hits) -> tuple[str, list[dict]]:
    parts = []
    sources = []
    for i, hit in enumerate(hits, 1):
        p = hit.payload
        parts.append(f"[{i}] (source: {p['source']}, page: {p['page']})\n{p['text']}")
        sources.append({"source": p["source"], "page": p["page"]})
    return "\n\n---\n\n".join(parts), sources


def generate_answer(
    query: str,
    context: str,
    model: str = DEFAULT_LLM,
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GROQ_API_KEY in .env")

    client = Groq(api_key=api_key)
    chat = client.chat.completions.create(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Context from the documents:\n\n{context}\n\n"
                    f"Question: {query}"
                ),
            },
        ],
    )
    return clean_answer(chat.choices[0].message.content)


def answer_query(
    query: str,
    top_k: int = 4,
    model: str = DEFAULT_LLM,
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> dict:
    hits = retrieve(query, top_k)
    if not hits:
        return {
            "answer": "No relevant documents were found in the index.",
            "sources": [],
        }

    context, sources = build_context(hits)
    answer = generate_answer(query, context, model, temperature, max_tokens)
    return {"answer": answer, "sources": sources}