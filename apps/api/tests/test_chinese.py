from studypilot.learning import demo_answer
from studypilot.models import Chunk
from studypilot.providers import SAFETY, demo_search_text


def test_demo_expands_known_chinese_keywords_only():
    assert "convolution" in demo_search_text("卷积为什么有用？")
    assert "backpropagation" in demo_search_text("反向传播是怎样工作的？")
    assert demo_search_text("今天的午饭是什么？") == "今天的午饭是什么？"


def test_chinese_demo_question_preserves_english_evidence():
    source = "Convolution uses a small filter repeatedly across an image. Weight sharing reduces parameters."
    chunk = Chunk(id="source-4", document_id="sample", page_number=4, text=source)
    answer = demo_answer("卷积为什么有用？", [chunk])
    assert answer["chunk_ids"] == ["source-4"]
    assert "演示" in answer["answer"]
    assert "不是真实 AI" in answer["answer"]
    excerpt = answer["answer"].split("\n\n", 1)[1]
    assert excerpt in source
    assert chunk.text == source


def test_unknown_chinese_question_does_not_invent_evidence():
    chunk = Chunk(
        id="source-4",
        document_id="sample",
        page_number=4,
        text="Convolution uses a small filter repeatedly across an image.",
    )
    answer = demo_answer("今天的午饭是什么？", [chunk])
    assert answer["chunk_ids"] == []
    assert answer["answer"] == "当前资料中没有找到足够依据。"


def test_generation_language_preserves_quotes_and_protocol_values():
    assert "Simplified Chinese" in SAFETY
    assert "NEVER translate or rewrite source_excerpt" in SAFETY
    assert "enum values" in SAFETY
