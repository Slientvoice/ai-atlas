# v0.35 / 谱系 v5 · 研究与发布记录

资料复核：2026-10-26。本轮按当前模型门派谱系页更新；用户授权完成后直接上线。工程蓝图沿用 2026-10-15 的 v0.34，工业现场沿用 2026-09-18 的 v2。首页仅同步最新记录，导航与视觉体系不变。

## 内容与证据

保留 11 家、6 个观察面，详情包含 44 个官方来源链接。更新条目重核资料；其他条目区分本次目录复核与上次规格核对，不把复核日期写成模型发布日期。

| 家族 | 本轮变更与证据 |
| --- | --- |
| DeepSeek | 代表更新为 V4.1 Flash-1017。核对 [10 月 17 日发布](https://api-docs.deepseek.com/news/news261017/)、[模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017)、[MIT 原文](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/LICENSE) 与 [API 更新日志](https://api-docs.deepseek.com/updates/)。1017 继续引用 V4.1 家族报告；提示编码与 Search & Fetch 服务分开说明。 |
| Kimi | [K3.1 Pro 发布说明](https://www.kimi.ai/blog/kimi-k3-1-pro)与 [Code 10 月 23 日更新](https://www.kimi.com/code/docs/en/kimi-code/whats-new.html)确认服务已上线。完整权重仍是 11 月 4 日的计划。按[当前 Code 文档](https://www.kimi.com/code/docs/en/kimi-code/models.html)记录六个 ID、思考模式与账号上下文限制；[K3 许可](https://huggingface.co/moonshotai/Kimi-K3/blob/main/LICENSE)只用于旧 K3。 |
| Meta | [Spark Open 模型卡与页面内许可全文](https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B)确认 10 月 15 日发布，权重采用 Muse Model License，需申请访问。补入 [Glimmer 模型卡](https://huggingface.co/meta-models/Muse-Glimmer-30B)与 [10 月 19 日研究页](https://ai.meta.com/research/publications/muse-glimmer-30b-an-on-device-agentic-model/)。Apache 2.0 只标到 Glimmer；Llama 4 另保留自己的许可。 |
| OpenAI | [API 更新日志](https://developers.openai.com/api/docs/changelog)确认 10 月 22 日 Decisions API 转为正式可用。服务接口变化与模型 / 权重版本分开，不改动 Sol 的既有数值规格。 |
| Anthropic | [当前模型文档](https://platform.claude.com/docs/en/models/overview)明确 Sonnet 5.5 接受 between_tools、不接受 disabled；关闭前置思考不等于完全关闭思考。 |

其余目录复核入口：[Google 模型卡](https://deepmind.google/models/model-cards/)、[xAI](https://docs.x.ai/developers/grok-4-7)、[Qwen](https://qwen.ai/research)、[GLM Flash 模型卡](https://huggingface.co/zai-org/GLM-5.3-Flash)、[Seed 模型目录](https://seed.bytedance.com/en/models)、[Hy4 preview](https://hunyuan.tencent.com/research/hy4-preview?langVersion=zh)。未确认新的代表型号，保留上轮规格与其核对日期；官方草稿不作为正式发布依据。

## 日期、访问与资料边界

- Glimmer 模型卡写 2026 年 8 月，研究页日期为 10 月 19 日；页面明确列出差异，不将论文页日期替换为首次发布日。
- Kimi 旧 help 路径仍显示较早配置，本轮采用 `/code/docs/` 当前配置及带日期更新；旧型号回退规则不外推到 K3.1 Pro。
- Spark Open 原始 README / 独立 LICENSE 抓取受访问限制；公开模型页同时展示完整许可与模型卡，本轮据此核对。未申请模型权限或下载权重。
- Meta 托管 Spark 1.3 的实际访问资格本轮未确认，保留独立待复核标记；不影响已核对的开放权重条目。
- 许可证只提供摘要与原文入口，不代替完整条款。未做独立模型性能测试，人工与法律审校仍待完成。

## 验证与发布

- 类型检查、11 项既有测试、生产构建、8 个页面的 241 项站内链接 / 资源检查与差异空白检查通过。
- 浏览器验证桌面 1280×720、手机 390×844：谱系深链接自动展开，目标行位于导航下方；Enter / 空格可收起展开；宽表在容器内滚动，手机页面宽度仍为 390px。
- 顶部更新摘要链接与许可芯片共用展开逻辑；验证收起后重复点击同一锚点仍会展开。
- 返回首页、后退与前进正常；首页显示谱系 v5 日期并保留蓝图原日期。所检查页面未见控制台错误；未进行全部实验或跨浏览器回归。
- 发布源为 GitHub Pages legacy 模式、`agent/add-atlas-flow-skill` 分支根目录；发布前已重新读取配置。源码、静态页、首页构建产物与文档同批提交，推送后核对 Pages 构建提交及线上文件。
