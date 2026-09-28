"""
Phase 5: RAG Generation
- Retrieve top-k chunks from Qdrant
- Feed them to Groq LLM to generate a cited answer
- Usage: python phase5_generate.py "your question" [--top-k N] [--model NAME]
"""

import argparse
import sys

# Fix Windows console encoding
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from rag_project.rag_core import (  # noqa: E402
    DEFAULT_LLM,
    answer_query,
    build_context,
    generate_answer,
    retrieve,
)


def print_answer(result: dict, query: str):
    print(f"{'='*80}")
    print(f"Q: {query}")
    print(f"{'='*80}\n")
    print(result["answer"])
    if result["sources"]:
        print(f"\n{'='*80}")
        print("Sources")
        for i, s in enumerate(result["sources"], 1):
            print(f"  [{i}] {s['source']} — page {s['page']}")
        print(f"{'='*80}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ask a question against the RAG index")
    parser.add_argument("query", help="Your question")
    parser.add_argument("--top-k", type=int, default=4, help="Chunks to retrieve")
    parser.add_argument("--model", default=DEFAULT_LLM, help="Groq model name")
    parser.add_argument("--temperature", type=float, default=0.3, help="LLM temperature")
    parser.add_argument("--max-tokens", type=int, default=1024, help="Max answer tokens")
    args = parser.parse_args()

    print(f"Retrieving with Groq ({args.model})...\n")
    result = answer_query(
        args.query,
        top_k=args.top_k,
        model=args.model,
        temperature=args.temperature,
        max_tokens=args.max_tokens,
    )
    print_answer(result, args.query)