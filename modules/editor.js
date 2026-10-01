const STORAGE_KEY = "mokomoko-website-editor-v1";

const emptyDraft = () => ({
  schemaVersion: 1,
  contentOverrides: {},
  elementStyles: {},
  designTokens: {},
});

const getDraft = () => {
  try {
    return { ...emptyDraft(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return emptyDraft();
  }
};

const editablePath = (path) => {
  if (!path || /(^|\.)(price|originalPrice|applicablePetTypes|sortOrder|active|max)$/.test(path)) return false;
  if (/^(bookingForm|addons|integrations|meta)\./.test(path)) return false;
  if (/^calculator\.(species|limitedIncludedHours)/.test(path)) return false;
  return /^(announcement|hero|intro|navigation|philosophy|photographyTypes|plans|faq|booking|bookingCta|closing|calculator)\./.test(path);
};

const setPath = (target, path, value) => {
  if (!editablePath(path)) return false;
  const parts = path.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    if (cursor?.[parts[index]] == null) return false;
    cursor = cursor[parts[index]];
  }
  const key = parts.at(-1);
  if (cursor?.[key] == null || typeof cursor[key] !== "string") return false;
  cursor[key] = value;
  return true;
};

export function prepareEditorContent(content) {
  const clone = structuredClone(content);
  if (document.body.dataset.editor !== "true") return clone;
  const draft = getDraft();
  Object.entries(draft.contentOverrides).forEach(([path, value]) => {
    if (typeof value === "string") setPath(clone, path, value);
  });
  return clone;
}

export function initEditor() {
  if (document.body.dataset.editor !== "true") return;

  const inspector = document.querySelector("#editor-inspector");
  const draft = getDraft();
  let selected = null;
  inspector.innerHTML = `
    <div class="editor-header">
      <div><span>MOKOMOKO</span><h1>網站編輯模式</h1></div>
      <a href="../" class="editor-exit">查看正式網站</a>
    </div>
    <p class="editor-mobile-note">建議使用桌面版進行網站編輯。</p>
    <section class="inspector-panel">
      <h2>目前選取</h2>
      <p id="editor-selection">請在左側 Preview 點選可編輯文字。</p>
      <label class="editor-field">文字<textarea id="editor-text" rows="5" disabled></textarea></label>
      <div class="editor-field-grid">
        <label class="editor-field">字級<select id="editor-font-size" disabled><option value="">預設</option><option value="14px">14px</option><option value="16px">16px</option><option value="18px">18px</option><option value="20px">20px</option><option value="24px">24px</option><option value="32px">32px</option><option value="40px">40px</option><option value="56px">56px</option></select></label>
        <label class="editor-field">字重<select id="editor-font-weight" disabled><option value="">預設</option><option value="400">一般</option><option value="500">中等</option><option value="600">粗體</option></select></label>
      </div>
      <fieldset class="editor-align" disabled><legend>對齊</legend><label><input type="radio" name="editor-align" value=""><span>預設</span></label><label><input type="radio" name="editor-align" value="left"><span>左</span></label><label><input type="radio" name="editor-align" value="center"><span>中</span></label><label><input type="radio" name="editor-align" value="right"><span>右</span></label></fieldset>
    </section>
    <section class="inspector-panel">
      <h2>全站樣式</h2>
      <label class="editor-field">Section 間距 <output id="section-spacing-output"></output><input id="section-spacing" type="range" min="64" max="144" step="4"></label>
      <label class="editor-field">卡片圓角 <output id="card-radius-output"></output><input id="card-radius" type="range" min="0" max="32" step="2"></label>
      <label class="editor-field">卡片內距 <output id="card-padding-output"></output><input id="card-padding" type="range" min="16" max="40" step="2"></label>
      <label class="editor-field">內容寬度 <output id="content-width-output"></output><input id="content-width" type="range" min="880" max="1280" step="20"></label>
    </section>
    <div class="editor-actions"><button id="editor-export" type="button">Export Changes</button><button id="editor-reset" class="editor-danger" type="button">Reset Draft</button></div>
    <p id="editor-status" class="editor-status" aria-live="polite">草稿只保存在這個瀏覽器。</p>`;

  const controls = {
    selection: inspector.querySelector("#editor-selection"),
    text: inspector.querySelector("#editor-text"),
    size: inspector.querySelector("#editor-font-size"),
    weight: inspector.querySelector("#editor-font-weight"),
    align: inspector.querySelector(".editor-align"),
    status: inspector.querySelector("#editor-status"),
  };

  const save = (message = "草稿已自動保存。") => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    controls.status.textContent = message;
  };

  const applyElementStyle = (element, style = {}) => {
    element.style.fontSize = style.fontSize || "";
    element.style.fontWeight = style.fontWeight || "";
    element.style.textAlign = style.textAlign || "";
  };

  const applyStoredStyles = () => {
    document.querySelectorAll("[data-edit-path]").forEach((element) => {
      applyElementStyle(element, draft.elementStyles[element.dataset.editPath]);
    });
  };

  const tokenDefinitions = {
    "section-spacing": { property: "--space-section", fallback: 96, unit: "px" },
    "card-radius": { property: "--radius-card", fallback: 16, unit: "px" },
    "card-padding": { property: "--space-card", fallback: 24, unit: "px" },
    "content-width": { property: "--content-max", fallback: 1120, unit: "px" },
  };

  Object.entries(tokenDefinitions).forEach(([id, definition]) => {
    const input = inspector.querySelector(`#${id}`);
    const output = inspector.querySelector(`#${id}-output`);
    input.value = draft.designTokens[id] ?? definition.fallback;
    const apply = () => {
      draft.designTokens[id] = Number(input.value);
      document.documentElement.style.setProperty(definition.property, `${input.value}${definition.unit}`);
      output.textContent = `${input.value}${definition.unit}`;
    };
    apply();
    input.addEventListener("input", () => { apply(); save(); });
  });

  const selectElement = (element) => {
    selected?.classList.remove("editor-selected");
    selected = element;
    selected.classList.add("editor-selected");
    const path = selected.dataset.editPath;
    const style = draft.elementStyles[path] || {};
    controls.selection.textContent = path;
    controls.text.disabled = false;
    controls.size.disabled = false;
    controls.weight.disabled = false;
    controls.align.disabled = false;
    controls.text.value = selected.textContent.trim();
    controls.size.value = style.fontSize || "";
    controls.weight.value = style.fontWeight || "";
    const align = inspector.querySelector(`input[name="editor-align"][value="${style.textAlign || ""}"]`);
    if (align) align.checked = true;
  };

  document.querySelector(".editor-preview").addEventListener("click", (event) => {
    const element = event.target.closest("[data-edit-path]");
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    selectElement(element);
  }, true);

  controls.text.addEventListener("input", () => {
    if (!selected) return;
    const path = selected.dataset.editPath;
    draft.contentOverrides[path] = controls.text.value;
    document.querySelectorAll(`[data-edit-path="${CSS.escape(path)}"]`).forEach((element) => { element.textContent = controls.text.value; });
    save();
  });

  const updateSelectedStyle = () => {
    if (!selected) return;
    const path = selected.dataset.editPath;
    const checkedAlign = inspector.querySelector('input[name="editor-align"]:checked');
    draft.elementStyles[path] = {
      fontSize: controls.size.value,
      fontWeight: controls.weight.value,
      textAlign: checkedAlign?.value || "",
    };
    document.querySelectorAll(`[data-edit-path="${CSS.escape(path)}"]`).forEach((element) => applyElementStyle(element, draft.elementStyles[path]));
    save();
  };
  controls.size.addEventListener("change", updateSelectedStyle);
  controls.weight.addEventListener("change", updateSelectedStyle);
  controls.align.addEventListener("change", updateSelectedStyle);

  inspector.querySelector("#editor-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mokomoko-site-changes.json";
    link.click();
    URL.revokeObjectURL(url);
    controls.status.textContent = "變更 JSON 已匯出。";
  });

  inspector.querySelector("#editor-reset").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  applyStoredStyles();
  window.__MOKOMOKO_EDITOR__ = { storageKey: STORAGE_KEY, getDraft, editablePath };
}
