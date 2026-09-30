#!/usr/bin/env node
/**
 * 由 ../PROMPT.md + ../skills.registry.md 生成两份产物：
 *   - preset/cordis.patch.yml —— DSH agent preset 声明（提示词嵌在 persona 的 prefix 块标量里）
 *   - PROMPT.full.md         —— 注入后的完整提示词，供非 DSH 环境直接当 system prompt 用
 *
 *   node preset/build-preset.mjs
 *
 * 约定（改之前先读 AGENTS.md 第三节）：
 *   - PROMPT.md 是人设的唯一真源；skills.registry.md 是技能清单的唯一真源。
 *   - skills.registry.md 会被注入 PROMPT.md §6 的 SKILL-REGISTRY 区块——注入只在内存里，
 *     不回写 PROMPT.md；PROMPT.full.md 是这次注入的落盘结果，同样是产物，不要手改。
 *   - 两份产物都由本脚本生成，**不要手工编辑**（手改会让下次生成产生无法比对的 diff）。
 *   - 生成后立刻回验：YAML 块标量解析回来与「注入后的 PROMPT.md」逐字节比对，
 *     PROMPT.full.md 写盘后读回比对。不一致就报错退出 1，并保留旧文件。
 *
 * 退出码：0 = 生成且回验通过；1 = 校验或回验失败（不写文件）。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const PROMPT = path.join(root, "PROMPT.md");
const REGISTRY = path.join(root, "skills.registry.md");
const TOOLS = path.join(here, "tools.patch.yml");
const OUT = path.join(here, "cordis.patch.yml");
const FULL = path.join(root, "PROMPT.full.md"); // 注入后的完整提示词：非 DSH 环境直接用这份

/** 声明行元数据：改了这里，README 的展示名也要跟着看一遍。 */
const PRESET = {
  rowId: "preset-luzzy",
  id: "luzzy",
  name: "Luzzy",
  description: "鹿溪 · 猫耳少年人设（银白乱发 / 纯白大尾巴）；工具集与 DSH 自带 standard 预设一致。",
  order: 10,
};

const CONTENT_INDENT = " ".repeat(16); // 块标量正文缩进
const FIELD_INDENT = " ".repeat(14); // prefix / suffix 等字段缩进

function fail(message) {
  console.error(`[build-preset] ${message}`);
  process.exit(1);
}

function readPrompt() {
  if (!fs.existsSync(PROMPT)) fail(`找不到 ${PROMPT}`);
  const raw = fs.readFileSync(PROMPT, "utf8");
  if (raw.includes("\r\n")) {
    // 允许源码目录是 CRLF，但生成前必须规整——YAML 块标量回验会在第 1 行就失败。
    console.warn("[build-preset] PROMPT.md 含 CRLF，已按 LF 规整（仓库 .gitattributes 已钉 eol=lf）");
  }
  const lf = raw.replace(/\r\n/g, "\n").replace(/\n+$/, "");
  if (!lf.trim()) fail("PROMPT.md 是空的");

  // DSH 会把 persona 前缀里连续的 {{ ... }} 当 prompt 变量引用解析；
  // 变量名不合法（如全大写）会让整个 preset 加载失败，见 AGENTS.md 第四节。
  const bad = lf.split("\n").findIndex((line) => /\{\{[^}]*\}\}/.test(line));
  if (bad !== -1) {
    fail(`PROMPT.md 第 ${bad + 1} 行含双花括号变量语法，DSH 会当作 prompt 变量解析；占位符请写 \${...}`);
  }
  return lf;
}

function readTools() {
  if (!fs.existsSync(TOOLS)) fail(`找不到 ${TOOLS}`);
  const text = fs.readFileSync(TOOLS, "utf8").replace(/\r\n/g, "\n").replace(/\n+$/, "");
  const rows = text.split("\n").filter((line) => line.trim() && !line.trimStart().startsWith("#"));
  if (!rows.some((line) => /^ {10}- id: /.test(line))) {
    fail("tools.patch.yml 里没有找到 10 空格缩进的插件行——它应是 DSH 官方 standard 预设的工具行原文");
  }
  const badLine = rows.findIndex((line) => !line.startsWith(" ".repeat(10)));
  if (badLine !== -1) {
    const at = text.split("\n").indexOf(rows[badLine]) + 1;
    fail(`tools.patch.yml 第 ${at} 行不是 10 空格缩进（插件行必须嵌在 config.plugins 下）：${JSON.stringify(rows[badLine])}`);
  }
  return text;
}

function readRegistry() {
  if (!fs.existsSync(REGISTRY)) fail(`找不到 ${REGISTRY}`);
  const raw = fs.readFileSync(REGISTRY, "utf8");
  if (raw.includes("\r\n")) {
    console.warn("[build-preset] skills.registry.md 含 CRLF，已按 LF 规整");
  }
  const lf = raw.replace(/\r\n/g, "\n").replace(/\n+$/, "");
  if (!lf.trim()) fail("skills.registry.md 是空的");
  const bad = lf.split("\n").findIndex((line) => /\{\{[^}]*\}\}/.test(line));
  if (bad !== -1) {
    fail(`skills.registry.md 第 ${bad + 1} 行含双花括号变量语法，DSH 会当作 prompt 变量解析；占位符请写 \${...}`);
  }
  return lf;
}

