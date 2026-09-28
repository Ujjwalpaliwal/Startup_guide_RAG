"""
Phase 4: Retrieval
- Embed a query with the same model used in Phase 2
- Search Qdrant for top-k matching chunks
- Usage: python phase4_retrieval.py "your question" [--top-k 5]
"""

import argparse
import os
import sys

from dotenv import load_dotenv
from fastembed import TextEmbedding
from qdrant_client.qdrant_remote import QdrantRemote as QdrantClient

# Fix Windows console encoding
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def get_client() -> QdrantClient:
    url = os.getenv("QDRANT_URL")
    api_key = os.getenv("QDRANT_API_KEY")
    if not url or not api_key:
        raise SystemExit("Missing QDRANT_URL / QDRANT_API_KEY in .env")
    return QdrantClient(url=url, api_key=api_key)


def main():
    parser = argparse.ArgumentParser(description="Search the RAG index")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--top-k", type=int, default=5, help="Number of results")
    args = parser.parse_args()

    print(f"Loading model: {MODEL_NAME}")
    model = TextEmbedding(MODEL_NAME)

    print(f"\nQuery: {args.query}")
    query_vector = next(model.embed([args.query])).tolist()

    collection = os.getenv("QDRANT_COLLECTION_NAME", "startup_docs")
    print(f"Searching '{collection}' (top-k={args.top_k})\n")

    client = get_client()
    response = client.query_points(
        collection_name=collection,
        query=query_vector,
        limit=args.top_k,
        with_payload=True,
    )
    hits = response.points

    print(f"{'='*80}")
    for rank, hit in enumerate(hits, 1):
        payload = hit.payload
        print(f"\n[{rank}] score={hit.score:.4f}")
        print(f"    source : {payload['source']}")
        print(f"    page   : {payload['page']} | chunk #{payload['chunk_id']}")
        text = payload["text"]
        print(f"    text   : {text[:300]}{'...' if len(text) > 300 else ''}")
    print(f"\n{'='*80}")

    if not hits:
        print("No results found.")


if __name__ == "__main__":
    main()