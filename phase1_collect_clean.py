"""
Phase 1: Data Collection & Cleaning
- Extract text from PDFs using PyMuPDF
- Clean and normalize the text
- Save processed chunks for RAG
"""

import os
import re
import json
import sys
from pathlib import Path
from tqdm import tqdm

# Fix Windows console encoding for emoji filenames
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import fitz  # PyMuPDF


PDF_DIR = Path("pdf")
OUTPUT_DIR = Path("processed_data")
OUTPUT_DIR.mkdir(exist_ok=True)


def extract_text_from_pdf(pdf_path: Path) -> list[dict]:
    """Extract text page-by-page from a PDF."""
    doc = fitz.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc, 1):
        text = page.get_text()
        if text.strip():
            pages.append({
                "source": pdf_path.name,
                "page": page_num,
                "raw_text": text,
            })
    doc.close()
    return pages


def clean_text(text: str) -> str:
    """Normalize and clean extracted text."""
    # Normalize unicode whitespace
    text = text.replace("\u00a0", " ")

    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces
    text = re.sub(r"[ \t]{2,}", " ", text)

    # Remove stray single hyphens at line ends (soft hyphens)
    text = re.sub(r"-\n", "", text)

    # Join lines broken mid-sentence
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)

    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)

    return text.strip()


def chunk_text(text: str, max_chars: int = 1500, overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks for embedding."""
    if len(text) <= max_chars:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + max_chars
        chunk = text[start:end]

        # Try to break at last paragraph/sentence boundary
        if end < len(text):
            for sep in ["\n\n", "\n", ". ", "! ", "? "]:
                last = chunk.rfind(sep)
                if last > max_chars // 2:
                    chunk = chunk[: last + len(sep)]
                    end = start + len(chunk)
                    break

        chunks.append(chunk.strip())
        start = end - overlap

    return [c for c in chunks if c]


def process_all_pdfs():
    """Main pipeline: extract -> clean -> chunk -> save."""
    pdf_files = sorted(PDF_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDFs found in {PDF_DIR}")
        return

    all_chunks = []

    for pdf_path in tqdm(pdf_files, desc="Processing PDFs"):
        print(f"\n  Extracting: {pdf_path.name}")
        pages = extract_text_from_pdf(pdf_path)

        doc_chunks = []
        for page in pages:
            cleaned = clean_text(page["raw_text"])
            if not cleaned:
                continue
            chunks = chunk_text(cleaned)
            for i, chunk in enumerate(chunks):
                doc_chunks.append({
                    "source": page["source"],
                    "page": page["page"],
                    "chunk_id": i,
                    "text": chunk,
                })

        all_chunks.extend(doc_chunks)
        print(f"    -> {len(pages)} pages, {len(doc_chunks)} chunks")

    # Save results
    output_file = OUTPUT_DIR / "chunks.jsonl"
    with open(output_file, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    summary = OUTPUT_DIR / "summary.json"
    stats = {
        "total_pdfs": len(pdf_files),
        "total_chunks": len(all_chunks),
        "sources": list({c["source"] for c in all_chunks}),
    }
    with open(summary, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*50}")
    print(f"Done! {stats['total_chunks']} chunks from {stats['total_pdfs']} PDFs")
    print(f"Output: {output_file}")
    print(f"Summary: {summary}")


if __name__ == "__main__":
    process_all_pdfs()
