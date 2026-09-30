# Luzzy-DSH-Prompt 维护指南

面向后续维护本仓库的 Agent。**这里只讲怎么改、改哪里、什么不许动**；人设正文在 [`PROMPT.md`](PROMPT.md)，门面文档在 [`README.md`](README.md)。

先读这一句：**`PROMPT.md` 是鹿溪人设的唯一真源，`preset/cordis.patch.yml` 是从它生成的**。任何"顺手改一下 YAML"的操作都是错的。

---

## 一、仓库是什么

- **`PROMPT.md`** —— 鹿溪人设提示词，414 行。用户给定的原文，**非用户明确要求不要改写**。
- **`preset/`** —— 把这个仓库装进 DeepSeek Harness（DSH）的预设 bundle：一条 `@deepseek-ai/dsh-agent-preset` 声明行 + 18 条工具行（取自 DSH 自带 `standard` 预设）。
- **关系**：人设住在 `PROMPT.md`，预设负责把它送进 DSH 的 prompt 装配链。两层各一份数据、单向流动，不存在第二处需要同步的副本。

**历史沿革（别踩）**：本仓库 2026-09-29 由 `LuzzyPrompt` 更名而来，内容是**完全替换**——旧版《综合智能体行为契约》与其 `skills/`、`evals/`、旧 README/AGENTS 全部移除，提交历史已清空。旧文档里那套 `~/.dsh/.agent-presets/<名>/` 部署链路（`persona.md` + `agent.cordis.yml` + `sync-persona.mjs`）在当前 DSH 上**已经失效**，见第三节。

---

## 二、当前官方 DSH 的预设机制（2026-09 实测）

### 心智模型

预设**不是文件、不是目录**，而是普通 Cordis composition 里的一条**声明行**，由 bundle 的 patch 携带：

```yaml
- insert:
    - id: preset-luzzy                              # Loader 行 id，惯例 preset-<id>
      name: '@deepseek-ai/dsh-agent-preset'         # 声明插件
      config:
        id: luzzy                                   # 会话保存的 preset 标识符（必填）
        name: Luzzy                                 # 展示名
        description: …                              # 预设列表里的说明
        order: 10                                   # 列表排序
        plugins: [ … ]                              # 必填：子插件行列表
```

| 角色 | 包 / 服务 | 说明 |
| --- | --- | --- |
| 声明 | `@deepseek-ai/dsh-agent-preset` | 只声明子插件，不拥有 Agent；改声明只影响之后新建的 Agent |
| 注册表 | `@deepseek-ai/dsh-agent-preset-registry` | 服务 `ctx.agentPresets`：`list` / `resolve` / `readDocument` / `mount` / `recompose` / `compositionInventory` 等；管预设代际与释放 |
| 人设 | `@deepseek-ai/dsh-persona` | 字段 `prefix`（**必填**，人设段落，order 0）/ `suffix`（默认 `''`，空即遮蔽全局后缀）/ `complete`（默认 `false`，true = 只用渲染后的前缀当系统提示词）/ `includeRuntimeContext`（默认 `true`，false 抑制该作用域的全部 runtime-context） |
| 界面 | `@deepseek-ai/dsh-client-ui-agent-preset` | 预设选择器 |

**人设行只能挂在 preset 内**：`dsh-system-prompt` 自己持有部署级人设，`@deepseek-ai/dsh-persona` 在 agent scope 之外挂载会与它相撞并明确报错。

### 官方自带预设长什么样

`standard` / `ptc` / `minimal` / `cordis` 四条，来自 `@deepseek-ai/dsh-web-app` bundle 的 `presets/<id>.patch.yml`（order 1/2/3/4）。它们是**最好的模板**——`minimal.patch.yml` 最短，`standard.patch.yml` 就是本仓库 `tools.patch.yml` 的来源。

Desktop 里这些文件在 `app.asar` 内部，shell 打不开。两条读法：

1. **推荐**：用 `cordis_inspect_query` 的 Host `Config` provider，查询某个 `preset-<id>` 行的 `entry` id，返回的 `packageDir` 就是该 bundle 的落点，再读它的 `README.zh.md` 与 `lib/`；
2. 需要看原始 `presets/*.patch.yml` 时，解包 asar（Electron 的 asar 就是「8 字节头 + pickle 头 + 数据区」，纯 Node 可读）：

