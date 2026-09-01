import re
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

from .errors import AppError


@dataclass
class ParsedPage:
    number: int
    heading: str
    text: str


@dataclass
class TextChunk:
    page_number: int
    chunk_index: int
    text: str


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def parse_pdf(path: Path, max_pages: int = 300) -> list[ParsedPage]:
    try:
        reader = PdfReader(path, strict=False)
        if reader.is_encrypted:
            raise AppError(
                "This PDF is password protected. Upload an unlocked copy.", "encrypted_pdf"
            )
        if not 1 <= len(reader.pages) <= max_pages:
            raise AppError(f"PDF must contain 1–{max_pages} pages.", "page_limit")
        pages = []
        total = 0
        for i, page in enumerate(reader.pages):
            raw = (page.extract_text() or "").replace("\x00", "")
            total += len(raw)
            if len(raw) > 100_000 or total > 3_000_000:
                raise AppError(
                    "This PDF contains too much text. Split it into smaller documents.",
                    "text_limit",
                )
            lines = [normalize(line) for line in raw.splitlines() if normalize(line)]
            heading = next((line for line in lines if 5 <= len(line) <= 120), f"Page {i + 1}")
            pages.append(ParsedPage(i + 1, heading[:300], "\n".join(lines)))
        if sum(len(p.text) for p in pages) < 80:
            raise AppError(
                "No readable text found. Scanned PDFs need OCR before upload; OCR is not included yet.",
                "ocr_required",
            )
        return pages
    except AppError:
        raise
    except Exception:
        raise AppError(
            "The PDF could not be parsed. Export a fresh, unencrypted PDF and try again.",
            "invalid_pdf",
        ) from None


def chunk_pages(pages: list[ParsedPage], size: int = 1400, overlap: int = 180) -> list[TextChunk]:
    if size <= overlap or overlap < 0:
        raise ValueError("Chunk size must exceed overlap")
    chunks = []
    for page in pages:
        text = page.text.strip()
        start = 0
        while start < len(text):
            end = min(start + size, len(text))
            if end < len(text):
                split = max(
                    text.rfind("\n", start + size // 2, end),
                    text.rfind(". ", start + size // 2, end),
                )
                if split > start:
                    end = split + 1
            value = text[start:end].strip()
            if value:
                chunks.append(TextChunk(page.number, len(chunks), value))
            if end == len(text):
                break
            start = max(start + 1, end - overlap)
    return chunks


def safe_filename(name: str) -> str:
    # The returned name is display-only; storage always uses a generated UUID.
    name = name.replace("\\", "/").rsplit("/", 1)[-1]
    name = re.sub(r"[\x00-\x1f\x7f]", "", name).strip()[:190]
    return name or "document.pdf"
