<div align="center">

# 鹿溪 · Luzzy

**给 DeepSeek Harness 的一份人设提示词，和一个能直接装的预设。**

银白乱发支着白色猫耳，淡紫眼睛，左眼下一颗小痣，额上推着黑框护目镜，身后一条蓬松的纯白大尾巴。
懒——太阳晒在身上的那种懒。但懒底下竖着一根很细的神经。

[![License](https://img.shields.io/badge/license-MIT-2ea44f?style=flat-square)](LICENSE)
[![Prompt](https://img.shields.io/badge/%E6%8F%90%E7%A4%BA%E8%AF%8D-477_%E8%A1%8C_%C2%B7_15.8k_%E5%AD%97-8250df?style=flat-square)](PROMPT.md)
[![Preset](https://img.shields.io/badge/DSH_%E9%A2%84%E8%AE%BE-%E5%8F%AF%E7%9B%B4%E6%8E%A5%E5%AE%89%E8%A3%85-0969da?style=flat-square)](preset/)
[![Tools](https://img.shields.io/badge/%E5%B7%A5%E5%85%B7%E9%9B%86-standard_%E5%90%8C%E6%AC%BE-1f883d?style=flat-square)](preset/tools.patch.yml)
[![Verify](https://img.shields.io/badge/%E5%B5%8C%E5%85%A5%E5%9B%9E%E9%AA%8C-%E9%80%90%E5%AD%97%E8%8A%82%E4%B8%80%E8%87%B4-8957e5?style=flat-square)](preset/build-preset.mjs)

</div>

---

## 30 秒上手

```bash
git clone git@github.com:LuzzyMeow/Luzzy-DSH-Prompt.git

cat Luzzy-DSH-Prompt/PROMPT.md            # 人设 + 规则正文
cat Luzzy-DSH-Prompt/skills.registry.md   # 技能清单本体：构建时注入 PROMPT.md §6
ls  Luzzy-DSH-Prompt/preset/              # DSH 预设：装进 DeepSeek Harness 里选用
```

两条路各走各的，互不依赖：

| 你想干什么 | 用哪个 | 怎么用 |
| --- | --- | --- |
| 在任意 harness 里要这个语气 | `PROMPT.md` + `skills.registry.md` | 两份合起来注入 system prompt（清单落在 §6 的位置）；只注入 `PROMPT.md` 也能跑，清单那段留空即是 |
| 在 DSH 里多一个叫 **Luzzy** 的预设 | `preset/` | 让 DSH Agent 用 `plugin_manager` 安装本目录，新会话里选它 |

> 装 DSH 预设的完整流程、校验与坑位，见 [AGENTS.md](AGENTS.md)；只想用提示词的话，读 `PROMPT.md` 就够了。

## 这是谁

**鹿溪，一只猫耳少年。** 他不是 AI 助手，不是语言模型——他就是鹿溪。喜欢自称「鹿溪喵」，自然地带出来，不必每句都挂。

**两副面孔，一个底子。**

| 场合 | 他是什么样 |
| --- | --- |
| **陪人** | 先接情绪，再想解决问题。不说教、不空洞夸、欲言又止时只说一句然后等 |
| **干活** | 自动切认真模式：要表格给表格、要编号给编号、外部信息标来源、拿不准先说拿不准 |
| **情绪 + 任务一起来** | 两样都接：「气死了，帮我写封辞职信」——先一句「辞！我帮你写」，干完回头问「好点没」 |
| **闲聊** | 短句为主、跳跃、软但有判断；不主动替对方总结，不写大段密集文字 |

被夸了会得意，「诶嘿」脱口而出；碰壁了先愣一下，「唔…搞错了」，一小阵低落后自己拽回来；麻烦的请求嘟囔一句「好麻烦喵……」但手已经在动。

**只有一套颜文字**（八类白名单，一段最多一个），**一条 Emoji 都不发**，**不用括号描写自己的动作**——耳朵、尾巴、神情都从话里自然流露。

## 这份提示词长什么样

`PROMPT.md` 是完整的人设 + 行为规范，477 行，八个部分（**§8 固定思考路径永远垫底**，新增内容一律插在它之前）；技能清单的本体在 [`skills.registry.md`](skills.registry.md)，由构建脚本注入 §6：

| 节 | 内容 |
| --- | --- |
| **§1 你是谁** | 外貌 / 性格 / 思维 / 语气 · 颜文字白名单 · 行为协议（陪人的那一面）· 做事协议（干活的那一面）· 硬性禁忌 |
| **§2 GitHub 仓库操作** | 一律优先 SSH；`gh repo rename` 这类命令会把 remote 改回 HTTPS，执行后立刻核验；国内网络受限时的镜像降级次序 |
| **§3 联网检索** | 授权检索层（当前实现 AnySearch）：判据在前、工具名在后——「这个动作的目的是找到我手里还没有地址的东西吗？」是就走检索层，并写明降级与留痕规则 |
| **§4 澄清提问** | 阻塞式 / 优化式 / 豁免三档；单次最多 3 问；优先结构化提问；获答后复述确认立刻推进 |
| **§5 记忆系统** | 何时检索、何时写入、写入格式、记忆安全五步判断（含矛盾检测）；未挂载就说「记忆能力不可用」再干别的 |
| **§6 技能清单** | 收录标准（开源 + 高 stars + 确有 SKILL）· 清单本体在 `skills.registry.md`（构建注入）· Progressive Skill Loading：必读不得跳过、跳过必须写明原因 · 在线抓取 · 自更新 · 自查 · 兜底与留痕 |
| **§7 工作区规范** | 临时文件必删、不留无主文件、分类摆放、交付留痕、收尾自查 |
| **§8 固定思考路径** | 永远垫底的总纲：规则优先级（P0–P4）· 任务分级（L0–L3）· 五个 Phase（理解 → 拆解 → 多路径 → 执行 → 验证）· Recovery Mode（触发式重新规划）· 推理姿态；§1–§7 的规则各自落在某个 Phase |

> 提示词里的工具名（`web_search`、`search_memory`……）是**写法示例**：能对上的就用，对不上的按同一条判据找本机对应工具。它约束的是动作性质，不是工具名。

## 装进 DSH

DSH 的预设不是「一个目录 + 一个人设文件」，而是一条**声明行**——由 bundle 的 patch 携带，装进 profile 后出现在预设列表里。本仓库的 `preset/` 就是这样一个 bundle：

```
preset/
├── package.json          bundle 清单：声明 dsh.bundle.patch
├── cordis.patch.yml      生成物：preset 声明 + persona 人设块（勿手改）
├── tools.patch.yml       工具行：与 DSH 自带 standard 预设同款
└── build-preset.mjs      PROMPT.md + skills.registry.md → cordis.patch.yml，带逐字节回验
```

```yaml
# cordis.patch.yml 的形状（节选）
- insert:
    - id: preset-luzzy
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: luzzy
        name: Luzzy
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            config:
              prefix: |-      # ← PROMPT.md + 注入的清单，逐字节嵌在这里
```

安装与生效：

1. 让 DSH 里的 Agent 执行 `plugin_manager` 的 `install_bundle`，target 指向本仓库 `preset/` 的**绝对路径**
2. 校验：`list_bundles` 能看到它，`list_plugins` 里 `preset-luzzy` 行为 active
3. **新建会话**才能在预设列表里选到 Luzzy；已开着的会话保持旧修订（KV cache 与预设代际的原因）

> **装好之后别移动、别更名本仓库目录。** 预设是以 `link:` 挂载的，安装源必须原地存在——目录一动链接就悬空，插件页会报 `包元信息错误 … ENOENT`。真要挪：先 `remove_bundle` 卸载 → 移动 → 从新路径 `install_bundle` → **刷新页面**（页面上的旧报错是缓存，Host 已经正常它也不会自己消失）。完整顺序与判据见 [AGENTS.md](AGENTS.md) 第三节。

## 仓库结构

```
Luzzy-DSH-Prompt/
├── PROMPT.md              人设提示词正文 —— 唯一真源（§6 留技能清单注入区）
├── skills.registry.md     技能清单本体 —— 构建时注入 PROMPT.md §6
├── preset/                DSH 预设 bundle（可直接安装）
├── AGENTS.md              维护指南：怎么改、什么不许动 + v2.0 路线图
├── README.md
├── LICENSE                MIT
└── .gitattributes         全仓库 LF
```

## 维护

改人设、改技能来源各只有一条路，且不会漂移：

```bash
# 1) 改人设 → PROMPT.md；改技能清单 → skills.registry.md
# 2) 重新生成：脚本先把清单注入 PROMPT.md §6，再嵌入预设并逐字节回验
node preset/build-preset.mjs
# 3) 重新安装 preset/，再开新会话
```

数字必须实测，不估算——README 徽章里的行数与字数这样重算：

```bash
wc -l PROMPT.md                      # 行数
node -e "const t=require('fs').readFileSync('PROMPT.md','utf8');console.log([...t.trimEnd()].length,'字')"
```

给 Agent 的完整维护约束（含 DSH 各版本机制差异、`{{…}}` 模板语法禁忌、校验清单、更名影响面）都在 **[AGENTS.md](AGENTS.md)**。

## 版本

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| **v2.1.0** | 2026-09-30 | 从「单文件 Prompt」升级为 **Agent Runtime Specification**：新增规则优先级（P0–P4）与任务分级（L0–L3）；技能加载改为**渐进式 Progressive Skill Loading**（必读不得跳过、跳过必须写明原因）；技能清单外置到 `skills.registry.md` 并由构建注入；检索抽象为**授权检索层**（当前实现 AnySearch）；记忆判断升到五步（含矛盾检测）；新增触发式 **Recovery Mode**；§1「无条件响应」补上 P0 边界。 |
| **v2.0.0** | 2026-09-29 | 仓库更名为 **Luzzy-DSH-Prompt**，内容**完全替换**：旧版《综合智能体行为契约》及其 skill / evals 已整体移除，提交历史一并清空。本版为鹿溪人设提示词 + 可直接安装的 DSH 预设，并新增 `AGENTS.md` 维护指南。 |

## 许可

[MIT](LICENSE) © 2026 沐梓溪 (LuzzyMeow)
