# v0.34 / 谱系 v4 · 研究与发布记录

资料复核：2026-10-15。范围为工程蓝图（原理与交互实验）和模型门派谱系；用户已授权更新后直接上线。门户与统一导航沿用 v0.33。工业现场继续保留 2026-09-18 的 v2 快照，本轮不改变其实质内容。

## 内容决策

- 七平面、45 模块、45 实验的入口与旧锚点保留。Llama-3-8B、H100 是固定教学锚点，不追随每次产品升级替换数值例。
- 在架构地平线和 KV 缓存处补充混合注意力、CED、跨层缓存与稀疏索引的适用差异；不再说所有模型结构同构。
- 分开 GRPO（优化方法）与 RLVR（奖励来源）、R1-Zero 与 R1；删除可验证奖励“不可讨好”、投机解码“免费加速”等绝对表述。
- 推理成本实验以 batch=1、标准 GQA、FP16/BF16 计算权重和 KV 读取；prefill 仅估算参数计算与权重搬运，省略注意力计算、实际利用率和调度网络。128K 为成本外推，不表示原版 Llama-3-8B 的可用窗口。
- 采样实验明确二选一、奇数票、等长回答；增加共享判断混合比例 ρ。ρ=1 时全部采样共享同一次判断，不增加正确率。该数学模型不是任何产品的性能测量。
- MCP 示例采用 2026-07-28 请求元数据、server/discover、inputSchema 和 resultType；模型工具接口与 Host / Client / Server 协议边界分开。示例省略发现响应、认证与传输，不是完整 SDK。
- KV 水位实验统一为十进制 GB，与权重及标称容量同口径；正文另列 KiB / GiB 换算。
- 新增可测试的 `assets/blueprint-lab-models.mjs`。蓝图脚本使用模块导入，计算逻辑与测试共用一份实现。

## 官方资料与谱系核对

矩阵仍为 11 家、6 个观察面，共 36 个就近官方来源链接。未找到已核实的新代表型号时保留原型号；复核日期不表示发布日期。当前网页与许可可能继续变化，以下为本轮阅读记录。

