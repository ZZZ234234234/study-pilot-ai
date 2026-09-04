"""Curated OpenAI-compatible providers exposed by the private connection UI.

The catalog is deliberately server-owned.  A client may select one of these exact
endpoints, but it cannot turn StudyPilot into an arbitrary authenticated HTTP proxy.
Reference model IDs are only convenient starting points and never imply account
access; providers with a compatible ``/models`` route can also be queried on demand.
"""

from dataclasses import dataclass
from typing import Literal

ProviderId = Literal[
    "deepseek",
    "zhipu",
    "qwen",
    "moonshot",
    "minimax",
    "qianfan",
    "hunyuan",
    "doubao",
    "openai",
    "anthropic",
    "gemini",
    "xai",
    "mistral",
    "openrouter",
    "siliconflow",
    "groq",
    "together",
    "ollama",
    "lmstudio",
]


@dataclass(frozen=True)
class Endpoint:
    label: str
    url: str


@dataclass(frozen=True)
class ProviderSpec:
    id: ProviderId
    name: str
    group: Literal["china", "international", "gateway", "local"]
    monogram: str
    endpoints: tuple[Endpoint, ...]
    models: tuple[str, ...] = ()
    model_list: bool = False
    key_required: bool = True
    docs_url: str = ""
    key_url: str = ""
    json_mode: bool = True
    token_parameter: Literal["max_tokens", "max_completion_tokens"] = "max_tokens"

    @property
    def base_url(self) -> str:
        return self.endpoints[0].url


