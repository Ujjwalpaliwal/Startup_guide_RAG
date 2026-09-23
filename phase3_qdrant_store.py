"""
Phase 3: Qdrant Storage
- Load embeddings + metadata from Phase 2
- Create Qdrant collection (idempotent) and upload all vectors
- Reads connection details from .env
"""

import json
import os
import sys
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from qdrant_client.http import models
from qdrant_client.qdrant_remote import QdrantRemote as QdrantClient
from tqdm import tqdm

# Fix Windows console encoding
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

EMBEDDINGS_DIR = Path("embeddings")
VECTORS_FILE = EMBEDDINGS_DIR / "vectors.npy"
METADATA_FILE = EMBEDDINGS_DIR / "metadata.json"
MODEL_INFO_FILE = EMBEDDINGS_DIR / "model_info.json"

BATCH_SIZE = 100


def get_client() -> QdrantClient:
    url = os.getenv("QDRANT_URL")
    api_key = os.getenv("QDRANT_API_KEY")
    if not url or not api_key:
        raise SystemExit("Missing QDRANT_URL / QDRANT_API_KEY in .env")
    return QdrantClient(url=url, api_key=api_key)


def get_collection_name() -> str:
    return os.getenv("QDRANT_COLLECTION_NAME", "startup_docs")


def ensure_collection(client: QdrantClient, name: str, dim: int) -> bool:
    existing = client.collection_exists(name)
    if existing:
        print(f"Collection '{name}' already exists, skipping creation")
        return False
    client.create_collection(
        collection_name=name,
        vectors_config=models.VectorParams(
            size=dim,
            distance=models.Distance.COSINE,
        ),
    )
    print(f"Created collection '{name}' (size={dim}, distance=COSINE)")
    return True


def main():
    print("Loading embeddings...")
    vectors = np.load(VECTORS_FILE)
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
        model_info = json.load(f)

    n = len(metadata)
    dim = vectors.shape[1]
    print(f"  {n} vectors, dim={dim}, model={model_info['model_name']}")

    if len(vectors) != n:
        raise SystemExit("Mismatch: vectors.npy and metadata.json lengths differ")

    print("\nConnecting to Qdrant...")
    client = get_client()
    collection = get_collection_name()
    print(f"  Cluster: {client.get_collections().collections}")

    ensure_collection(client, collection, dim)

    print(f"\nUploading {n} points to '{collection}'...")
    points = []
    uploaded = 0
    for i, v in enumerate(tqdm(vectors, desc="Upserting")):
        points.append(
            models.PointStruct(
                id=i,
                vector=v.tolist(),
                payload={
                    "source": metadata[i]["source"],
                    "page": metadata[i]["page"],
                    "chunk_id": metadata[i]["chunk_id"],
                    "text": metadata[i]["text"],
                },
            )
        )
        if len(points) == BATCH_SIZE:
            client.upsert(collection_name=collection, points=points)
            uploaded += len(points)
            points = []

    if points:
        client.upsert(collection_name=collection, points=points)
        uploaded += len(points)

    count = client.count(collection_name=collection, exact=True).count

    print(f"\n{'='*50}")
    print(f"Done! Uploaded {uploaded} points")
    print(f"Total points in '{collection}': {count}")


if __name__ == "__main__":
    main()