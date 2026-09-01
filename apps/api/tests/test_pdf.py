from pathlib import Path

import pytest

from studypilot.errors import AppError
from studypilot.pdf import ParsedPage, chunk_pages, normalize, parse_pdf, safe_filename


def test_chunking_preserves_page_boundaries():
    pages = [ParsedPage(1, "First", "A" * 350), ParsedPage(2, "Second", "B" * 340)]
    chunks = chunk_pages(pages, size=120, overlap=20)
    assert [c.chunk_index for c in chunks] == list(range(len(chunks)))
    assert all(len(c.text) <= 120 for c in chunks)
    assert all(set(c.text) == ({"A"} if c.page_number == 1 else {"B"}) for c in chunks)


def test_invalid_overlap_is_rejected():
    with pytest.raises(ValueError):
        chunk_pages([], size=100, overlap=100)


@pytest.mark.parametrize(
    "value,expected",
    [
        ("../../notes.pdf", "notes.pdf"),
        ("C:\\private\\notes.pdf", "notes.pdf"),
        ("\x00\n", "document.pdf"),
    ],
)
def test_filename_is_display_only_and_safe(value, expected):
    assert safe_filename(value) == expected


def test_whitespace_normalization():
    assert normalize("  one\n\t two ") == "one two"


def test_original_sample_has_eight_readable_pages():
    sample = Path(__file__).resolve().parents[3] / "docs/sample/introduction-to-neural-networks.pdf"
    pages = parse_pdf(sample)
    assert len(pages) == 8
    assert all(len(page.text) > 80 for page in pages)


def test_page_limit_is_enforced():
    sample = Path(__file__).resolve().parents[3] / "docs/sample/introduction-to-neural-networks.pdf"
    with pytest.raises(AppError) as error:
        parse_pdf(sample, max_pages=7)
    assert error.value.code == "page_limit"