```js
// node asar-peek.mjs  用法：ASAR=<app.asar> FILTER=presets/ node asar-peek.mjs
import fs from 'node:fs';
const asar = process.env.ASAR, filter = process.env.FILTER ?? '';
const fd = fs.openSync(asar, 'r');
const size = Buffer.alloc(8); fs.readSync(fd, size, 0, 8, 0);
const headerSize = size.readUInt32LE(4);
const head = Buffer.alloc(headerSize); fs.readSync(fd, head, 0, headerSize, 8);
const json = head.toString('utf8', 8, 8 + head.readUInt32LE(4));
const base = 8 + headerSize;
const files = []; (function walk(node, prefix) {
  for (const [name, e] of Object.entries(node.files ?? {})) {
    const p = prefix ? `${prefix}/${name}` : name;
    if (e.files) walk(e, p); else files.push({ p, size: e.size, offset: Number(e.offset) });
  }
})(JSON.parse(json.slice(0, json.lastIndexOf('}') + 1)), '');
for (const f of files.filter((f) => f.p.includes(filter))) {
  const buf = Buffer.alloc(f.size); fs.readSync(fd, buf, 0, f.size, base + f.offset);
  console.log(`\n===== ${f.p} =====\n${buf.toString('utf8')}`);
}
```

### 旧机制：已经不读了

早期 DSH 的用户预设是目录 `$DSH_HOME/.agent-presets/<id>/`（`preset.yml` 给 name/description/order，`agent.cordis.yml` 给插件列表）。**当前版本没有任何代码读它**——本机已实测该目录不存在，且新版预设全部走声明行。

若在别的机器上遇到它，按这个映射迁移（然后删掉旧目录）：

| 旧 | 新 |
| --- | --- |
| 目录名 | `config.id` |
| `preset.yml` 的 `name` / `description` / `order` | 同名字段 |
| `agent.cordis.yml` 的插件条目 | `config.plugins` **逐条照搬**，但每个包名都要核对是否还存在（改过名的包会在激活时失败） |

---

## 三、改这个仓库的预设：标准流程

```bash
# 1) 改人设：编辑 PROMPT.md（唯一真源）
# 2) 重新生成声明行；脚本会把嵌入结果解析回来逐字节比对，不一致就退出 1 且不覆盖旧文件
node preset/build-preset.mjs
# 3) 重新安装（下面的 install_bundle），再开新会话
```

**安装**（在 DSH 内让 Agent 执行，不要用 shell 复刻 pnpm 步骤）：

```
plugin_manager · action: install_bundle · target: <本仓库 preset/ 的绝对路径>
```

**校验**（三步都过才算装好）：

| 看什么 | 怎么验 | 通过的样子 |
| --- | --- | --- |
| bundle 在册 | `plugin_manager` `list_bundles` | 列表里出现本 bundle |
| 行已激活 | `plugin_manager` `list_plugins` | `preset-luzzy` 行 active；激活失败会留在名册上带诊断信息 |
| 配置合法 | `cordis_inspect_query` → host `Config` → `listConfigs`，`name=@deepseek-ai/dsh-agent-preset` | 出现 `include:preset-luzzy`，`status: schema` |

**生效时机**：只对**新建会话**生效。已存在的会话与它的子代理保持启动时的插件修订——验证改动必须开新会话，别在老会话里下结论。

### 要加第二个预设

两种做法，按耦合度选：

- **同一 bundle 再加一条 `insert` 行**（人设相近、工具集相同）——行 id 取 `preset-<新 id>`；
- **另建一个 bundle 目录**（人设与工具完全独立，便于单独卸载）。

两条硬约束：**`config.id` 全局唯一**（重复 id 会让声明加载失败），**行 id 惯例 `preset-<id>`**（便于 `Config` provider 定位与 profile 层覆盖）。

要改工具集：只动 `preset/tools.patch.yml`，然后重跑 `build-preset.mjs`。增删后的行必须保持 **10 空格**缩进（`config.plugins` 的下级），平台条件沿用官方写法 `!!js process.platform === 'win32'`。

### 移动或更名本仓库目录（会让已安装的预设断链）

预设不是被复制进 profile 的，而是以 `link:`（Windows 上落成 **junction**）挂进去的——**安装源必须原地存在**。目录一移动，junction 指向空路径，插件页立刻报：

