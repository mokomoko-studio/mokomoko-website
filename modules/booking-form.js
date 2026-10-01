const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[character]);

const renderRequired = (field) => field.required ? ' <span aria-hidden="true">＊</span>' : "";

const renderField = (field) => {
  const hint = field.hint ? `<p class="booking-hint">${escapeHtml(field.hint)}</p>` : "";
  const error = `<p class="booking-error" id="${field.key}-error" aria-live="polite"></p>`;

  if (field.type === "text" || field.type === "textarea") {
    return `<div class="booking-field" data-field="${field.key}">
      <label class="booking-question" for="${field.key}">${escapeHtml(field.label)}${renderRequired(field)}</label>
      ${hint}${field.type === "textarea" ? `<textarea id="${field.key}" name="${field.name}" rows="4" ${field.required ? "required" : ""}></textarea>` : `<input id="${field.key}" name="${field.name}" type="text" autocomplete="off" ${field.required ? "required" : ""}` + `>`}${error}
    </div>`;
  }

  if (field.type === "select") {
    return `<div class="booking-field" data-field="${field.key}">
      <label class="booking-question" for="${field.key}">${escapeHtml(field.label)}${renderRequired(field)}</label>
      ${hint}<select id="${field.key}" name="${field.name}" ${field.required ? "required" : ""}><option value="">${escapeHtml(field.placeholder)}</option>${field.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}</select>${error}
    </div>`;
  }

  const choiceType = field.type === "checkbox" ? "checkbox" : "radio";
  const options = field.options.map((option) => `<label class="booking-choice"><input type="${choiceType}" name="${field.name}" value="${escapeHtml(option)}"><span>${escapeHtml(option)}</span></label>`).join("");
  const otherId = `${field.key}-other`;
  const other = field.other ? `<label class="booking-choice"><input type="radio" name="${field.name}" value="__other_option__" data-other-target="${otherId}"><span>其他</span></label>${field.other.control === "textarea" ? `<textarea class="booking-other" id="${otherId}" name="${field.other.name}" rows="3" placeholder="${escapeHtml(field.other.placeholder)}" aria-label="${escapeHtml(field.other.placeholder)}" disabled></textarea>` : `<input class="booking-other" id="${otherId}" name="${field.other.name}" type="text" placeholder="${escapeHtml(field.other.placeholder)}" aria-label="${escapeHtml(field.other.placeholder)}" disabled>`}` : "";
  return `<fieldset class="booking-field" data-field="${field.key}">
    <legend class="booking-question">${escapeHtml(field.label)}${renderRequired(field)}</legend>
    ${hint}<div class="booking-choices">${options}${other}</div>${error}
  </fieldset>`;
};

export function initBookingForm(root, content) {
  if (!root || !content.integrations.bookingForm.enabled) return;
  const config = content.bookingForm;

  root.innerHTML = `
    <p class="booking-eyebrow">${escapeHtml(config.eyebrow)}</p>
    <form id="booking-form" class="integrated-booking-form" action="${escapeHtml(config.endpoint)}" method="post" target="google-form-response" novalidate>
      ${config.fields.map(renderField).join("")}
      <input type="hidden" name="fvv" value="1">
      <input type="hidden" name="pageHistory" value="0">
      <button id="submit-button" class="module-button booking-submit" type="submit">${escapeHtml(config.submitLabel)}</button>
      <p class="booking-submit-note">${escapeHtml(config.submitNote)}</p>
    </form>
    <section id="booking-success" class="booking-success" aria-live="polite" hidden>
      <div aria-hidden="true">✓</div>
      <h3>${escapeHtml(config.successTitle)}</h3>
      <p>${escapeHtml(config.successMessage)}</p>
    </section>
    <iframe id="google-form-response" name="google-form-response" title="表單送出結果" hidden></iframe>`;

  const form = root.querySelector("#booking-form");
  const submitButton = root.querySelector("#submit-button");
  const responseFrame = root.querySelector("#google-form-response");
  const successPanel = root.querySelector("#booking-success");
  let submitting = false;

  const rules = config.fields.filter((field) => field.required).map((field) => ({
    ...field,
    selector: ["radio", "checkbox"].includes(field.type) ? `input[name="${field.name}"]:checked` : `#${field.key}`,
    otherSelector: field.other ? `#${field.key}-other` : null,
  }));

  const setFieldError = (key, message = "") => {
    const field = form.querySelector(`[data-field="${key}"]`);
    const error = form.querySelector(`#${key}-error`);
    field?.classList.toggle("has-error", Boolean(message));
    if (error) error.textContent = message;
  };

  const validateField = (rule) => {
    const control = form.querySelector(rule.selector);
    let valid = Boolean(control);
    if (control && control.matches("input[type='text'], textarea, select")) valid = control.value.trim() !== "";
    if (valid && rule.otherSelector && control?.value === "__other_option__") valid = form.querySelector(rule.otherSelector)?.value.trim() !== "";
    setFieldError(rule.key, valid ? "" : rule.error);
    return valid;
  };

  const validateForm = () => {
    const invalid = rules.filter((rule) => !validateField(rule));
    if (!invalid.length) return true;
    const firstField = form.querySelector(`[data-field="${invalid[0].key}"]`);
    firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
    const firstControl = firstField?.querySelector("input:not([disabled]), select, textarea:not([disabled])");
    window.setTimeout(() => firstControl?.focus({ preventScroll: true }), 250);
    return false;
  };

  const syncOtherInput = (radio) => {
    form.querySelectorAll(`input[name="${radio.name}"][data-other-target]`).forEach((otherRadio) => {
      const input = document.getElementById(otherRadio.dataset.otherTarget);
      const active = otherRadio.checked;
      input.disabled = !active;
      input.required = active;
      if (!active) input.value = "";
    });
  };

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
    if (target.type === "radio") syncOtherInput(target);
    const field = target.closest("[data-field]");
    const rule = rules.find((item) => item.key === field?.dataset.field);
    if (rule) validateField(rule);
  });

  form.addEventListener("input", (event) => {
    const field = event.target.closest?.("[data-field]");
    const rule = rules.find((item) => item.key === field?.dataset.field);
    if (rule && field.classList.contains("has-error")) validateField(rule);
  });

  form.addEventListener("submit", (event) => {
    if (submitting || !validateForm()) {
      event.preventDefault();
      return;
    }
    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = config.submittingLabel;
    form.setAttribute("aria-busy", "true");
    window.setTimeout(() => {
      if (!submitting) return;
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = config.submitLabel;
      form.removeAttribute("aria-busy");
      setFieldError(config.fields.at(-1)?.key, "目前無法確認送出結果，請檢查網路後再試一次。");
    }, 15000);
  });

  responseFrame.addEventListener("load", () => {
    if (!submitting) return;
    submitting = false;
    form.hidden = true;
    form.removeAttribute("aria-busy");
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  window.__MOKOMOKO_BOOKING_FORM__ = { validateForm, isSubmitting: () => submitting };
}
