"""
Shared RAG core: retrieval from Qdrant + generation via Groq.
Used by the phase5 CLI and the FastAPI server.
"""

import os

from dotenv import load_dotenv
from fastembed import TextEmbedding
from groq import Groq
from qdrant_client.qdrant_remote import QdrantRemote as QdrantClient

load_dotenv()

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_LLM = "openai/gpt-oss-120b"

SYSTEM_PROMPT = (
    "You are a helpful assistant for entrepreneurs researching startups in India. "
    "Answer the user's question using ONLY the provided context. "
    "If the context does not contain the answer, say you couldn't find it in the documents. "
    "Cite your sources using bracketed numbers like [1], [2] matching the provided sources. "
    "Be concise but complete, and use bullet points when helpful."
)

_embedder: TextEmbedding | None = None


def get_qdrant() -> QdrantClient:
    url = os.getenv("QDRANT_URL")
    api_key = os.getenv("QDRANT_API_KEY")
    if not url or not api_key:
        raise SystemExit("Missing QDRANT_URL / QDRANT_API_KEY in .env")
    return QdrantClient(url=url, api_key=api_key)


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
    return chat.choices[0].message.content.strip()


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