import { createPricingEngine } from "./pricing-engine.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[character]);

const editable = (path) => `data-edit-path="${escapeHtml(path)}"`;

export function initCalculator(root, content) {
  if (!root || !content.integrations.calculator.enabled) return;

  const engine = createPricingEngine(content);
  const plans = Object.values(engine.plans).sort((a, b) => a.sortOrder - b.sortOrder);
  const state = {
    plan: null,
    species: null,
    count: 1,
    environment: null,
    products: Object.fromEntries(engine.bookingAddons.map((addon) => [addon.id, 0])),
  };
  let carouselInteracted = false;

  root.innerHTML = `
    <div class="pricing-flow">
      <section class="pricing-step pricing-plan-step" aria-labelledby="plan-step-title">
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">01</span><h3 id="plan-step-title">選擇拍攝方案</h3></div>
          <p>方案本身就是價目表，點選後會顯示適用的拍攝對象與費用條件。</p>
        </div>
        <div class="plan-group">
          <p class="plan-group-title" ${editable("calculator.regularHeading")}>${escapeHtml(content.calculator.regularHeading)}</p>
          <div id="regularPlans" class="plan-card-track" role="radiogroup" aria-label="常態拍攝方案"></div>
        </div>
        <div class="plan-group">
          <p class="plan-group-title" ${editable("calculator.limitedHeading")}>${escapeHtml(content.calculator.limitedHeading)}</p>
          <div class="plan-group-meta">${content.calculator.limitedDates.map((line, index) => `<p ${editable(`calculator.limitedDates.${index}`)}>${escapeHtml(line)}</p>`).join("")}</div>
          <div id="limitedPlans" class="plan-card-track" role="radiogroup" aria-label="期間限定拍攝方案"></div>
        </div>
      </section>

      <section id="petStep" class="pricing-step" aria-labelledby="pet-step-title" hidden>
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">02</span><h3 id="pet-step-title">拍攝對象</h3></div>
          <p>只顯示目前方案適用的毛孩類型。</p>
        </div>
        <div id="speciesChoices" class="species-controls" role="radiogroup" aria-label="拍攝對象"></div>
      </section>

      <section id="conditionStep" class="pricing-step" aria-labelledby="condition-step-title" hidden>
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">03</span><h3 id="condition-step-title">數量與拍攝條件</h3></div>
          <p>依毛孩數量與拍攝環境計算適用費用。</p>
        </div>
        <div id="animalCounters"></div>
        <div id="environmentBlock" class="condition-block">
          <h4>拍攝環境</h4>
          <div id="environmentChoices" class="environment-controls" role="radiogroup" aria-label="拍攝環境"></div>
          <p id="environmentNote" class="module-note" aria-live="polite"></p>
        </div>
        <details class="pricing-rules">
          <summary>查看棚拍與時數計算說明</summary>
          <ul>${content.calculator.rules.map((rule, index) => `<li ${editable(`calculator.rules.${index}`)}>${escapeHtml(rule)}</li>`).join("")}</ul>
        </details>
      </section>

      <section id="addonStep" class="pricing-step" aria-labelledby="addon-step-title" hidden>
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">04</span><h3 id="addon-step-title">預約階段加購</h3></div>
          <p>只有會影響本次預估費用的商品會列在這裡。</p>
        </div>
        <div id="productCounters"></div>
      </section>

      <aside id="summaryStep" class="pricing-summary pricing-step" aria-labelledby="summary-title" hidden>
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">05</span><h3 id="summary-title">費用明細</h3></div>
          <p id="completionNotice" aria-live="polite"></p>
        </div>
        <div id="breakdown" class="pricing-breakdown" aria-live="polite"></div>
        <div class="pricing-total"><span>預估總額</span><strong id="totalAmount" aria-live="polite">NT$0</strong></div>
        <p class="module-note">此為線上費用試算，最終拍攝安排與金額將由 MOKOMOKO 確認。</p>
        <a id="reserveButton" class="primary-button is-disabled" href="#booking" aria-disabled="true">${escapeHtml(content.calculator.reserveLabel)}</a>
      </aside>
    </div>`;

  const planFeatures = (plan) => plan.packageItems || plan.items || [];
  const displayPlanFeatures = (plan) => [
    ...(plan.group === "limited" ? [`已含基本場租 ${content.calculator.limitedIncludedHours} 小時`] : []),
    ...planFeatures(plan).map((item) => item.replace(/^[①②③④⑤]\s*/, "")),
  ];
  const planCard = (plan) => {
    const planIndex = content.plans.findIndex((item) => item.id === plan.id);
    const path = `plans.${planIndex}`;
    const featureKey = plan.packageItems ? "packageItems" : "items";
    const hasImage = Boolean(plan.image?.path);
    const features = planFeatures(plan);
    return `<button type="button" class="plan-selector${hasImage ? " has-plan-pet" : ""}" data-plan="${escapeHtml(plan.id)}" role="radio" aria-checked="false">
      <span class="plan-pet-slot${hasImage ? "" : " is-empty"}"${hasImage ? "" : ' aria-hidden="true"'}>${hasImage ? `<img class="plan-pet-image" src="${escapeHtml(plan.image.path)}" alt="${escapeHtml(plan.image.alt || "")}">` : ""}</span>
      <span class="plan-card-top">
        ${plan.badge ? `<span class="plan-badge" ${editable(`${path}.badge`)}>${escapeHtml(plan.badge)}</span>` : ""}
        <span class="plan-name" ${editable(`${path}.name`)}>${escapeHtml(plan.name)}</span>
      </span>
      <span class="plan-price">${engine.formatMoney(plan.price)}</span>
      <span class="plan-features">${plan.group === "limited" ? `<span><i aria-hidden="true">✓</i> <span>已含基本場租 ${escapeHtml(content.calculator.limitedIncludedHours)} 小時</span></span>` : ""}${features.map((item, index) => `<span><i aria-hidden="true">✓</i> <span ${editable(`${path}.${featureKey}.${index}`)}>${escapeHtml(item.replace(/^[①②③④⑤]\s*/, ""))}</span></span>`).join("")}</span>
      <span class="plan-estimate-button" aria-hidden="true">選擇並估價</span>
    </button>`;
  };

  root.querySelector("#regularPlans").innerHTML = plans.filter((plan) => plan.group === "regular").map(planCard).join("");
  root.querySelector("#limitedPlans").innerHTML = plans.filter((plan) => plan.group === "limited").map(planCard).join("");
  root.querySelectorAll(".plan-card-track").forEach((track) => {
    track.classList.toggle("has-plan-pets", Boolean(track.querySelector(".plan-pet-image")));
  });
  root.querySelector("#speciesChoices").innerHTML = Object.entries(engine.species).map(([key, info]) => `
    <button type="button" class="text-control" data-species="${key}" role="radio" aria-checked="false">${escapeHtml(info.label)}</button>`).join("");

  const centerInitialPlan = () => {
    if (!window.matchMedia("(max-width: 767px)").matches || carouselInteracted || state.plan) return;
    const card = root.querySelector('[data-plan="cp"]');
    const track = card?.closest(".plan-card-track");
    if (!card || !track) return;
    const cardRect = card.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    track.scrollLeft += (cardRect.left + (cardRect.width / 2)) - (trackRect.left + (trackRect.width / 2));
  };

  const scheduleInitialCenter = () => requestAnimationFrame(() => requestAnimationFrame(centerInitialPlan));
  root.querySelectorAll(".plan-card-track").forEach((track) => {
    track.addEventListener("pointerdown", () => { carouselInteracted = true; }, { passive: true });
    track.addEventListener("touchstart", () => { carouselInteracted = true; }, { passive: true });
  });

  const currentPlan = () => engine.getPlan(state.plan);

  const selectPlan = (planId) => {
    const plan = engine.getPlan(planId);
    if (!plan) return;
    state.plan = planId;
    if (planId === "guinea") {
      state.species = "guinea";
      state.count = 1;
      state.environment = "indoor";
    } else if (!plan.applicablePetTypes.includes(state.species)) {
      state.species = null;
      state.count = 1;
      state.environment = null;
    } else if (plan.group === "limited") {
      state.environment = "indoor";
    } else {
      state.environment = state.species === "dog" ? "outdoor" : null;
    }
    render();
  };

  const selectSpecies = (speciesId) => {
    const plan = currentPlan();
    if (!plan?.applicablePetTypes.includes(speciesId)) return;
    state.species = speciesId;
    state.count = 1;
    state.environment = plan.group === "limited" ? "indoor" : speciesId === "dog" ? "outdoor" : null;
    render();
  };

  const changePetCount = (delta) => {
    if (!state.species) return;
    state.count = Math.max(1, Math.min(engine.species[state.species].max, state.count + delta));
    render();
  };

  const changeProductCount = (productId, delta) => {
    state.products[productId] = Math.max(0, state.products[productId] + delta);
    render();
  };

  const renderConditions = () => {
    const info = engine.species[state.species];
    root.querySelector("#animalCounters").innerHTML = `<div class="counter-row">
      <div><strong>${escapeHtml(info.label)}數量</strong><p>最少 1 隻，最多 ${info.max} 隻</p></div>
      <div class="counter-control"><button type="button" data-count-delta="-1" aria-label="減少${escapeHtml(info.label)}數量" ${state.count <= 1 ? "disabled" : ""}>−</button><span aria-live="polite">${state.count}</span><button type="button" data-count-delta="1" aria-label="增加${escapeHtml(info.label)}數量" ${state.count >= info.max ? "disabled" : ""}>＋</button></div>
    </div>`;
    const holder = root.querySelector("#environmentChoices");
    const note = root.querySelector("#environmentNote");
    const plan = currentPlan();
    if (plan.group === "limited") {
      holder.innerHTML = '<div class="condition-value"><strong>室內棚拍</strong><span>此活動方案已包含 1 小時基本棚租。</span></div>';
      note.textContent = "超出已含時數時，會依原計價規則加收棚拍費。";
      return;
    }
    if (state.species === "dog") {
      holder.innerHTML = '<div class="condition-value"><strong>戶外拍攝</strong><span>狗狗常態方案不加攝影棚費。</span></div>';
      note.textContent = "";
      return;
    }
    holder.innerHTML = ["outdoor", "indoor"].map((environment) => {
      const selected = state.environment === environment;
      return `<button type="button" class="text-control ${selected ? "is-selected" : ""}" data-environment="${environment}" role="radio" aria-checked="${selected}">${environment === "outdoor" ? "戶外拍攝" : "室內棚拍"}</button>`;
    }).join("");
    note.textContent = state.environment === "indoor" ? "棚拍費將依預估拍攝時數計入明細。" : state.environment === "outdoor" ? "戶外拍攝不加攝影棚費。" : "請選擇拍攝環境。";
  };

  const renderProducts = () => {
    root.querySelector("#productCounters").innerHTML = engine.bookingAddons.map((addon) => {
      const quantity = state.products[addon.id];
      return `<div class="counter-row">
        <div><strong>${escapeHtml(addon.calculatorName || addon.name)}</strong><p>每份 ${engine.formatMoney(addon.price)}，0 表示不加購</p></div>
        <div class="counter-control"><button type="button" data-product="${addon.id}" data-product-delta="-1" aria-label="減少${escapeHtml(addon.name)}" ${quantity <= 0 ? "disabled" : ""}>−</button><span aria-live="polite">${quantity}</span><button type="button" data-product="${addon.id}" data-product-delta="1" aria-label="增加${escapeHtml(addon.name)}">＋</button></div>
      </div>`;
    }).join("");
  };

  const renderSummary = () => {
    const result = engine.calculate(state);
    const plan = currentPlan();
    const displayLines = result.lines.map((line) => line.id === "plan" && plan
      ? { ...line, label: plan.name, detail: displayPlanFeatures(plan).join("・") }
      : line);
    root.querySelector("#breakdown").innerHTML = displayLines.map((line) => `
      <div class="breakdown-row">
        <span><strong>${escapeHtml(line.label)}</strong>${line.detail ? `<small>${escapeHtml(line.detail)}</small>` : ""}</span>
        <b>${line.kind === "included" ? "已包含" : `${line.kind === "base" ? "" : "+"}${engine.formatMoney(line.amount)}`}</b>
      </div>`).join("");
    root.querySelector("#totalAmount").textContent = engine.formatMoney(result.total);
    root.querySelector("#completionNotice").textContent = result.complete ? "試算已完成，可前往填寫預約資料。" : "完成必要選項後即可前往預約。";
    const reserve = root.querySelector("#reserveButton");
    reserve.classList.toggle("is-disabled", !result.complete);
    reserve.setAttribute("aria-disabled", String(!result.complete));
  };

  const render = () => {
    const plan = currentPlan();
    root.querySelectorAll("[data-plan]").forEach((button) => {
      const selected = button.dataset.plan === state.plan;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
    root.querySelectorAll("[data-species]").forEach((button) => {
      const allowed = Boolean(plan?.applicablePetTypes.includes(button.dataset.species));
      const selected = button.dataset.species === state.species;
      button.hidden = !allowed;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
    root.querySelector("#petStep").hidden = !plan;
    root.querySelector("#conditionStep").hidden = !state.species;
    root.querySelector("#addonStep").hidden = !state.species;
    root.querySelector("#summaryStep").hidden = !plan;
    if (state.species) {
      renderConditions();
      renderProducts();
    }
    if (plan) renderSummary();
  };

  root.addEventListener("click", (event) => {
    const planButton = event.target.closest("[data-plan]");
    if (planButton) {
      selectPlan(planButton.dataset.plan);
      return;
    }
    const speciesButton = event.target.closest("[data-species]");
    if (speciesButton) return selectSpecies(speciesButton.dataset.species);
    const countButton = event.target.closest("[data-count-delta]");
    if (countButton) return changePetCount(Number(countButton.dataset.countDelta));
    const environmentButton = event.target.closest("[data-environment]");
    if (environmentButton) {
      state.environment = environmentButton.dataset.environment;
      render();
      return;
    }
    const productButton = event.target.closest("[data-product]");
    if (productButton) changeProductCount(productButton.dataset.product, Number(productButton.dataset.productDelta));
  });

  root.querySelector("#reserveButton").addEventListener("click", (event) => {
    if (event.currentTarget.getAttribute("aria-disabled") === "true") event.preventDefault();
  });

  document.addEventListener("mokomoko:content-change", (event) => {
    const { path, value } = event.detail || {};
    const match = typeof path === "string" ? path.match(/^plans\.(\d+)\.(name|badge|packageSummary|(?:packageItems|items)\.\d+)$/) : null;
    if (!match || typeof value !== "string") return;
    const parts = path.split(".");
    let cursor = content;
    for (let index = 0; index < parts.length - 1; index += 1) cursor = cursor?.[parts[index]];
    if (!cursor || typeof cursor[parts.at(-1)] !== "string") return;
    cursor[parts.at(-1)] = value;
    if (state.plan) renderSummary();
  });

  render();
  scheduleInitialCenter();
  document.fonts?.ready.then(scheduleInitialCenter);
  window.addEventListener("resize", scheduleInitialCenter, { passive: true });
  window.__MOKOMOKO_CALCULATOR__ = { state, engine, selectPlan, selectSpecies, changePetCount, changeProductCount };
}