```text
插件元信息错误: Plugin metadata for @local/dsh-luzzy-preset:
Error: <旧路径>\package.json: ENOENT: no such file or directory
```

正确顺序（缺一不可）：

1. **先卸载**：`plugin_manager` `remove_bundle`，target `@local/dsh-luzzy-preset`（别先移动，否则中途留一个悬空链接）；
2. **再移动 / 更名目录**——整个工作副本移动不影响仓库本身，remote、历史、`.git` 都跟着走；
3. **从新路径重装**：`install_bundle`，target `<新绝对路径>/preset`；
4. **核验持久状态已换新**（旧路径不该再出现在这两处）：

```powershell
$p = $env:DSH_PROFILE_DIR
Select-String -Path "$p\package.json","$p\pnpm-lock.yaml" -Pattern '<旧路径片段>'   # 期望：无输出
Get-Item "$p\node_modules\@local\dsh-luzzy-preset" -Force | Select-Object LinkType,Target
```

5. **刷新界面**：插件页会把"移动那一刻"的失败信息缓存住——Host 已经恢复正常，页面上照样是红的。

**判据：别被界面上的旧报错带偏。** 报错里的路径**已经不存在**，同时 `list_bundles` 正常（`installed: true`）、junction 指向新路径 → 那是界面残留，**不是安装失败**，刷新页面（F5）即可清掉，仍在就重启 DSH Desktop。反过来，若 `list_bundles` 里没有这个 bundle、或 `preset-luzzy` 行没激活，才是真装坏了——回到本节开头重装。

> 历史日志（`.plugin-manager/logs/*/pnpm.log`）里必然会留着旧路径的加减记录，那是操作流水，不用清、也别拿它判断当前状态；**当前状态只看 `package.json` / `pnpm-lock.yaml` / junction 指向 / `list_bundles`**。

---

## 四、禁忌与坑（都踩过）

| 坑 | 后果 | 规矩 |
| --- | --- | --- |
| `PROMPT.md` 里出现双花括号变量语法 | DSH 把 persona 前缀当模板渲染，`{{…}}` 会被当 prompt 变量解析；变量名不合法**整个预设加载失败** | 占位符统一写 `${...}`；`build-preset.mjs` 已前置拦截并退出 1 |
| 手改 `cordis.patch.yml` | 下次生成产生无法比对的 diff，人设真源被架空 | 只改 `PROMPT.md` 与 `tools.patch.yml`，其余重跑脚本 |
| CRLF 行尾 | 逐字节回验在第 1 行就失败 | 全仓库 LF（`.gitattributes` 钉 `eol=lf`）；脚本仍会兜底规整并告警 |
| 重复 `config.id` | 声明加载失败，预设不进名册 | 加预设前先确认 id 未被占用 |
| 改了预设就在当前会话里试 | 老会话不会更新，白白怀疑改动无效 | 开新会话验证 |
| **直接移动 / 更名仓库目录** | 预设是 `link:` 挂载的，junction 悬空 → 插件页报 `包元信息错误 … ENOENT`，预设失效 | 先 `remove_bundle` → 移动 → 从新路径 `install_bundle` → 刷新界面；判据见第三节末 |
| 拿界面上的旧报错当当前状态 | 缓存住的失败信息会误导排查方向 | 以 `list_bundles` / junction 指向 / `package.json` 为准 |
| 同一条规则写两处 | 迟早漂移，且没人知道该信哪份 | README / AGENTS 只**描述**，不复述 `PROMPT.md` 的规则 |
| `git push --force` | 覆盖远端历史 | 除仓库整体替换那一次外禁用；需要时先确认 |
| 临时文件留在仓库里 | 无主文件进版本库 | 本轮产物本轮清 |
| 硬编码密钥 / 令牌 | 公开仓库泄露 | 绝不；文档里的占位符写法不算 |

---

## 五、仓库操作（GitHub）

- 远端：`https://github.com/LuzzyMeow/Luzzy-DSH-Prompt`（2026-09-29 前名为 `LuzzyPrompt`）。
- **Git 一律走 SSH**：`git remote -v` 两行都应以 `git@github.com:` 开头。
- `gh repo create` / `gh repo rename` 这类命令**默认把 remote 改写成 HTTPS**，执行完立刻核验：

