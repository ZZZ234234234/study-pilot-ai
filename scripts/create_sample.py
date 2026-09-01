"""Rebuild the original, MIT-licensed eight-page sample handout."""

import sys
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))
from studypilot.demo_content import CHAPTERS  # noqa: E402 - direct script execution


def generate():
    output = ROOT / "docs" / "sample" / "introduction-to-neural-networks.pdf"
    output.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(output), pagesize=(595.28, 841.89), pageCompression=1)
    pdf.setTitle("Introduction to Neural Networks | StudyPilot AI")
    pdf.setAuthor("StudyPilot AI contributors")
    body = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=12,
        leading=19,
        textColor=HexColor("#48554C"),
    )
    for number, (chapter, topics) in enumerate(CHAPTERS, 1):
        pdf.setFillColor(HexColor("#F8FAF4"))
        pdf.rect(0, 0, 595.28, 841.89, fill=1, stroke=0)
        pdf.setFillColor(HexColor("#23372B"))
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(48, 790, "STUDYPILOT / FIELD NOTES")
        pdf.setFillColor(HexColor("#A8C76E"))
        pdf.rect(48, 765, 50, 3, fill=1, stroke=0)
        pdf.setFillColor(HexColor("#17241C"))
        pdf.setFont("Helvetica-Bold", 30)
        title = "Introduction to Neural Networks" if number == 1 else chapter.split(" / ")[1]
        lines = simpleSplit(title, "Helvetica-Bold", 30, 490)
        y = 722
        for line in lines:
            pdf.drawString(48, y, line)
            y -= 36
        pdf.setFont("Helvetica", 10)
        pdf.setFillColor(HexColor("#7F8B80"))
        pdf.drawString(48, y - 10, chapter.upper())
        y -= 65
        for title, explanation, _, _, _keywords in topics:
            pdf.setFillColor(HexColor("#17241C"))
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(48, y, title)
            paragraph = Paragraph(explanation, body)
            _, height = paragraph.wrap(490, 500)
            paragraph.drawOn(pdf, 48, y - height - 18)
            y -= height + 65
        pdf.setFillColor(HexColor("#EAF0DF"))
        pdf.roundRect(48, 111, 499, 64, 6, fill=1, stroke=0)
        pdf.setFillColor(HexColor("#344830"))
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(64, 150, "PAUSE & RECALL")
        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            64,
            132,
            "Close the page. Explain one idea, then return to verify your reasoning.",
        )
        pdf.setStrokeColor(HexColor("#D7DFD0"))
        pdf.line(48, 82, 547, 82)
        pdf.setFont("Helvetica", 9)
        pdf.setFillColor(HexColor("#7F8B80"))
        pdf.drawString(48, 60, "Original educational sample - MIT License - studypilot.ai project")
        pdf.drawRightString(547, 60, f"{number:02d} / 08")
        pdf.showPage()
    pdf.save()
    print(output)


if __name__ == "__main__":
    generate()
