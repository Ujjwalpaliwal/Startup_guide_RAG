"""
Phase 2: Embeddings Generation
- Load chunks from Phase 1
- Generate embeddings using sentence-transformers
- Save vectors as numpy array + metadata
"""

import json
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# Fix Windows console encoding
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CHUNKS_FILE = Path("processed_data/chunks.jsonl")
OUTPUT_DIR = Path("embeddings")
OUTPUT_DIR.mkdir(exist_ok=True)

MODEL_NAME = "all-MiniLM-L6-v2"  # Fast, good quality, 384 dimensions


def load_chunks():
    """Load chunks from JSONL file."""
    chunks = []
    with open(CHUNKS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            chunks.append(json.loads(line))
    return chunks


def generate_embeddings(chunks, model):
    """Generate embeddings for all chunks."""
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(
        texts,
        show_progress_bar=True,
        batch_size=32,
        convert_to_numpy=True,
    )
    return embeddings


def main():
    print("Loading chunks...")
    chunks = load_chunks()
    print(f"  Loaded {len(chunks)} chunks")

    print(f"\nLoading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    print("\nGenerating embeddings...")
    embeddings = generate_embeddings(chunks, model)
    print(f"  Shape: {embeddings.shape}")

    # Save embeddings
    embeddings_file = OUTPUT_DIR / "vectors.npy"
    np.save(embeddings_file, embeddings)
    print(f"\nSaved embeddings: {embeddings_file}")

    # Save metadata (text + source info)
    metadata = []
    for c in chunks:
        metadata.append({
            "source": c["source"],
            "page": c["page"],
            "chunk_id": c["chunk_id"],
            "text": c["text"],
        })

    metadata_file = OUTPUT_DIR / "metadata.json"
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"Saved metadata: {metadata_file}")

    # Save model info
    model_info = {
        "model_name": MODEL_NAME,
        "embedding_dim": embeddings.shape[1],
        "total_chunks": len(chunks),
    }
    info_file = OUTPUT_DIR / "model_info.json"
    with open(info_file, "w", encoding="utf-8") as f:
        json.dump(model_info, f, indent=2)
    print(f"Saved model info: {info_file}")

    print(f"\n{'='*50}")
    print(f"Done! {len(chunks)} chunks vectorized")
    print(f"Output folder: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