```bash
gh repo rename <新名>            # 在仓库目录内执行，会顺带改动 remote
git remote -v                    # 出现 https://github.com/ 就纠正
git remote set-url origin git@github.com:LuzzyMeow/Luzzy-DSH-Prompt.git
git remote -v                    # 两行都应是 git@github.com:
```

- 改简介与标签（描述要与 `README.md` 首段口径一致，别停在旧架构）：

```bash
gh repo edit --description "<一句话>"
gh repo edit --add-topic dsh --add-topic deepseek-harness --add-topic agent-preset
gh repo edit --remove-topic <过时标签>
gh repo view --json name,description,repositoryTopics
```

- **更名类操作的影响面**（`gh repo rename` 只改了远端的名字）：本地目录名、README/AGENTS 里的路径与 clone 命令、文档里的 URL、topics、本机 DSH 预设的 `description`——改完在仓库内全量搜一次旧名，逐个判定「该改」还是「该留」。

---

## 六、README 里的数字必须实测

徽章与表格里的行数、字数**按实测写，不估算**：

```bash
wc -l PROMPT.md                                   # 行数
node -e "const t=require('fs').readFileSync('PROMPT.md','utf8');console.log([...t.trimEnd()].length,'字')"
node -e "console.log(require('fs').statSync('PROMPT.md').size,'字节')"
```

`PROMPT.md` 是唯一会变的数字来源；`preset/tools.patch.yml` 的行数变了，README 徽章里的「工具集」说明也要跟着看一遍。

---

## 七、DSH 迭代快：用前复核这几条

本文件的事实基于 2026-09 的 DSH（Desktop `app.asar` 内的 `@deepseek-ai/*` 包为 `0.2.0-rc.2`）。官方在动，路径与包名都可能变——**动手前先复核，别照抄**：

1. **包是否还在**：`cordis_inspect_query` → host `Config` → `listConfigs`（不带 `name`），看 `@deepseek-ai/dsh-agent-preset` / `@deepseek-ai/dsh-persona` 是否在列；
2. **服务是否还在**：`cordis_inspect_query` → host `Service` → `listService`，确认 `agentPresets` 的方法签名；
3. **官方 skill 是最权威的说明书**：`@deepseek-ai/dsh-agent-preset` 包内随包出货 `skills/editing-cordis-compositions/SKILL.md`（怎么建、怎么覆盖官方预设、怎么验证）、`cordis-composition-reference`（patch 方言 + 可挂载插件清单）、`cordis-plugin-development`（新写插件代码时）。**改预设前先读它们**；
4. **官方 `standard` 预设是否加了新工具行**：加了就同步进 `tools.patch.yml`；
5. 发现本文件与实测不符 → **先按实测做，再把本文件改对**（顺手在提交信息里写明依据）。

---

## 八、改完过一遍

- [ ] `node preset/build-preset.mjs` 通过（人设逐字节回验 OK）
- [ ] `PROMPT.md` 与嵌入的 prefix 一致（脚本已保证；仍建议独立解析一次）
- [ ] `preset/cordis.patch.yml` 没被手工改过（`git diff` 里只有生成结果的变化）
- [ ] 安装后三条校验（bundle 在册 / 行 active / Config 有 `preset-luzzy`）全过
- [ ] 本仓库目录若被移动 / 更名过：已按第三节顺序「卸载 → 移动 → 从新路径重装」，且 `package.json` 与 `pnpm-lock.yaml` 里搜不到旧路径
- [ ] 界面若还红着旧路径的 `包元信息错误`：已刷新确认是缓存残留（`list_bundles` 正常即不是装坏）
- [ ] 新会话里能选到 Luzzy，人设生效
- [ ] README 数字实测更新；描述与 topics 口径一致
- [ ] 技能清单若有变动：条目里的 stars / 许可已重测，且逐条过了 `PROMPT.md` §6 的收录标准
- [ ] 仓库内搜一遍旧名 / 旧机制残留（`LuzzyPrompt`、`.agent-presets`、`sync-persona`）
- [ ] 没有临时文件、没有密钥形态字符串（`sk-` / `ghp_` / `Bearer`）

---

## 九、给 Agent 的一句话

**人设只有一个真源，预设只是它的搬运工。** 想改鹿溪，改 `PROMPT.md` 然后重跑脚本；想改他能用的工具，改 `tools.patch.yml`；想改 DSH 里怎么装、怎么选，那是 DSH 的事——先读官方 skill，再动本仓库。