/**
 * 把 registry 正文注入 PROMPT.md 的 SKILL-REGISTRY 区块（只在内存里，不回写源文件）。
 * 整块替换——连 BEGIN/END 标记一起去掉，产物里不带构建标记。
 * 区块位于 §6 之内，所以注入后 §8 仍是全文最后一节。
 */
function injectRegistry(prompt, registry) {
  const BEGIN = "<!-- SKILL-REGISTRY:BEGIN -->";
  const END = "<!-- SKILL-REGISTRY:END -->";
  const start = prompt.indexOf(BEGIN);
  const stop = prompt.indexOf(END);
  if (start === -1 || stop === -1 || stop < start) {
    fail("PROMPT.md 里找不到 SKILL-REGISTRY:BEGIN / END 区块（技能清单的注入点）");
  }
  return `${prompt.slice(0, start)}${registry}${prompt.slice(stop + END.length)}`;
}

function render(prompt, tools) {
  const body = prompt
    .split("\n")
    .map((line) => (line === "" ? "" : CONTENT_INDENT + line))
    .join("\n");

  return `# ============================================================================
# 鹿溪（Luzzy）· DSH agent preset 声明
# ----------------------------------------------------------------------------
# 本文件由 \`node preset/build-preset.mjs\` 从 ../PROMPT.md 生成，请勿手工编辑。
#   - 人设正文（system prompt）= PROMPT.md，逐字节嵌入下面的 prefix 块标量
#   - 工具行 = tools.patch.yml（照搬 DSH 自带 standard 预设）
#
# 生效路径：bundle 的 patch 是活文件（profile 里只有一条 link:，不存副本），
#   但 DSH 在**进程启动时**把每条声明建成内存组合树——所以改完要让 Host 重新读一次：
#   重新安装本目录（plugin_manager 的 install_bundle），或直接重启 DSH Desktop，
#   再由**新会话**选用；进行中的会话保持旧修订。
# ============================================================================
- insert:
    - id: ${PRESET.rowId}
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: ${PRESET.id}
        name: ${PRESET.name}
        description: ${PRESET.description}
        order: ${PRESET.order}
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            config:
              prefix: |-
${body}
${FIELD_INDENT}suffix: ''
${FIELD_INDENT}complete: false
${FIELD_INDENT}includeRuntimeContext: true
${tools}
`;
}

/** 从生成的文件里把 prefix 块标量读回来（不依赖 YAML 库，纯缩进解析）。 */
function readBackPrefix(yamlText) {
  const lines = yamlText.split("\n");
  const start = lines.findIndex((line) => /^\s+prefix: \|-\s*$/.test(line));
  if (start === -1) fail("生成的文件里找不到 `prefix: |-`");
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === "") {
      out.push("");
      continue;
    }
    if (line.startsWith(CONTENT_INDENT)) {
      out.push(line.slice(CONTENT_INDENT.length));
      continue;
    }
    break; // 回到 14 空格字段层，块标量结束
  }
  // 块标量里可能把正文末尾的空行也读进来；末尾空行不属于 PROMPT.md
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

const prompt = readPrompt();
const registry = readRegistry();
const tools = readTools();
const rendered = injectRegistry(prompt, registry);
const yamlText = render(rendered, tools);

const back = readBackPrefix(yamlText);
if (back !== rendered) {
  const a = rendered.split("\n");
  const b = back.split("\n");
  const at = a.findIndex((line, i) => line !== b[i]);
  fail(`回验失败：第 ${at + 1} 行不一致\n  注入后的 PROMPT.md : ${JSON.stringify(a[at])}\n  YAML 侧            : ${JSON.stringify(b[at])}`);
}

const previous = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;
fs.writeFileSync(OUT, yamlText, "utf8");

// 同一份合成结果再落一份纯提示词：任意 harness 直接把 PROMPT.full.md 当 system prompt 用。
// 它不是新的真源——真源仍是 PROMPT.md + skills.registry.md，本文件只是两者的产物。
const fullPrevious = fs.existsSync(FULL) ? fs.readFileSync(FULL, "utf8") : null;
fs.writeFileSync(FULL, `${rendered}\n`, "utf8");
const fullBack = fs.readFileSync(FULL, "utf8").replace(/\r\n/g, "\n").replace(/\n+$/, "");
if (fullBack !== rendered) {
  fail("PROMPT.full.md 回验失败：写入后读回与合成结果不一致");
}

const lines = rendered.split("\n").length;
const rows = (tools.match(/^ {10}- id: /gm) || []).length;
const entries = (registry.match(/^\d+\.\d+ `/gm) || []).length;
console.log(`[build-preset] 已生成 ${path.relative(root, OUT)}`);
console.log(`[build-preset] 已生成 ${path.relative(root, FULL)}（完整提示词，${fullPrevious === null ? "首次生成" : fullPrevious.replace(/\n+$/, "") === rendered ? "无变化" : "有变化"}）`);
console.log(`[build-preset] 人设回验通过：${lines} 行 / ${[...rendered].length} 字，与「PROMPT.md + skills.registry.md」逐字节一致`);
console.log(`[build-preset] 技能登记表：${entries} 条（来自 skills.registry.md）`);
console.log(`[build-preset] 工具行：${rows} 条（persona 之外，来自 tools.patch.yml）`);
console.log(`[build-preset] 相对上一版：${previous === yamlText ? "无变化" : previous === null ? "首次生成" : "有变化"}`);
