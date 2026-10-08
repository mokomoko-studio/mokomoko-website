import { createPricingEngine } from "./pricing-engine.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[character]);

const safeImageUrl = (value = "", allowDraft = false) => {
  if ((document.body.dataset.editor === "true" || allowDraft) && /^(?:blob:|data:image\/)/.test(value)) return escapeHtml(value);
  if (/^\.\/assets\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(value)) {
    const resolved = document.body.dataset.editor === "true" && document.body.dataset.editorQuery !== "true" ? `.${value}` : value;
    return escapeHtml(resolved);
  }
  return "";
};

const editable = (path) => `data-edit-path="${escapeHtml(path)}"`;
let christmasCountdownTimer = 0;

export function initCalculator(root, content) {
  if (!root || !content.integrations.calculator.enabled) return;

  window.clearInterval(christmasCountdownTimer);
  christmasCountdownTimer = 0;

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
  const addonImageChannel = "BroadcastChannel" in window ? new BroadcastChannel("mokomoko-addon-image-preview-v1") : null;

  root.innerHTML = `
    <div class="pricing-flow">
      <section class="pricing-step pricing-plan-step" aria-labelledby="plan-step-title">
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">01</span><h3 id="plan-step-title">選擇拍攝方案</h3></div>
          <p ${editable("calculator.planHelper")}>${escapeHtml(content.calculator.planHelper)}</p>
        </div>
        <div class="plan-group limited-plan-group">
          <p class="plan-group-title" ${editable("calculator.limitedHeading")}>${escapeHtml(content.calculator.limitedHeading)}</p>
          <div class="plan-group-meta">${content.calculator.limitedDates.map((line, index) => `<p ${editable(`calculator.limitedDates.${index}`)}>${escapeHtml(line)}</p>`).join("")}</div>
          ${content.calculator.christmasCountdown ? `<div class="christmas-countdown" data-deadline="${escapeHtml(content.calculator.christmasCountdown.deadline)}" data-closed-note="${escapeHtml(content.calculator.christmasCountdown.closedNote)}" aria-label="${escapeHtml(content.calculator.christmasCountdown.label)}">
            <p class="christmas-countdown-label">${escapeHtml(content.calculator.christmasCountdown.label)}</p>
            <div class="christmas-countdown-grid" aria-hidden="true">
              ${[["days", "天"], ["hours", "時"], ["minutes", "分"], ["seconds", "秒"]].map(([unit, label]) => `<span class="christmas-countdown-unit"><strong data-countdown-unit="${unit}">00</strong><small>${label}</small></span>`).join("")}
            </div>
            <p class="christmas-countdown-expired" hidden>預約已截止</p>
            <p class="christmas-countdown-note">${escapeHtml(content.calculator.christmasCountdown.note)}</p>
          </div>` : ""}
          <div class="limited-plan-viewport">
            <div id="limitedPlans" class="plan-card-track" role="radiogroup" aria-label="期間限定拍攝方案"></div>
          </div>
          <div class="plan-pagination" data-pagination-for="limitedPlans" aria-label="期間限定方案分頁"></div>
        </div>
        <div class="plan-group">
          <p class="plan-group-title" ${editable("calculator.regularHeading")}>${escapeHtml(content.calculator.regularHeading)}</p>
          <div id="regularPlans" class="plan-card-track" role="radiogroup" aria-label="常態拍攝方案"></div>
          <div class="plan-pagination" data-pagination-for="regularPlans" aria-label="常態方案分頁"></div>
        </div>
      </section>

      <section id="petStep" class="pricing-step" aria-labelledby="pet-step-title" hidden>
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">02</span><h3 id="pet-step-title">拍攝對象</h3></div>
          <p>只顯示目前方案適用的毛孩類型</p>
        </div>
        <div id="speciesChoices" class="species-controls" role="radiogroup" aria-label="拍攝對象"></div>
      </section>

      <section id="conditionStep" class="pricing-step" aria-labelledby="condition-step-title" hidden>
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">03</span><h3 id="condition-step-title">數量與拍攝條件</h3></div>
          <p ${editable("calculator.conditionHelper")}>${escapeHtml(content.calculator.conditionHelper)}</p>
        </div>
        <div id="animalCounters"></div>
        <div id="environmentBlock" class="condition-block">
          <h4>拍攝環境</h4>
          <div id="environmentChoices" class="environment-controls" role="radiogroup" aria-label="拍攝環境"></div>
          <p id="environmentNote" class="module-note" aria-live="polite"></p>
        </div>
        <details class="pricing-rules">
          <summary><span class="pricing-rules-icon" aria-hidden="true">›</span><span>查看棚拍與時數計算說明</span></summary>
          <ul>${content.calculator.rules.map((rule, index) => `<li ${editable(`calculator.rules.${index}`)}>${escapeHtml(rule)}</li>`).join("")}</ul>
        </details>
      </section>

      <section id="addonStep" class="pricing-step" aria-labelledby="addon-step-title" hidden>
        <div class="step-heading">
          <div class="step-title-row"><span class="step-number">04</span><h3 id="addon-step-title">預約階段加購</h3></div>
          <p>只有會影響本次預估費用的商品會列在這裡</p>
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
        <p class="module-note">此為線上費用試算，最終拍攝安排與金額將由攝影師確認。</p>
        <a id="reserveButton" class="primary-button is-disabled" href="#booking" aria-disabled="true">${escapeHtml(content.calculator.reserveLabel)}</a>
      </aside>
    </div>`;

  const planFeatures = (plan) => plan.packageItems || plan.items || [];
  const limitedStudioLabel = () => `（已含基本場租 ${content.calculator.limitedIncludedHours} 小時）`;
  const displayPlanFeatures = (plan) => [
    ...(plan.group === "limited" ? [limitedStudioLabel()] : []),
    ...planFeatures(plan).map((item) => item.replace(/^[①②③④⑤]\s*/, "")),
  ];
  const planCard = (plan) => {
    const planIndex = content.plans.findIndex((item) => item.id === plan.id);
    const path = `plans.${planIndex}`;
    const featureKey = plan.packageItems ? "packageItems" : "items";
    const hasImage = Boolean(plan.image?.path);
    const features = planFeatures(plan);
    return `<button type="button" class="plan-selector${hasImage ? " has-plan-pet" : ""}" data-plan="${escapeHtml(plan.id)}" role="radio" aria-checked="false">
      ${plan.group === "limited" ? `<span class="plan-christmas-decor" aria-hidden="true">
        <svg class="decor-gift" viewBox="0 0 32 32"><path d="M5 13h22v15H5zM3 9h26v5H3zM16 9v19M10 9c-5-3-3-8 1-6 3 1 5 6 5 6M22 9c5-3 3-8-1-6-3 1-5 6-5 6"/></svg>
        <svg class="decor-candy" viewBox="0 0 32 32"><path d="M22 28 10 8c-4-7 7-11 11-4 3 5-4 9-7 5"/></svg>
        <svg class="decor-snow" viewBox="0 0 32 32"><path d="M16 3v26M5 9l22 14M27 9 5 23M12 5l4 4 4-4M12 27l4-4 4 4"/></svg>
        <svg class="decor-star" viewBox="0 0 32 32"><path d="m16 3 3.5 8.5 9.5.7-7.2 6.2 2.3 9.3-8.1-5-8.1 5 2.3-9.3L3 12.2l9.5-.7z"/></svg>
        <svg class="decor-holly" viewBox="0 0 32 32"><path d="M15 18C7 17 4 11 6 5c6 1 10 5 10 12M17 18c8-1 11-7 9-13-6 1-10 5-10 12"/><circle cx="13" cy="20" r="3"/><circle cx="19" cy="20" r="3"/><circle cx="16" cy="24" r="3"/></svg>
        <svg class="decor-ribbon" viewBox="0 0 32 32"><path d="M16 15C8 7 3 10 6 15c2 3 7 2 10 0Zm0 0c8-8 13-5 10 0-2 3-7 2-10 0Zm0 0-6 13 6-4 6 4z"/></svg>
      </span>` : ""}
      <span class="plan-card-visual">
        <span class="plan-pet-slot${hasImage ? "" : " is-empty"}"${hasImage ? "" : ' aria-hidden="true"'}>${hasImage ? `<img class="plan-pet-image" src="${escapeHtml(plan.image.path)}" alt="${escapeHtml(plan.image.alt || "")}">` : ""}</span>
        <span class="plan-card-top">
          ${plan.badge ? `<span class="plan-badge" ${editable(`${path}.badge`)}>${escapeHtml(plan.badge)}</span>` : ""}
          <span class="plan-name" ${editable(`${path}.name`)}>${escapeHtml(plan.name)}</span>
        </span>
        <span class="plan-price">${engine.formatMoney(plan.price)}</span>
        ${plan.group === "limited" ? `<span class="plan-studio-included">${escapeHtml(limitedStudioLabel())}</span>` : ""}
        <span class="plan-features">${features.map((item, index) => `<span><i aria-hidden="true">✓</i> <span ${editable(`${path}.${featureKey}.${index}`)}>${escapeHtml(item.replace(/^[①②③④⑤]\s*/, ""))}</span></span>`).join("")}</span>
        <span class="plan-estimate-button" aria-hidden="true">選擇並估價</span>
      </span>
    </button>`;
  };

  root.querySelector("#regularPlans").innerHTML = plans.filter((plan) => plan.group === "regular").map(planCard).join("");
  root.querySelector("#limitedPlans").innerHTML = plans.filter((plan) => plan.group === "limited").map(planCard).join("");

  const countdown = root.querySelector(".christmas-countdown");
  if (countdown) {
    const deadline = Date.parse(countdown.dataset.deadline);
    const units = Object.fromEntries([...countdown.querySelectorAll("[data-countdown-unit]")].map((node) => [node.dataset.countdownUnit, node]));
    const grid = countdown.querySelector(".christmas-countdown-grid");
    const expired = countdown.querySelector(".christmas-countdown-expired");
    const note = countdown.querySelector(".christmas-countdown-note");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateCountdown = () => {
      const remaining = Math.max(0, deadline - Date.now());
      if (!Number.isFinite(deadline) || remaining === 0) {
        grid.hidden = true;
        expired.hidden = false;
        note.textContent = countdown.dataset.closedNote;
        window.clearInterval(christmasCountdownTimer);
        christmasCountdownTimer = 0;
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const values = {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      };

      Object.entries(values).forEach(([unit, value]) => {
        const nextValue = String(value).padStart(2, "0");
        if (units[unit].textContent === nextValue) return;
        units[unit].textContent = nextValue;
        if (reducedMotion.matches) return;
        units[unit].classList.add("is-changing");
        requestAnimationFrame(() => units[unit].classList.remove("is-changing"));
      });
    };

    updateCountdown();
    if (christmasCountdownTimer === 0 && Number.isFinite(deadline) && deadline > Date.now()) {
      christmasCountdownTimer = window.setInterval(updateCountdown, 1000);
    }
  }

  root.querySelectorAll(".plan-card-track").forEach((track) => {
    track.classList.toggle("has-plan-pets", Boolean(track.querySelector(".plan-pet-image")));
  });
  root.querySelector("#speciesChoices").innerHTML = Object.entries(engine.species).map(([key, info]) => `
    <button type="button" class="text-control" data-species="${key}" role="radio" aria-checked="false">${escapeHtml(info.label)}</button>`).join("");

  const centerPlanCard = (card, behavior = "smooth") => {
    const track = card?.closest(".plan-card-track");
    if (!card || !track) return;
    const viewport = track.closest(".limited-plan-viewport") || track;
    const cardRect = card.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const target = viewport.scrollLeft + (cardRect.left + (cardRect.width / 2)) - (viewportRect.left + (viewportRect.width / 2));
    viewport.scrollTo({ left: target, behavior });
  };

  const updatePagination = (track) => {
    const cards = [...track.querySelectorAll("[data-plan]")];
    const pagination = root.querySelector(`[data-pagination-for="${track.id}"]`);
    if (!cards.length || !pagination) return;
    const viewport = track.closest(".limited-plan-viewport") || track;
    const viewportRect = viewport.getBoundingClientRect();
    const center = viewportRect.left + (viewportRect.width / 2);
    let activeIndex = 0;
    let nearest = Infinity;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs((rect.left + (rect.width / 2)) - center);
      if (distance < nearest) {
        nearest = distance;
        activeIndex = index;
      }
    });
    pagination.querySelectorAll("button").forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  };

  const setupPlanCarousels = () => {
    root.querySelectorAll(".plan-card-track").forEach((track) => {
      const cards = [...track.querySelectorAll("[data-plan]")];
      const pagination = root.querySelector(`[data-pagination-for="${track.id}"]`);
      const viewport = track.closest(".limited-plan-viewport") || track;
      const usesNativeScroll = track.id === "limitedPlans" || track.id === "regularPlans";
      let drag = null;
      let suppressClickUntil = 0;

      pagination.innerHTML = cards.map((card, index) => `<button type="button" aria-label="查看第 ${index + 1} 個方案" data-carousel-index="${index}"></button>`).join("");
      pagination.addEventListener("click", (event) => {
        const dot = event.target.closest("[data-carousel-index]");
        if (!dot) return;
        centerPlanCard(cards[Number(dot.dataset.carouselIndex)]);
      });
      let frame = 0;
      viewport.addEventListener("scroll", () => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = 0;
          updatePagination(track);
        });
      }, { passive: true });
      updatePagination(track);

      if (usesNativeScroll) {
        let nativeGesture = null;
        let suppressNativeClickUntil = 0;
        track.addEventListener("pointerdown", (event) => {
          nativeGesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
        }, { passive: true });
        track.addEventListener("pointerup", (event) => {
          if (!nativeGesture || event.pointerId !== nativeGesture.pointerId) return;
          const deltaX = event.clientX - nativeGesture.startX;
          const deltaY = event.clientY - nativeGesture.startY;
          nativeGesture = null;
          if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) suppressNativeClickUntil = performance.now() + 350;
        }, { passive: true });
        track.addEventListener("pointercancel", () => { nativeGesture = null; }, { passive: true });
        track.addEventListener("click", (event) => {
          if (performance.now() >= suppressNativeClickUntil) return;
          event.preventDefault();
          event.stopPropagation();
        }, true);
        return;
      }

      const finishDrag = (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const wasHorizontal = drag.axis === "x";
        if (track.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId);
        drag = null;
        if (!wasHorizontal) return;
        suppressClickUntil = performance.now() + 350;
        const trackRect = track.getBoundingClientRect();
        const center = trackRect.left + (trackRect.width / 2);
        const nearest = cards.reduce((closest, card) => {
          const rect = card.getBoundingClientRect();
          const distance = Math.abs((rect.left + (rect.width / 2)) - center);
          return distance < closest.distance ? { card, distance } : closest;
        }, { card: null, distance: Infinity }).card;
        centerPlanCard(nearest, "smooth");
      };

      track.addEventListener("pointerdown", (event) => {
        if (!window.matchMedia("(max-width: 767px)").matches) return;
        drag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startScrollLeft: track.scrollLeft,
          axis: null,
        };
      }, { passive: true });

      track.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.pointerId || drag.axis === "y") return;
        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;
        if (!drag.axis) {
          if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 8) return;
          drag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
          if (drag.axis === "y") return;
          track.setPointerCapture?.(event.pointerId);
        }
        event.preventDefault();
        track.scrollLeft = drag.startScrollLeft - deltaX;
      });

      track.addEventListener("pointerup", finishDrag);
      track.addEventListener("pointercancel", finishDrag);
      track.addEventListener("click", (event) => {
        if (performance.now() >= suppressClickUntil) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    });
  };

  const centerInitialPlan = () => {
    if (!window.matchMedia("(max-width: 767px)").matches || carouselInteracted || state.plan) return;
    const card = root.querySelector('[data-plan="cp"]');
    if (!card) return;
    centerPlanCard(card, "auto");
    updatePagination(card.closest(".plan-card-track"));
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

  const addonImages = (addon) => {
    const values = Array.isArray(addon?.images) && addon.images.length ? addon.images : [addon?.image];
    return [...new Set(values.map((image) => typeof image === "string" ? image : image?.src).map((image) => safeImageUrl(image, addon?.id === "strip")).filter(Boolean))];
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
      note.textContent = "超出已含時數時，會依原計價規則加收棚拍費";
      return;
    }
    if (state.species === "dog") {
      holder.innerHTML = '<div class="condition-value"><strong>戶外拍攝</strong><span>狗狗常態方案不加攝影棚費。</span></div>';
      note.textContent = "";
      return;
    }
    const availableEnvironments = state.species === "exotic" ? ["indoor"] : ["outdoor", "indoor"];
    holder.innerHTML = availableEnvironments.map((environment) => {
      const selected = state.environment === environment;
      return `<button type="button" class="text-control ${selected ? "is-selected" : ""}" data-environment="${environment}" role="radio" aria-checked="${selected}">${environment === "outdoor" ? "戶外拍攝" : "室內棚拍"}</button>`;
    }).join("");
    note.textContent = state.environment === "indoor" ? "棚拍費將依預估拍攝時數計入明細。" : state.environment === "outdoor" ? "戶外拍攝不加攝影棚費。" : "請選擇拍攝環境。";
  };

  const renderProducts = () => {
    root.querySelector("#productCounters").innerHTML = engine.bookingAddons.map((addon) => {
      const quantity = state.products[addon.id];
      const media = content.addons.items.find((item) => item.id === addon.id) || addon;
      const images = addonImages(media);
      const image = images[0] || safeImageUrl(media.image);
      const imageAlt = media.imageAlt || `${addon.calculatorName || addon.name}商品預覽`;
      return `<div class="counter-row">
        ${image ? `<button type="button" class="addon-product-image-button" data-addon-id="${escapeHtml(addon.id)}" aria-label="放大查看${escapeHtml(imageAlt)}"><img src="${image}" alt="${escapeHtml(imageAlt)}" loading="lazy" decoding="async"></button>` : '<span class="addon-product-image-spacer" aria-hidden="true"></span>'}
        <div class="addon-product-copy"><strong>${escapeHtml(addon.calculatorName || addon.name)}</strong><p>每份 ${engine.formatMoney(addon.price)}，0 表示不加購</p></div>
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
    const imageButton = event.target.closest("[data-addon-id]");
    if (imageButton) {
      event.preventDefault();
      event.stopPropagation();
      const addon = content.addons.items.find((item) => item.id === imageButton.dataset.addonId);
      const images = addonImages(addon);
      if (!images.length) return;
      window.dispatchEvent(new CustomEvent("mokomoko:open-image", {
        detail: {
          src: images[0],
          images,
          alt: addon?.imageAlt || `${addon?.calculatorName || addon?.name || "商品"}商品預覽`,
          trigger: imageButton,
        },
      }));
      return;
    }
    const planButton = event.target.closest("[data-plan]");
    if (planButton) {
      selectPlan(planButton.dataset.plan);
      centerPlanCard(planButton);
      window.setTimeout(() => {
        root.querySelector("#petStep")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }, 320);
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

  const applyAddonImages = ({ id, images } = {}) => {
    const addon = content.addons.items.find((item) => item.id === id);
    if (!addon || !Array.isArray(images)) return;
    addon.images = images.filter((image) => typeof image === "string");
    addon.image = addon.images[0] || "";
    if (state.species) renderProducts();
  };

  document.addEventListener("mokomoko:addon-images-change", (event) => applyAddonImages(event.detail));
  if (addonImageChannel) addonImageChannel.onmessage = (event) => {
    if (event.data?.id === "strip") applyAddonImages(event.data);
  };
  window.addEventListener("pagehide", () => addonImageChannel?.close(), { once: true });

  render();
  setupPlanCarousels();
  scheduleInitialCenter();
  document.fonts?.ready.then(scheduleInitialCenter);
  window.addEventListener("resize", scheduleInitialCenter, { passive: true });
  window.__MOKOMOKO_CALCULATOR__ = { state, engine, selectPlan, selectSpecies, changePetCount, changeProductCount };
}
