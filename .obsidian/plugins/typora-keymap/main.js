const { Plugin, PluginSettingTab, Setting, Notice } = require("obsidian");

/**
 * Typora Keymap for Obsidian
 *
 * 1. 注册 Obsidian 没有的编辑命令：标题级别（再按一次退回正文）、标题升降级、
 *    下划线、行内代码、注释、图片、公式块、水平线、任务列表。
 *    这些命令在注册时就带默认键位（addCommand 的 hotkeys 参数），装完即用。
 *
 * 2. 内置命令（加粗、表格、源码模式、侧边栏、大纲、标签页…）无法自带默认键位，
 *    提供「一键套用 Typora 键位」按钮，走 app.hotkeyManager 批量设置，
 *    效果等同用户在「设置 → 快捷键」里手动改，可随时「恢复默认」。
 */

/* ---------- 键位表 ---------- */

/** 本插件自己注册的命令 → 默认键位（装完即生效） */
const OWN_HOTKEYS = {
  "set-heading-1": [{ modifiers: ["Mod"], key: "1" }],
  "set-heading-2": [{ modifiers: ["Mod"], key: "2" }],
  "set-heading-3": [{ modifiers: ["Mod"], key: "3" }],
  "set-heading-4": [{ modifiers: ["Mod"], key: "4" }],
  "set-heading-5": [{ modifiers: ["Mod"], key: "5" }],
  "set-heading-6": [{ modifiers: ["Mod"], key: "6" }],
  "set-paragraph": [{ modifiers: ["Mod"], key: "0" }],
  "heading-up": [{ modifiers: ["Mod"], key: "=" }],
  "heading-down": [{ modifiers: ["Mod"], key: "-" }],
  "toggle-underline": [{ modifiers: ["Mod"], key: "U" }],
  "toggle-code": [{ modifiers: ["Mod", "Shift"], key: "`" }],
  "toggle-comment": [{ modifiers: ["Mod", "Shift"], key: "C" }],
  "insert-image": [{ modifiers: ["Mod", "Shift"], key: "I" }],
  "insert-math": [{ modifiers: ["Mod", "Shift"], key: "M" }],
  "insert-hr": [{ modifiers: ["Mod", "Shift"], key: "H" }],
  "toggle-task": [{ modifiers: ["Mod", "Shift"], key: "X" }],
};

/** 内置命令 → 一键套用的键位（点按钮后写入，等同手动改设置） */
const CORE_HOTKEYS = {
  "editor:toggle-bold": [{ modifiers: ["Mod"], key: "B" }],
  "editor:toggle-italic": [{ modifiers: ["Mod"], key: "I" }],
  "editor:toggle-strikethrough": [{ modifiers: ["Alt", "Shift"], key: "5" }],
  "editor:insert-link": [{ modifiers: ["Mod"], key: "K" }],
  "editor:insert-table": [{ modifiers: ["Mod"], key: "T" }],
  "editor:insert-codeblock": [{ modifiers: ["Mod", "Shift"], key: "K" }],
  "editor:toggle-blockquote": [{ modifiers: ["Mod", "Shift"], key: "Q" }],
  "editor:toggle-numbered-list": [{ modifiers: ["Mod", "Shift"], key: "[" }],
  "editor:toggle-bullet-list": [{ modifiers: ["Mod", "Shift"], key: "]" }],
  "editor:indent-list": [{ modifiers: ["Mod"], key: "]" }],
  "editor:unindent-list": [{ modifiers: ["Mod"], key: "[" }],
  "editor:clear-formatting": [{ modifiers: ["Mod"], key: "\\" }],
  "editor:toggle-source": [{ modifiers: ["Mod"], key: "/" }],
  "app:toggle-left-sidebar": [{ modifiers: ["Mod", "Shift"], key: "L" }],
  "outline:open": [{ modifiers: ["Mod", "Shift"], key: "1" }],
  "workspace:goto-tab-1": [{ modifiers: ["Alt"], key: "1" }],
  "workspace:goto-tab-2": [{ modifiers: ["Alt"], key: "2" }],
  "workspace:goto-tab-3": [{ modifiers: ["Alt"], key: "3" }],
  "workspace:goto-tab-4": [{ modifiers: ["Alt"], key: "4" }],
  "workspace:goto-tab-5": [{ modifiers: ["Alt"], key: "5" }],
  "workspace:goto-tab-6": [{ modifiers: ["Alt"], key: "6" }],
  "workspace:new-tab": [{ modifiers: ["Mod"], key: "N" }],
  "file-explorer:new-file": [{ modifiers: ["Mod", "Shift"], key: "N" }],
  "app:go-back": [{ modifiers: ["Mod", "Alt"], key: "ArrowLeft" }],
  "app:go-forward": [{ modifiers: ["Mod", "Alt"], key: "ArrowRight" }],
  // Typora 的 Ctrl+/ 是源码模式，Obsidian 默认给了「注释」，这里让出来
  "editor:toggle-comment": [],
};