| 家族 | 本轮结论 | 主要证据 |
| --- | --- | --- |
| OpenAI | 新增 9 月 29 日的 GPT-6.1 Sol；保留 Astra。Sol 为图文输入、文本输出，1,050,000 窗口 / 128,000 输出，工具调用使用 Responses API | [Sol 文档](https://developers.openai.com/api/docs/models/gpt-6.1-sol)、[发布说明](https://openai.com/index/introducing-gpt-6-1-sol/)、[gpt-oss 模型卡](https://huggingface.co/openai/gpt-oss-120b) |
| Anthropic | 当前目录为 Fable 5.1 及 Opus / Sonnet / Haiku 5.5；不能将始终思考泛化到所有型号；Mythos 单列受限访问 | [模型目录](https://platform.claude.com/docs/en/models/overview)、[Fable / Mythos 说明](https://www.anthropic.com/claude-fable-and-mythos-5-1) |
| Google | 新增 10 月 13 日的 Argon：新稀疏 MoE 基座，1M 为输入输出总量。Flash 的输入、输出上限另列 | [Argon 模型卡](https://deepmind.google/models/model-cards/gemini-4-argon/)、[Flash API](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)、[Gemma 4](https://ai.google.dev/gemma/docs/core/model_card_4) |
| xAI | 9 月 21 日的 Grok 4.7，500K 窗口。Fast 仅列 Cursor / Grok Build；10 月 14 日 Voice 3.0 属另一支线 | [4.7 文档](https://docs.x.ai/developers/grok-4-7)、[发布说明](https://x.ai/news/grok-4-7)、[Voice 3.0](https://x.ai/news/grok-voice-3) |
| DeepSeek | V4.1 Flash 主干、激活量、Engram 分列；当前日志明确继续 V4 Pro 服务，优先于旧发布公告的停服计划 | [Flash 模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash)、[API 更新日志](https://api-docs.deepseek.com/updates/) |
| Meta | 当前目录仍列 Spark 1.3；开发者页直读失败，公开预览状态仅有此前记录与搜索索引，页面单列待复核 | [当前目录](https://ai.meta.com/events/)、[开发者入口](https://ai.meta.com/llama) |
| Qwen | Max 托管版和 2.4T 权重的模态、窗口不同；确认 3:1 混合层结构。Max 自定义许可、27B Apache 2.0、Flash-Next Community License 分开 | [2.4T 模型卡](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B)、[当前 Max 许可](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/blob/main/LICENSE)、[27B 许可](https://huggingface.co/Qwen/Qwen3.8-27B/blob/main/LICENSE)、[Flash-Next 许可](https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/LICENSE) |
| Kimi | k3 / k3-256k / kimi-for-coding / highspeed 入口分列；关闭 thinking 会改变实际路由；256K 支线不支持视频 | [K3 说明](https://www.kimi.com/news/kimi-k3-open-source)、[Code 模型说明](https://www.kimi.com/help/kimi-code/models)、[K3 许可](https://huggingface.co/moonshotai/Kimi-K3/blob/main/LICENSE) |
| GLM | 5.3 与 5.3-Flash 基座、模态与许可不同；模型卡披露 harness 与评测预算，补入蓝图阅读方法 | [5.3](https://huggingface.co/zai-org/GLM-5.3)、[Flash](https://huggingface.co/zai-org/GLM-5.3-Flash)、[5.3 许可](https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE) |
| 字节 | 官方产品页仍以 Seed2.1 Pro / Turbo 为代表；理解视频不等于原生输出视频 | [Seed2.1](https://seed.bytedance.com/en/seed2_1) |
| 腾讯 | 保留 Hy4 preview，主干 770B / 激活 49B，MTP 另计 10B / 0.7B；Apache 2.0 限定到该交付物 | [模型卡](https://huggingface.co/tencent/Hy4-preview) |

Qwen Omni 检索命中包含草稿页面且正文未成功读取，未据此添加新的确定性规格。许可证摘要不是完整条款，法律观察需结合具体业务场景判断。本轮不提供厂商性能排名或独立安全认证。

## 蓝图补充来源

- [DeepSeek-R1 论文](https://arxiv.org/abs/2501.12948)：R1-Zero 与 R1 的训练阶段。
- [Llama 2 官方实现文档](https://huggingface.co/docs/transformers/v5.3.0/en/model_doc/llama2)：SentencePiece BPE，不等于 Unigram。
- [NVIDIA H100 规格](https://www.nvidia.com/en-us/data-center/h100/)：SXM 3.35 TB/s；本例 BF16 / FP16 非稀疏峰值约 989 TFLOP/s。
- [Anthropic 上下文工程](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)：压缩、笔记与上下文选择。
- [MCP 2026-07-28 架构](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)：无状态请求、能力发现、渐进工具发现及协议与模型边界。

## 验证记录

- 11 项自动测试通过：7 项历史导航边界、4 项教学模型测试（精确概率、相关极限、长窗口成本、MCP 字段与消息对应关系）。
- 类型检查、生产构建、8 个页面的 235 项本地链接 / 资源检查、差异空白检查通过。
- 浏览器验证：桌面 1280×720、手机 390×844；蓝图深链接落在导航下方，相关采样极限与长窗口计算输出正常，MCP 模式显示当前字段。
- 谱系可用键盘展开 / 收起，宽表在容器内滚动，页面没有横向溢出；返回首页、后退和前进正常；首页显示两项 10 月更新。
- 浏览器已检查页面未见控制台错误。没有对全部 45 个实验做算法回归，也未进行跨浏览器全面兼容性认证。

## 发布

发布源已核对为 GitHub Pages legacy 模式、`agent/add-atlas-flow-skill` 分支根目录。源码、静态页面、首页构建产物、测试和本文同批提交；上线后核对 Pages 构建提交与线上内容一致。