# Reference IDs and endpoints were checked against provider documentation on
# 2026-09-04.  Availability changes by account and region, so the UI labels these
# as references and keeps an exact-ID input available.
PROVIDERS: tuple[ProviderSpec, ...] = (
    ProviderSpec(
        id="deepseek",
        name="DeepSeek",
        group="china",
        monogram="D",
        endpoints=(Endpoint("中国大陆", "https://api.deepseek.com/v1"),),
        models=("deepseek-v4-flash", "deepseek-v4-pro", "deepseek-chat", "deepseek-reasoner"),
        model_list=True,
        docs_url="https://api-docs.deepseek.com/",
        key_url="https://platform.deepseek.com/api_keys",
    ),
    ProviderSpec(
        id="zhipu",
        name="智谱 AI",
        group="china",
        monogram="GLM",
        endpoints=(Endpoint("中国大陆", "https://open.bigmodel.cn/api/paas/v4"),),
        models=("glm-5.3", "glm-5.3-flash", "glm-4-flash-250414"),
        docs_url="https://docs.bigmodel.cn/cn/guide/develop/openai/introduction",
        key_url="https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
    ),
    ProviderSpec(
        id="qwen",
        name="通义千问 / DashScope",
        group="china",
        monogram="Q",
        endpoints=(
            Endpoint("中国大陆", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
            Endpoint("新加坡", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"),
            Endpoint("美国", "https://dashscope-us.aliyuncs.com/compatible-mode/v1"),
        ),
        models=("qwen3.8-max", "qwen3.8-flash", "qwen-plus", "qwen-turbo"),
        docs_url="https://help.aliyun.com/en/model-studio/compatibility-of-openai-with-dashscope",
        key_url="https://bailian.console.aliyun.com/",
    ),
    ProviderSpec(
        id="moonshot",
        name="Kimi / Moonshot",
        group="china",
        monogram="K",
        endpoints=(
            Endpoint("全球", "https://api.moonshot.ai/v1"),
            Endpoint("中国大陆", "https://api.moonshot.cn/v1"),
        ),
        models=("kimi-k3", "kimi-k2.7-code", "kimi-k2.6"),
        model_list=True,
        docs_url="https://platform.kimi.ai/docs/api/overview",
        key_url="https://platform.moonshot.ai/console/api-keys",
    ),
    ProviderSpec(
        id="minimax",
        name="MiniMax",
        group="china",
        monogram="MM",
        endpoints=(
            Endpoint("中国大陆", "https://api.minimax.cn/v1"),
            Endpoint("全球", "https://api.minimax.io/v1"),
        ),
        models=("MiniMax-M3", "MiniMax-M2.7"),
        docs_url="https://platform.minimaxi.com/docs/api-reference/text-openai-api",
        key_url="https://platform.minimaxi.com/user-center/basic-information/interface-key",
    ),
    ProviderSpec(
        id="qianfan",
        name="百度千帆",
        group="china",
        monogram="千",
        endpoints=(Endpoint("中国大陆", "https://qianfan.baidubce.com/v2"),),
        docs_url="https://cloud.baidu.com/doc/qianfan/s/Hmh4suq26",
        key_url="https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
    ),
    ProviderSpec(
        id="hunyuan",
        name="腾讯混元",
        group="china",
        monogram="混",
        endpoints=(Endpoint("中国大陆", "https://api.hunyuan.cloud.tencent.com/v1"),),
        models=("hunyuan-turbos-latest", "hunyuan-t1-latest"),
        docs_url="https://cloud.tencent.com/document/product/1729/111007",
        key_url="https://console.cloud.tencent.com/hunyuan/api-key",
    ),
    ProviderSpec(
        id="doubao",
        name="豆包 / 火山方舟",
        group="china",
        monogram="豆",
        endpoints=(Endpoint("中国大陆", "https://ark.cn-beijing.volces.com/api/v3"),),
        docs_url="https://www.volcengine.com/docs/82379/1298454",
        key_url="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    ),
    ProviderSpec(
        id="openai",
        name="OpenAI",
        group="international",
        monogram="OAI",
        endpoints=(Endpoint("全球", "https://api.openai.com/v1"),),
        models=("gpt-5.6", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"),
        model_list=True,
        docs_url="https://developers.openai.com/api/docs/models",
        key_url="https://platform.openai.com/api-keys",
        token_parameter="max_completion_tokens",
    ),
    ProviderSpec(
        id="anthropic",
        name="Anthropic Claude",
        group="international",
        monogram="C",
        endpoints=(Endpoint("全球", "https://api.anthropic.com/v1"),),
        models=(
            "claude-fable-5-1",
            "claude-opus-5",
            "claude-sonnet-5",
            "claude-haiku-4-5-20251001",
        ),
        model_list=True,
        docs_url="https://docs.anthropic.com/en/api/openai-sdk",
        key_url="https://console.anthropic.com/settings/keys",
        # Anthropic's compatibility layer does not promise OpenAI response_format;
        # the system prompt still requires a single JSON object and we validate it.
        json_mode=False,
    ),
    ProviderSpec(
        id="gemini",
        name="Google Gemini",
        group="international",
        monogram="G",
        endpoints=(Endpoint("全球", "https://generativelanguage.googleapis.com/v1beta/openai"),),
        models=("gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-pro-preview"),
        model_list=True,
        docs_url="https://ai.google.dev/gemini-api/docs/openai",
        key_url="https://aistudio.google.com/app/apikey",
    ),
    ProviderSpec(
        id="xai",
        name="xAI Grok",
        group="international",
        monogram="X",
        endpoints=(Endpoint("全球", "https://api.x.ai/v1"),),
        models=("grok-4.6",),
        model_list=True,
        docs_url="https://docs.x.ai/overview",
        key_url="https://console.x.ai/",
    ),
    ProviderSpec(
        id="mistral",
        name="Mistral AI",
        group="international",
        monogram="MI",
        endpoints=(Endpoint("全球", "https://api.mistral.ai/v1"),),
        model_list=True,
        docs_url="https://docs.mistral.ai/api/endpoint/models",
        key_url="https://console.mistral.ai/api-keys",
    ),
    ProviderSpec(
        id="openrouter",
        name="OpenRouter",
        group="gateway",
        monogram="OR",
        endpoints=(Endpoint("全球", "https://openrouter.ai/api/v1"),),
        model_list=True,
        docs_url="https://openrouter.ai/docs/quickstart",
        key_url="https://openrouter.ai/settings/keys",
    ),
    ProviderSpec(
        id="siliconflow",
        name="SiliconFlow 硅基流动",
        group="gateway",
        monogram="SF",
        endpoints=(Endpoint("中国大陆", "https://api.siliconflow.cn/v1"),),
        model_list=True,
        docs_url="https://docs.siliconflow.cn/api-reference/chat-completions/chat-completions",
        key_url="https://cloud.siliconflow.cn/account/ak",
    ),
    ProviderSpec(
        id="groq",
        name="GroqCloud",
        group="gateway",
        monogram="GQ",
        endpoints=(Endpoint("全球", "https://api.groq.com/openai/v1"),),
        model_list=True,
        docs_url="https://console.groq.com/docs/openai",
        key_url="https://console.groq.com/keys",
    ),
    ProviderSpec(
        id="together",
        name="Together AI",
        group="gateway",
        monogram="TA",
        endpoints=(Endpoint("全球", "https://api.together.ai/v1"),),
        model_list=True,
        docs_url="https://docs.together.ai/docs/inference/openai-compatibility",
        key_url="https://api.together.ai/settings/api-keys",
    ),
    ProviderSpec(
        id="ollama",
        name="Ollama",
        group="local",
        monogram="OL",
        endpoints=(
            Endpoint("本机", "http://127.0.0.1:11434/v1"),
            Endpoint("本机 localhost", "http://localhost:11434/v1"),
            Endpoint("本机 IPv6", "http://[::1]:11434/v1"),
        ),
        models=("qwen3:8b", "llama3.2"),
        model_list=True,
        key_required=False,
        docs_url="https://docs.ollama.com/api/openai-compatibility",
    ),
    ProviderSpec(
        id="lmstudio",
        name="LM Studio",
        group="local",
        monogram="LM",
        endpoints=(
            Endpoint("本机", "http://127.0.0.1:1234/v1"),
            Endpoint("本机 localhost", "http://localhost:1234/v1"),
            Endpoint("本机 IPv6", "http://[::1]:1234/v1"),
        ),
        model_list=True,
        key_required=False,
        docs_url="https://lmstudio.ai/docs/developer/openai-compat",
    ),
)

PROVIDER_BY_ID = {provider.id: provider for provider in PROVIDERS}


def provider_spec(provider_id: str) -> ProviderSpec:
    try:
        return PROVIDER_BY_ID[provider_id]
    except KeyError as error:
        raise ValueError("Unsupported model provider") from error


def public_catalog() -> list[dict]:
    return [
        {
            "id": provider.id,
            "name": provider.name,
            "group": provider.group,
            "monogram": provider.monogram,
            "base_url": provider.base_url,
            "endpoints": [
                {"label": endpoint.label, "url": endpoint.url} for endpoint in provider.endpoints
            ],
            "models": list(provider.models),
            "model_source": "reference" if provider.models else "manual",
            "model_list": provider.model_list,
            "key_required": provider.key_required,
            "docs_url": provider.docs_url,
            "key_url": provider.key_url,
            "checked_on": "2026-09-04",
        }
        for provider in PROVIDERS
    ]
