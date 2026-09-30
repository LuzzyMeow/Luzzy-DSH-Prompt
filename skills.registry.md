### 技能清单（Skill Registry）

> **本区块是 §6 清单的本体**，由 `preset/build-preset.mjs` 注入 `PROMPT.md` 的注入区。改清单请改**本文件**（仓库根的 `skills.registry.md`），不要手改 `PROMPT.md` 里的注入区。
>
> 线上副本（供 agent 按 §6「来源」在线抓取）：https://raw.githubusercontent.com/LuzzyMeow/Luzzy-DSH-Prompt/main/skills.registry.md
>
> 登记字段：`仓库名 · stars · 许可（用途简介；代表 SKILL —— …）（仓库链接）`。stars 与许可是收录当时的实测值（本版 2026-09-30 实测），更新时按 `PROMPT.md` §6「收录标准」先重测再改。

**0、本仓库（提示词与预设真源）**

0.1 `LuzzyMeow/Luzzy-DSH-Prompt`（本提示词自己的家：人设原文在 `PROMPT.md`，工具集在 `preset/tools.patch.yml`，改法、校验与禁忌在 `AGENTS.md`，`preset/` 是可安装的 DSH 预设 bundle。维护人设、改本清单之前先读它）（https://github.com/LuzzyMeow/Luzzy-DSH-Prompt）

> 0.x 是自指条目，不受上面「收录标准」约束——它提供的是真源，不是 SKILL。

**1、前端设计**

1.1 `nextlevelbuilder/ui-ux-pro-max-skill` · 131.8k★ · MIT（UI/UX 设计智能：设计风格库、配色系统、多技术栈界面方案；代表 SKILL —— ui-ux-pro-max / design / design-system / ui-styling / slides / brand）（https://github.com/nextlevelbuilder/ui-ux-pro-max-skill）

1.2 `addyosmani/agent-skills` · 100k★ · MIT（生产级工程技能集的前端侧：前端界面工程、浏览器调试与验证、无障碍；代表 SKILL —— frontend-ui-engineering / browser-testing-with-devtools）（https://github.com/addyosmani/agent-skills）

**2、后端开发规范**

2.1 `addyosmani/agent-skills` · 100k★ · MIT（同 1.2 仓库的后端侧：接口与 API 设计、代码审查与质量、CI/CD、调试与错误恢复、文档与 ADR、废弃与迁移；代表 SKILL —— api-and-interface-design / code-review-and-quality / ci-cd-and-automation / debugging-and-error-recovery / documentation-and-adrs）（https://github.com/addyosmani/agent-skills）

2.2 `obra/superpowers` · 293.2k★ · MIT（软件开发方法论：测试驱动、系统化调试、代码审查的请求与接收两侧、计划写作与执行、完成前验证——把工程纪律固化成可执行流程；代表 SKILL —— test-driven-development / systematic-debugging / requesting-code-review / verification-before-completion）（https://github.com/obra/superpowers）

2.3 `Jeffallan/claude-skills` · 11.7k★ · MIT（后端工程角色技能集：接口设计、代码审查、数据库调优、架构与云、DevOps 与混沌工程；代表 SKILL —— api-designer / code-reviewer / database-optimizer / architecture-designer / cloud-architect / devops-engineer）（https://github.com/Jeffallan/claude-skills）

**3、办公类**

3.1 `iOfficeAI/OfficeCLI` · 31.4k★ · Apache-2.0（面向 agent 的 Office 套件：Word / Excel / PowerPoint 文档的读取、生成与编辑；代表 SKILL —— officecli-docx / officecli-xlsx / officecli-pptx / officecli-financial-model / officecli-academic-paper / officecli-data-dashboard）（https://github.com/iOfficeAI/OfficeCLI）

**4、制作 PPT 类**

4.1 `hugohe3/ppt-master` · 57.1k★ · MIT（文档或主题 → 原生 PowerPoint：原生形状与转场动画、按需生成图表表格、讲者备注配音、套用自有 .pptx 模板；代表 SKILL —— ppt-master）（https://github.com/hugohe3/ppt-master）

4.2 `zarazhangrui/frontend-slides` · 30k★ · MIT（网页幻灯片：用 HTML/CSS 做出能直接展示的 slide deck，附成套视觉模板；代表 SKILL —— frontend-slides）（https://github.com/zarazhangrui/frontend-slides）

4.3 `JimLiu/baoyu-skills` · 26.2k★ · MIT（中文向技能集里的演示与图形线：幻灯片、信息图、图表；代表 SKILL —— baoyu-slide-deck / baoyu-infographic / baoyu-diagram）（https://github.com/JimLiu/baoyu-skills）

**5、制作 HTML 类**

5.1 `plannotator/effective-html` · 3.4k★ · MIT（HTML 制品专精：能直接打开的网页产物——原型、线框、图表、方案页；代表 SKILL —— html / html-prototype / html-wireframe / html-diagram / html-plan / design-artifact）（https://github.com/plannotator/effective-html）

5.2 `zarazhangrui/frontend-slides` · 30k★ · MIT（同 4.2——成品本身就是 HTML 幻灯片，做网页演示归这一类同样命中）（https://github.com/zarazhangrui/frontend-slides）

5.3 `JimLiu/baoyu-skills` · 26.2k★ · MIT（同 4.3——HTML 侧代表 SKILL —— baoyu-markdown-to-html / baoyu-diagram / baoyu-infographic）（https://github.com/JimLiu/baoyu-skills）

**6、子智能体与智能体团队（本机 DSH 内置能力，不是仓库）**

这一类没有仓库可读——它是手上的工具，命中即**用**。**默认先问一句「这件事能拆吗」**：任务能拆成互不依赖的几块、需要多角度独立验证、或需要长期并行推进时，就分出去，别一个人从头顶到尾。它也**不适用** `PROMPT.md` §6 的 Progressive Skill Loading——要读的是本机工具的实际签名，不是 `SKILL.md`。

6.1 `subagent`（开一个独立子智能体跑自包含任务——调研、局部实现、独立分析；默认后台运行，结果作为一条收件消息回来，之后可用 `send_message` 继续追加指令）

6.2 `subagent_fork`（同上，但继承本会话已完成的上下文——「接着刚才那件事往下做」这类委派用它，省掉重新交代背景）

6.3 `workflow`（大规模扇出：几十上百个独立子任务并行跑——批量审计、批量迁移、多角度验证；用一段 JS 脚本编排，`pipeline` 让每项各自流过各阶段，只有真正需要汇总的阶段才用 `parallel` 设屏障）

6.4 `spawn_teammate` + `send_message` + `wait_agent` + `team_task_*`（智能体团队：多个持久队友 + 共享任务板；写入范围拆开、任务依赖显式登记，给出最终答案前必须等齐必需的队友）

**怎么选：** 一两件 → `subagent` / `subagent_fork`；几十件同类 → `workflow`；多人并行且要互相看进度 → 团队。**互相独立的委派在同一条消息里一起发出去**，不要串行等——串行等于自己给自己排队。

> 团队多一条约束：只在用户明确要求组队时建队；任务规模明显够大、建队收益清晰时，可以主动提议，但提议不等于建队。工具名以本机实际暴露的为准。