const NOT_MAPPED = [
  ["Ctrl+S / Ctrl+Shift+S", "保存 / 另存为", "Obsidian 自动保存，无此命令"],
  ["Ctrl+O / Ctrl+P", "打开 / 快速打开", "Obsidian 用 Ctrl+O 快速切换、Ctrl+P 命令面板，保留原生"],
  ["Ctrl+N / Ctrl+W / Ctrl+Q", "新建 / 关闭 / 退出", "属应用行为，不接管"],
  ["Ctrl+L / Ctrl+D", "选择行 / 选择单词", "Obsidian 没有文本选择类命令"],
  ["Ctrl+E", "选择样式范围", "Obsidian 用它切换阅读视图，保留"],
  ["Ctrl+Shift+Backspace", "删除表格行", "Obsidian 没有表格编辑命令，可配 Advanced Tables 插件"],
  ["F8 / F9", "专注 / 打字模式", "Obsidian 无内置，需第三方插件"],
];

/* ---------- 编辑辅助 ---------- */

/** 这一行现在是几级标题（0 = 正文）。 */
function headingLevelOf(line) {
  const m = /^\s*(#{1,6})\s+/.exec(line);
  return m ? m[1].length : 0;
}

/** 去掉行首的标题标记，留下正文内容。 */
function stripHeading(line) {
  return line.replace(/^\s*#{1,6}\s+/, "");
}

function applyLevel(editor, lineNo, level) {
  const body = stripHeading(editor.getLine(lineNo));
  editor.setLine(lineNo, level > 0 ? "#".repeat(level) + " " + body : body);
}

/** 对选中的每一行执行 fn。 */
function eachSelectedLine(editor, fn) {
  const from = editor.getCursor("from").line;
  const to = editor.getCursor("to").line;
  for (let i = from; i <= to; i++) fn(i, editor.getLine(i));
}

/** 设成指定级别；已经是这一级就退回正文（再按一次取消）。 */
function setHeading(editor, level) {
  eachSelectedLine(editor, (i, line) => {
    const cur = headingLevelOf(line);
    const next = level !== 0 && cur === level ? 0 : level;
    applyLevel(editor, i, next);
  });
}

/** 标题升 / 降一级。正文升一级变 1 级标题，1 级标题降一级变正文。 */
function shiftHeading(editor, delta) {
  eachSelectedLine(editor, (i, line) => {
    const cur = headingLevelOf(line);
    let next;
    if (delta > 0) {
      next = cur === 0 ? 1 : Math.min(6, cur + 1);
    } else {
      next = cur <= 1 ? 0 : cur - 1;
    }
    applyLevel(editor, i, next);
  });
}

/** 用成对标记包裹选区；已经包着就取消。 */
function toggleWrap(editor, open, close) {
  const sel = editor.getSelection();
  if (!sel) {
    const pos = editor.getCursor();
    editor.replaceSelection(open + close);
    editor.setCursor({ line: pos.line, ch: pos.ch + open.length });
    return;
  }
  const from = editor.getCursor("from");
  const to = editor.getCursor("to");
  const line = editor.getLine(from.line);
  if (
    from.line === to.line &&
    line.slice(from.ch - open.length, from.ch) === open &&
    line.slice(to.ch, to.ch + close.length) === close
  ) {
    editor.replaceRange("", { line: to.line, ch: to.ch }, { line: to.line, ch: to.ch + close.length });
    editor.replaceRange("", { line: from.line, ch: from.ch - open.length }, { line: from.line, ch: from.ch });
    return;
  }
  editor.replaceSelection(open + sel + close);
}

/** 在光标处插入一段块级内容，并把光标放到 $caret 处。 */
function insertBlock(editor, template) {
  const token = "\u27E6caret\u27E7";
  const text = template.replace("$caret", token);
  const start = editor.getCursor();
  editor.replaceSelection(text);
  const lines = text.split("\n");
  const li = lines.findIndex((l) => l.indexOf(token) >= 0);
  if (li < 0) return;
  const ch = li === 0 ? start.ch + lines[li].indexOf(token) : lines[li].indexOf(token);
  const target = { line: start.line + li, ch: ch };
  editor.replaceRange("", target, { line: target.line, ch: target.ch + token.length });
  editor.setCursor(target);
}

/** 给选中的每一行加/去前缀（任务列表用）。 */
function toggleLinePrefix(editor, prefix) {
  const from = editor.getCursor("from").line;
  const to = editor.getCursor("to").line;
  const mark = prefix.trimStart();
  const lines = [];
  for (let i = from; i <= to; i++) lines.push(editor.getLine(i));
  const allHave = lines.every((l) => l.trimStart().startsWith(mark));
  for (let i = from; i <= to; i++) {
    const l = lines[i - from];
    if (allHave) {
      const idx = l.indexOf(mark);
      editor.setLine(i, l.slice(0, idx) + l.slice(idx + mark.length));
    } else {
      editor.setLine(i, prefix + l);
    }
  }
}

/* ---------- 插件主体 ---------- */

module.exports = class TyporaKeymapPlugin extends Plugin {
  onload() {
    for (let level = 1; level <= 6; level++) {
      this.addCommand({
        id: `set-heading-${level}`,
        name: `Set heading ${level} (press again to clear)`,
        hotkeys: OWN_HOTKEYS[`set-heading-${level}`],
        editorCallback: (e) => setHeading(e, level),
      });
    }
    this.addCommand({
      id: "set-paragraph",
      name: "Set paragraph (remove heading)",
      hotkeys: OWN_HOTKEYS["set-paragraph"],
      editorCallback: (e) => setHeading(e, 0),
    });
    this.addCommand({
      id: "heading-up",
      name: "Increase heading level",
      hotkeys: OWN_HOTKEYS["heading-up"],
      editorCallback: (e) => shiftHeading(e, 1),
    });
    this.addCommand({
      id: "heading-down",
      name: "Decrease heading level",
      hotkeys: OWN_HOTKEYS["heading-down"],
      editorCallback: (e) => shiftHeading(e, -1),
    });
    this.addCommand({
      id: "toggle-underline",
      name: "Underline",
      hotkeys: OWN_HOTKEYS["toggle-underline"],
      editorCallback: (e) => toggleWrap(e, "<u>", "</u>"),
    });
    this.addCommand({
      id: "toggle-code",
      name: "Inline code",
      hotkeys: OWN_HOTKEYS["toggle-code"],
      editorCallback: (e) => toggleWrap(e, "`", "`"),
    });
    this.addCommand({
      id: "toggle-comment",
      name: "Comment",
      hotkeys: OWN_HOTKEYS["toggle-comment"],
      editorCallback: (e) => toggleWrap(e, "%%", "%%"),
    });
    this.addCommand({
      id: "insert-image",
      name: "Insert image",
      hotkeys: OWN_HOTKEYS["insert-image"],
      editorCallback: (e) => insertBlock(e, "![]($caret)"),
    });
    this.addCommand({
      id: "insert-math",
      name: "Insert math block",
      hotkeys: OWN_HOTKEYS["insert-math"],
      editorCallback: (e) => insertBlock(e, "$$\n$caret\n$$"),
    });
    this.addCommand({
      id: "insert-hr",
      name: "Insert horizontal rule",
      hotkeys: OWN_HOTKEYS["insert-hr"],
      editorCallback: (e) => insertBlock(e, "\n---\n"),
    });
    this.addCommand({
      id: "toggle-task",
      name: "Task list",
      hotkeys: OWN_HOTKEYS["toggle-task"],
      editorCallback: (e) => toggleLinePrefix(e, "- [ ] "),
    });

    this.addSettingTab(new TyporaKeymapSettingTab(this.app, this));
  }

  /** 把 CORE_HOTKEYS 写进 Obsidian 的快捷键配置（等同在设置里手动改）。 */
  applyCoreKeymap() {
    const manager = this.app.hotkeyManager;
    const commands = (this.app.commands && this.app.commands.commands) || {};
    if (!manager || typeof manager.setHotkeys !== "function") {
      new Notice("这个版本的 Obsidian 不支持自动设置快捷键，请到「设置 → 快捷键」手动改。");
      return { applied: 0, missing: [] };
    }
    let applied = 0;
    const missing = [];
    for (const [id, hotkeys] of Object.entries(CORE_HOTKEYS)) {
      if (!commands[id]) {
        missing.push(id);
        continue;
      }
      manager.setHotkeys(id, hotkeys);
      applied++;
    }
    new Notice(
      `已套用 ${applied} 条 Typora 键位` + (missing.length ? `，${missing.length} 条命令不存在已跳过` : ""),
      6000
    );
    return { applied, missing };
  }

  /** 移除本插件写入的键位，恢复 Obsidian 默认。 */
  resetCoreKeymap() {
    const manager = this.app.hotkeyManager;
    if (!manager || typeof manager.removeHotkeys !== "function") return 0;
    let removed = 0;
    for (const id of Object.keys(CORE_HOTKEYS)) {
      manager.removeHotkeys(id);
      removed++;
    }
    new Notice(`已恢复 ${removed} 条内置键位`, 5000);
    return removed;
  }
};

class TyporaKeymapSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Typora Keymap" });

    new Setting(containerEl)
      .setName("一键套用 Typora 键位")
      .setDesc("把加粗、表格、源码模式、侧边栏等内置命令绑成 Typora 的键位（等同在「设置 → 快捷键」里手动改）")
      .addButton((b) =>
        b
          .setButtonText("套用")
          .setCta()
          .onClick(() => {
            this.plugin.applyCoreKeymap();
            this.display();
          })
      );

    new Setting(containerEl)
      .setName("恢复默认键位")
      .setDesc("移除本插件写入的内置命令键位，回到 Obsidian 默认")
      .addButton((b) =>
        b.setButtonText("恢复").onClick(() => {
          this.plugin.resetCoreKeymap();
          this.display();
        })
      );

    containerEl.createEl("h3", { text: "本插件命令（已自带默认键位）" });
    const t1 = containerEl.createEl("table");
    const h1 = t1.createEl("tr");
    ["Hotkey", "Command"].forEach((h) => h1.createEl("th", { text: h }));
    const pretty = (hks) =>
      hks && hks.length ? hks.map((hk) => hk.modifiers.map((m) => (m === "Mod" ? "Ctrl" : m)).concat(hk.key).join("+")).join(", ") : "—";
    for (const [id, hks] of Object.entries(OWN_HOTKEYS)) {
      const cmd = this.app.commands && this.app.commands.commands ? this.app.commands.commands[`typora-keymap:${id}`] : null;
      const row = t1.createEl("tr");
      row.createEl("td", { text: pretty(hks) });
      row.createEl("td", { text: cmd ? cmd.name : id });
    }

    containerEl.createEl("h3", { text: "内置命令（需点按钮套用）" });
    const t2 = containerEl.createEl("table");
    const h2 = t2.createEl("tr");
    ["Hotkey", "Command"].forEach((h) => h2.createEl("th", { text: h }));
    for (const [id, hks] of Object.entries(CORE_HOTKEYS)) {
      const cmd = this.app.commands && this.app.commands.commands ? this.app.commands.commands[id] : null;
      const row = t2.createEl("tr");
      row.createEl("td", { text: pretty(hks) });
      row.createEl("td", { text: cmd ? cmd.name : id });
    }

    containerEl.createEl("h3", { text: "Not migrated (no matching command)" });
    const t3 = containerEl.createEl("table");
    const h3 = t3.createEl("tr");
    ["Typora hotkey", "Action", "Why not"].forEach((h) => h3.createEl("th", { text: h }));
    for (const [key, name, why] of NOT_MAPPED) {
      const row = t3.createEl("tr");
      row.createEl("td", { text: key });
      row.createEl("td", { text: name });
      row.createEl("td", { text: why });
    }
  }
}

/* nosourcemap */