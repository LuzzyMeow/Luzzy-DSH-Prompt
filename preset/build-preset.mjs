#!/usr/bin/env node
/**
 * 由 ../PROMPT.md 生成同目录的 cordis.patch.yml（DSH agent preset 声明）。
 *
 *   node preset/build-preset.mjs
 *
 * 约定（改之前先读 AGENTS.md 第三节）：
 *   - PROMPT.md 是人设的唯一真源；本脚本是它进入 YAML 的唯一通道。
 *   - cordis.patch.yml 由本脚本生成，**不要手工编辑**（手改会让下次生成产生无法比对的 diff）。
 *   - 生成后立刻回验：把 YAML 块标量解析回来，与 PROMPT.md 逐字节比对；不一致就报错退出 1，并保留旧文件。
 *
 * 退出码：0 = 生成且回验通过；1 = 校验或回验失败（不写文件）。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const PROMPT = path.join(root, "PROMPT.md");
const TOOLS = path.join(here, "tools.patch.yml");
const OUT = path.join(here, "cordis.patch.yml");

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
# 生效路径：安装后 DSH 读取的是安装时生成的快照，不是本文件——
#   改完必须重新安装一次本目录（plugin_manager 的 install_bundle），
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
const tools = readTools();
const yamlText = render(prompt, tools);

const back = readBackPrefix(yamlText);
if (back !== prompt) {
  const a = prompt.split("\n");
  const b = back.split("\n");
  const at = a.findIndex((line, i) => line !== b[i]);
  fail(`回验失败：第 ${at + 1} 行不一致\n  PROMPT.md : ${JSON.stringify(a[at])}\n  YAML 侧   : ${JSON.stringify(b[at])}`);
}

const previous = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;
fs.writeFileSync(OUT, yamlText, "utf8");

const lines = prompt.split("\n").length;
const rows = (tools.match(/^ {10}- id: /gm) || []).length;
console.log(`[build-preset] 已生成 ${path.relative(root, OUT)}`);
console.log(`[build-preset] 人设回验通过：${lines} 行 / ${[...prompt].length} 字，与 PROMPT.md 逐字节一致`);
console.log(`[build-preset] 工具行：${rows} 条（persona 之外，来自 tools.patch.yml）`);
console.log(`[build-preset] 相对上一版：${previous === yamlText ? "无变化" : previous === null ? "首次生成" : "有变化"}`);
