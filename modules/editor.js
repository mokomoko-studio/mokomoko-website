const STORAGE_KEY = "mokomoko-website-editor-v1";
const ADDON_IMAGE_CHANNEL = "mokomoko-addon-image-preview-v1";
const IMAGE_DB_NAME = "mokomoko-website-editor-images-v1";
const IMAGE_STORE_NAME = "drafts";
const IMAGE_DRAFT_KEY = "addonProductImageDrafts";

const emptyDraft = () => ({
  schemaVersion: 2,
  contentOverrides: {},
  elementStyles: {},
  designTokens: {},
  addonProductImageDrafts: {},
});

const getLocalDraft = () => {
  try {
    return { ...emptyDraft(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return emptyDraft();
  }
};

const openImageDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(IMAGE_DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(IMAGE_STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const readAddonImageDrafts = async () => {
  if (!("indexedDB" in window)) return {};
  const database = await openImageDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(IMAGE_STORE_NAME, "readonly").objectStore(IMAGE_STORE_NAME).get(IMAGE_DRAFT_KEY);
      request.onsuccess = () => resolve(request.result || {});
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
};

const writeAddonImageDrafts = async (imageDrafts) => {
  if (!("indexedDB" in window)) throw new Error("IndexedDB is unavailable");
  const database = await openImageDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");
      transaction.objectStore(IMAGE_STORE_NAME).put(structuredClone(imageDrafts), IMAGE_DRAFT_KEY);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

const clearAddonImageDrafts = async () => {
  if (!("indexedDB" in window)) return;
  const database = await openImageDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");
      transaction.objectStore(IMAGE_STORE_NAME).delete(IMAGE_DRAFT_KEY);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

let draftPromise;
const getDraft = () => {
  if (!draftPromise) {
    draftPromise = (async () => {
      const localDraft = getLocalDraft();
      const storedImageDrafts = await readAddonImageDrafts().catch(() => ({}));
      const legacyImageDrafts = localDraft.schemaVersion >= 2 ? localDraft.addonProductImageDrafts || {} : {};
      const addonProductImageDrafts = Object.keys(storedImageDrafts).length ? storedImageDrafts : legacyImageDrafts;
      return { ...localDraft, schemaVersion: 2, addonProductImageDrafts };
    })();
  }
  return draftPromise;
};

const editablePath = (path) => {
  if (!path || /(^|\.)(price|originalPrice|applicablePetTypes|sortOrder|active|max)$/.test(path)) return false;
  if (/^(addons|integrations|meta)\./.test(path)) return false;
  if (/^bookingForm\./.test(path) && !/^bookingForm\.(eyebrow|submitLabel|submitNote|successTitle|successMessage)$/.test(path) && !/^bookingForm\.fields\.\d+\.(label|hint)$/.test(path)) return false;
  if (/^calculator\.(species|limitedIncludedHours)/.test(path)) return false;
  return /^(announcement|hero|intro|navigation|philosophy|photographyTypes|plans|faq|booking|bookingForm|bookingCta|closing|calculator)\./.test(path);
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

const imageSource = (image) => typeof image === "string" ? image : image?.src || "";
const previewImageSource = (image) => {
  const source = imageSource(image);
  return document.body.dataset.editorQuery !== "true" && source.startsWith("./assets/") ? `.${source}` : source;
};

const addonImageRecords = (addon) => {
  const images = Array.isArray(addon?.images) && addon.images.length ? addon.images : [addon?.image];
  return images.map((image) => ({
    src: imageSource(image),
    name: typeof image === "object" ? image.name || "" : imageSource(image).split("/").at(-1) || "",
    type: typeof image === "object" ? image.type || "" : "",
    data: typeof image === "object" ? image.data || "" : "",
  })).filter((image) => image.src);
};

export async function prepareEditorContent(content) {
  const clone = structuredClone(content);
  const draft = await getDraft();
  if (document.body.dataset.editor === "true") {
    Object.entries(draft.contentOverrides).forEach(([path, value]) => {
      if (typeof value === "string") setPath(clone, path, value);
    });
  }
  const imageDrafts = document.body.dataset.editor === "true"
    ? Object.entries(draft.addonProductImageDrafts || {})
    : [["strip", draft.addonProductImageDrafts?.strip]];
  imageDrafts.forEach(([id, images]) => {
    const addon = clone.addons?.items?.find((item) => item.id === id);
    if (addon && Array.isArray(images)) {
      const sources = images.map(imageSource).filter(Boolean);
      addon.image = sources[0] || "";
      addon.images = sources;
    }
  });
  return clone;
}

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

const readImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ src: reader.result, data: reader.result, name: file.name, type: file.type });
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const fileExtension = (image) => {
  const fromName = image.name?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (fromName && /^(?:jpe?g|png|webp|gif|avif)$/.test(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" })[image.type] || "webp";
};

export async function initEditor(content) {
  if (document.body.dataset.editor !== "true") return;
  const inspector = document.querySelector("#editor-inspector");
  const preview = document.querySelector(".editor-preview");
  if (!inspector || !preview) return;
  const draft = await getDraft();
  const bookingAddons = (content.addons?.items || []).filter((item) => item.stage === "booking");
  const addonImageChannel = "BroadcastChannel" in window ? new BroadcastChannel(ADDON_IMAGE_CHANNEL) : null;
  let selected = null;
  let pendingUpload = null;
  let draggedImage = null;
  inspector.innerHTML = `
    <div class="editor-header">
      <div><span>MOKOMOKO</span><h1>網站編輯模式</h1></div>
      <a href="${document.body.dataset.editorQuery === "true" ? "./" : "../"}" class="editor-exit">查看正式網站</a>
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
    <section class="inspector-panel addon-image-manager">
      <h2>預約階段加購｜商品圖片</h2>
      <p class="editor-panel-note">第一張會自動作為列表縮圖；拖曳圖片可調整正式頁面的預覽順序。</p>
      <div id="editor-addon-images"></div>
      <input id="editor-addon-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden>
    </section>
    <section class="inspector-panel">
      <h2>全站樣式</h2>
      <label class="editor-field">Section 間距 <output id="section-spacing-output"></output><input id="section-spacing" type="range" min="64" max="144" step="4"></label>
      <label class="editor-field">卡片圓角 <output id="card-radius-output"></output><input id="card-radius" type="range" min="0" max="32" step="2"></label>
      <label class="editor-field">卡片內距 <output id="card-padding-output"></output><input id="card-padding" type="range" min="16" max="40" step="2"></label>
      <label class="editor-field">內容寬度 <output id="content-width-output"></output><input id="content-width" type="range" min="880" max="1280" step="20"></label>
    </section>
    <div class="editor-actions"><button id="editor-export" type="button">Export Changes</button><button id="editor-reset" class="editor-danger" type="button">Reset Draft</button></div>
    <p id="editor-status" class="editor-status" aria-live="polite">草稿只保存在這個瀏覽器；新增圖片會包含在匯出檔中。</p>`;

  const controls = {
    selection: inspector.querySelector("#editor-selection"), text: inspector.querySelector("#editor-text"),
    size: inspector.querySelector("#editor-font-size"), weight: inspector.querySelector("#editor-font-weight"),
    align: inspector.querySelector(".editor-align"), status: inspector.querySelector("#editor-status"),
    addonImages: inspector.querySelector("#editor-addon-images"), addonFile: inspector.querySelector("#editor-addon-file"),
  };

  const save = async (message = "草稿已自動保存。") => {
    try {
      controls.status.textContent = "草稿保存中…";
      await writeAddonImageDrafts(draft.addonProductImageDrafts || {});
      const { addonProductImageDrafts, ...serializableDraft } = draft;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableDraft));
      controls.status.textContent = message;
    } catch {
      controls.status.textContent = "商品圖片草稿保存失敗，請先匯出變更。";
    }
  };
  const currentAddonImages = (id) => Array.isArray(draft.addonProductImageDrafts[id])
    ? draft.addonProductImageDrafts[id]
    : addonImageRecords(bookingAddons.find((addon) => addon.id === id));
  const ensureAddonDraft = (id) => {
    if (!Array.isArray(draft.addonProductImageDrafts[id])) draft.addonProductImageDrafts[id] = structuredClone(currentAddonImages(id));
    return draft.addonProductImageDrafts[id];
  };
  const syncAddonImages = async (id, message) => {
    const images = currentAddonImages(id).map(imageSource).filter(Boolean);
    document.dispatchEvent(new CustomEvent("mokomoko:addon-images-change", { detail: { id, images } }));
    if (id === "strip") addonImageChannel?.postMessage({ id, images });
    await save(message);
  };
  const renderAddonImages = () => {
    controls.addonImages.innerHTML = bookingAddons.map((addon) => {
      const images = currentAddonImages(addon.id);
      return `<article class="editor-addon" data-addon-id="${escapeHtml(addon.id)}">
        <div class="editor-addon-heading"><strong>${escapeHtml(addon.calculatorName || addon.name)}</strong><span>${images.length} 張</span></div>
        <div class="editor-addon-toolbar"><button type="button" data-image-action="replace">替換主縮圖</button><button type="button" data-image-action="add">新增圖片</button></div>
        <div class="editor-addon-image-list">${images.length ? images.map((image, index) => `<div class="editor-addon-image" draggable="true" data-image-index="${index}">
          <button type="button" class="editor-addon-preview" data-image-action="preview" aria-label="預覽第 ${index + 1} 張圖片"><img src="${escapeHtml(previewImageSource(image))}" alt=""></button>
          <span>${index === 0 ? "主縮圖" : `第 ${index + 1} 張`}<small>${escapeHtml(image.name || "商品圖片")}</small></span>
          <button type="button" class="editor-addon-delete" data-image-action="delete" aria-label="刪除第 ${index + 1} 張圖片">刪除</button>
        </div>`).join("") : '<p class="editor-addon-empty">尚未設定商品圖片</p>'}</div>
      </article>`;
    }).join("");
  };

  controls.addonImages.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-image-action]");
    const addonElement = event.target.closest("[data-addon-id]");
    if (!actionButton || !addonElement) return;
    const id = addonElement.dataset.addonId;
    const action = actionButton.dataset.imageAction;
    const index = Number(event.target.closest("[data-image-index]")?.dataset.imageIndex || 0);
    if (action === "replace" || action === "add") {
      pendingUpload = { id, action };
      controls.addonFile.multiple = action === "add";
      controls.addonFile.value = "";
      controls.addonFile.click();
    } else if (action === "delete") {
      ensureAddonDraft(id).splice(index, 1);
      await syncAddonImages(id, "商品圖片已刪除並保存草稿。");
      renderAddonImages();
    } else if (action === "preview") {
      const addon = bookingAddons.find((item) => item.id === id);
      const images = currentAddonImages(id).map(previewImageSource).filter(Boolean);
      window.dispatchEvent(new CustomEvent("mokomoko:open-image", { detail: { images, index, alt: `${addon?.calculatorName || addon?.name || "商品"}商品預覽`, trigger: actionButton } }));
    }
  });
  controls.addonFile.addEventListener("change", async () => {
    if (!pendingUpload || !controls.addonFile.files?.length) return;
    const uploaded = await Promise.all([...controls.addonFile.files].map(readImage));
    const images = ensureAddonDraft(pendingUpload.id);
    if (pendingUpload.action === "replace") images.splice(0, images.length ? 1 : 0, uploaded[0]);
    else images.push(...uploaded);
    await syncAddonImages(pendingUpload.id, "商品圖片已加入草稿；匯出時會包含可部署圖片資料。");
    pendingUpload = null;
    renderAddonImages();
  });
  controls.addonImages.addEventListener("dragstart", (event) => {
    const image = event.target.closest("[data-image-index]");
    const addon = event.target.closest("[data-addon-id]");
    if (image && addon) {
      draggedImage = { id: addon.dataset.addonId, index: Number(image.dataset.imageIndex) };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `${draggedImage.id}:${draggedImage.index}`);
      image.classList.add("is-dragging");
    }
  });
  controls.addonImages.addEventListener("dragover", (event) => {
    if (event.target.closest("[data-image-index]")) event.preventDefault();
  });
  controls.addonImages.addEventListener("drop", async (event) => {
    const target = event.target.closest("[data-image-index]");
    const addon = event.target.closest("[data-addon-id]");
    if (!target || !addon || !draggedImage || addon.dataset.addonId !== draggedImage.id) return;
    event.preventDefault();
    const targetIndex = Number(target.dataset.imageIndex);
    const images = ensureAddonDraft(draggedImage.id);
    const [moved] = images.splice(draggedImage.index, 1);
    images.splice(targetIndex, 0, moved);
    await syncAddonImages(draggedImage.id, "商品圖片順序已保存；第一張已設為主縮圖。");
    draggedImage = null;
    renderAddonImages();
  });
  controls.addonImages.addEventListener("dragend", (event) => {
    event.target.closest("[data-image-index]")?.classList.remove("is-dragging");
    draggedImage = null;
  });

  const applyElementStyle = (element, style = {}) => {
    element.style.fontSize = style.fontSize || "";
    element.style.fontWeight = style.fontWeight || "";
    element.style.textAlign = style.textAlign || "";
  };
  const applyStoredStyles = () => document.querySelectorAll("[data-edit-path]").forEach((element) => applyElementStyle(element, draft.elementStyles[element.dataset.editPath]));
  const tokenDefinitions = {
    "section-spacing": { property: "--space-section", fallback: 104, unit: "px" },
    "card-radius": { property: "--radius-card", fallback: 16, unit: "px" },
    "card-padding": { property: "--space-card", fallback: 26, unit: "px" },
    "content-width": { property: "--content-max", fallback: 1060, unit: "px" },
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
  preview.addEventListener("click", (event) => {
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
    document.dispatchEvent(new CustomEvent("mokomoko:content-change", { detail: { path, value: controls.text.value } }));
    save();
  });
  const updateSelectedStyle = () => {
    if (!selected) return;
    const path = selected.dataset.editPath;
    const checkedAlign = inspector.querySelector('input[name="editor-align"]:checked');
    draft.elementStyles[path] = { fontSize: controls.size.value, fontWeight: controls.weight.value, textAlign: checkedAlign?.value || "" };
    document.querySelectorAll(`[data-edit-path="${CSS.escape(path)}"]`).forEach((element) => applyElementStyle(element, draft.elementStyles[path]));
    save();
  };
  controls.size.addEventListener("change", updateSelectedStyle);
  controls.weight.addEventListener("change", updateSelectedStyle);
  controls.align.addEventListener("change", updateSelectedStyle);

  inspector.querySelector("#editor-export").addEventListener("click", () => {
    const addonProductImages = {};
    const addonProductImageFiles = [];
    bookingAddons.forEach((addon) => {
      const paths = currentAddonImages(addon.id).map((image, index) => {
        if (!image.data) return image.src;
        const name = `addon-${addon.id}-${String(index + 1).padStart(2, "0")}.${fileExtension(image)}`;
        addonProductImageFiles.push({ name, path: `./assets/${name}`, type: image.type, data: image.data });
        return `./assets/${name}`;
      });
      addonProductImages[addon.id] = { image: paths[0] || "", images: paths };
    });
    const { addonProductImageDrafts, ...serializableDraft } = draft;
    const payload = { ...serializableDraft, addonProductImages, addonProductImageFiles };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mokomoko-site-changes.json";
    link.click();
    URL.revokeObjectURL(url);
    controls.status.textContent = `變更已匯出，包含 ${addonProductImageFiles.length} 個待部署圖片檔。`;
  });
  inspector.querySelector("#editor-reset").addEventListener("click", async () => {
    localStorage.removeItem(STORAGE_KEY);
    await clearAddonImageDrafts();
    location.reload();
  });
  renderAddonImages();
  applyStoredStyles();
  window.addEventListener("pagehide", () => addonImageChannel?.close(), { once: true });
  window.__MOKOMOKO_EDITOR__ = { storageKey: STORAGE_KEY, getDraft, editablePath, renderAddonImages };
}
