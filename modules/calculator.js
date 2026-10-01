const money = (amount) => `NT$${amount.toLocaleString("zh-TW")}`;

const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[character]);

export function initCalculator(root, content) {
  if (!root || !content.integrations.calculator.enabled) return;

  const calculator = content.calculator;
  const plans = Object.fromEntries(content.plans.map((plan) => [plan.id, plan]));
  const speciesInfo = calculator.species;
  const products = content.addons.items
    .filter((item) => item.calculator)
    .map((item) => ({ ...item, name: item.calculatorName || item.name }));
  const state = {
    plan: null,
    species: null,
    count: 1,
    environment: null,
    products: Object.fromEntries(products.map((product) => [product.id, 0])),
  };
  const currentPlan = () => state.plan ? plans[state.plan] : null;

  root.innerHTML = `
    <div class="calculator-grid">
      <div class="calculator-steps">
        <section class="calculator-card">
          <h3><span>1</span> 選擇拍攝方案</h3>
          <p class="module-helper">請先選擇一個拍攝方案。</p>
          <p class="calculator-group-heading">${escapeHtml(calculator.limitedHeading)}</p>
          <div id="limitedPlans" class="calculator-choice-list" role="radiogroup" aria-label="期間限定拍攝方案"></div>
          <p class="calculator-group-heading">${escapeHtml(calculator.regularHeading)}</p>
          <div id="regularPlans" class="calculator-choice-list" role="radiogroup" aria-label="常態拍攝方案"></div>
          <p id="planValidation" class="module-error" aria-live="polite"></p>
        </section>

        <section class="calculator-card">
          <h3><span>2</span> 選擇毛孩</h3>
          <p class="module-helper">請選擇毛孩種類，再調整拍攝隻數。</p>
          <div id="speciesChoices" class="calculator-species" role="radiogroup" aria-label="毛孩種類" hidden></div>
          <p id="speciesValidation" class="module-error" aria-live="polite"></p>
          <div id="animalCounters"></div>
        </section>

        <section class="calculator-card">
          <h3><span>3</span> 拍攝環境與棚拍費</h3>
          <ul class="calculator-rules">${calculator.rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul>
          <div id="environmentChoices" class="calculator-choice-list" role="radiogroup" aria-label="拍攝環境"></div>
          <p id="environmentNote" class="module-note" aria-live="polite"></p>
          <p id="environmentValidation" class="module-error" aria-live="polite"></p>
        </section>

        <section class="calculator-card">
          <h3><span>4</span> 實體商品加購</h3>
          <p class="module-helper">數量填寫 0 即表示不加購。</p>
          <div id="productCounters"></div>
        </section>
      </div>

      <aside class="calculator-card calculator-summary" aria-label="費用明細">
        <h3><span>5</span> 費用明細</h3>
        <div id="breakdown" class="calculator-breakdown" aria-live="polite"></div>
        <p id="completionNotice" class="module-note" aria-live="polite"></p>
        <div class="calculator-total"><span>預估總額</span><strong id="totalAmount" aria-live="polite">NT$0</strong></div>
        <p class="module-helper">此為線上費用試算。期間限定方案已包含基本棚租；一般棚拍費與最終拍攝安排，將依實際內容由 MOKOMOKO 確認後為準。</p>
        <a id="reserveButton" class="module-button" href="#booking-form-section">${escapeHtml(calculator.reserveLabel)}</a>
      </aside>
    </div>`;

  const planCard = (plan) => `
    <button type="button" class="calculator-choice plan-card" data-plan="${escapeHtml(plan.id)}" role="radio" aria-checked="false">
      <span class="calculator-radio" aria-hidden="true"></span>
      <span class="calculator-choice-copy">
        <strong>${escapeHtml(plan.name)}</strong>
        ${plan.label ? `<small>${escapeHtml(plan.label)}</small>` : ""}
        <b>${money(plan.price)}</b>
        <span>${escapeHtml(plan.description)}</span>
        ${plan.packageItems ? `<span class="calculator-package">${plan.packageItems.map((item) => `<i>${escapeHtml(item)}</i>`).join("")}</span>` : ""}
        ${plan.packageNote ? `<em>${escapeHtml(plan.packageNote)}</em>` : ""}
        ${plan.packageSummary ? `<u>${escapeHtml(plan.packageSummary)}</u>` : ""}
      </span>
    </button>`;

  const renderStaticChoices = () => {
    const entries = Object.values(plans);
    root.querySelector("#limitedPlans").innerHTML = entries.filter((plan) => plan.type === "limited").map(planCard).join("");
    root.querySelector("#regularPlans").innerHTML = entries.filter((plan) => plan.type === "regular").map(planCard).join("");
    root.querySelector("#speciesChoices").innerHTML = Object.entries(speciesInfo).map(([key, info]) => `
      <button type="button" class="calculator-species-choice" data-species="${key}" role="radio" aria-checked="false">${escapeHtml(info.label)}</button>`).join("");
  };

  const requiresEnvironmentChoice = () => {
    const plan = currentPlan();
    return Boolean(plan && plan.type === "regular" && ["cat", "exotic"].includes(state.species));
  };

  const getStudioHours = () => {
    if (!state.species || !state.count) return 0;
    if (state.species === "cat") return 2;
    if (["exotic", "guinea"].includes(state.species)) {
      if (state.count <= 2) return 1;
      if (state.count === 3) return 1.5;
      return 2;
    }
    if (state.species === "dog") {
      if (state.count === 1) return 1;
      if (state.count === 2) return 1.5;
      return 2;
    }
    return 0;
  };

  const calculate = () => {
    const lines = [];
    let total = 0;
    const plan = currentPlan();
    if (plan) {
      lines.push({ name: plan.name, summary: plan.packageSummary || "", amount: plan.price, base: true });
      total += plan.price;
    }
    if (plan && state.species && state.count > 1) {
      const petFee = (state.count - 1) * calculator.extraPetPrice;
      lines.push({ name: `毛孩加價（第 2–${state.count} 隻）`, amount: petFee });
      total += petFee;
    }
    if (plan && state.species) {
      if (plan.type === "regular" && state.environment === "indoor") {
        const hours = getStudioHours();
        const studioFee = hours * calculator.studioHourlyPrice;
        lines.push({ name: `攝影棚費（預估 ${hours} 小時 × ${money(calculator.studioHourlyPrice)}）`, amount: studioFee });
        total += studioFee;
      }
      if (plan.type === "regular" && state.environment === "outdoor" && state.species !== "dog") {
        lines.push({ name: "攝影棚費（戶外拍攝）", amount: 0 });
      }
      if (plan.type === "limited") {
        const hours = getStudioHours();
        const extraFee = Math.max(0, hours - calculator.limitedIncludedHours) * calculator.studioHourlyPrice;
        lines.push({ name: "期間限定方案已含 1 小時棚租", amount: 0 });
        lines.push({ name: `額外棚拍費（${hours} 小時－已含 1 小時）`, amount: extraFee });
        total += extraFee;
      }
    }
    products.forEach((product) => {
      const quantity = state.products[product.id];
      if (quantity > 0) {
        const amount = product.price * quantity;
        lines.push({ name: `${product.name} × ${quantity}`, amount });
        total += amount;
      }
    });
    return { lines, total };
  };

  const selectPlan = (planKey) => {
    state.plan = planKey;
    const selectedPlan = plans[planKey];
    if (planKey === "guinea") {
      state.species = "guinea";
      state.count = 1;
      state.environment = "indoor";
    } else if (!selectedPlan.allowed.includes(state.species)) {
      state.species = null;
      state.count = 1;
      state.environment = null;
    } else if (selectedPlan.type === "limited") {
      state.environment = "indoor";
    } else if (state.species === "dog") {
      state.environment = "outdoor";
    } else {
      state.environment = null;
    }
    render();
  };

  const selectSpecies = (speciesKey) => {
    const plan = currentPlan();
    if (!plan || !plan.allowed.includes(speciesKey)) return;
    state.species = speciesKey;
    state.count = 1;
    state.environment = plan.type === "limited" ? "indoor" : speciesKey === "dog" ? "outdoor" : null;
    render();
  };

  const changePetCount = (delta) => {
    if (!state.species) return;
    state.count = Math.max(1, Math.min(speciesInfo[state.species].max, state.count + delta));
    render();
  };

  const changeProductCount = (productId, delta) => {
    state.products[productId] = Math.max(0, state.products[productId] + delta);
    render();
  };

  const renderAnimalCounter = () => {
    const holder = root.querySelector("#animalCounters");
    if (!state.species) {
      holder.innerHTML = "";
      return;
    }
    const info = speciesInfo[state.species];
    holder.innerHTML = `<div class="calculator-counter-row"><div><strong>${escapeHtml(info.label)}數量</strong><p>最少 1 隻，最多 ${info.max} 隻</p></div><div class="calculator-counter"><button type="button" data-count-delta="-1" aria-label="減少${escapeHtml(info.label)}數量" ${state.count <= 1 ? "disabled" : ""}>−</button><span>${state.count}</span><button type="button" data-count-delta="1" aria-label="增加${escapeHtml(info.label)}數量" ${state.count >= info.max ? "disabled" : ""}>＋</button></div></div>`;
  };

  const renderEnvironment = () => {
    const holder = root.querySelector("#environmentChoices");
    const note = root.querySelector("#environmentNote");
    const plan = currentPlan();
    if (!plan || !state.species) {
      holder.innerHTML = "";
      note.textContent = "請先完成拍攝方案與毛孩種類選擇。";
      return;
    }
    if (plan.type === "limited") {
      state.environment = "indoor";
      holder.innerHTML = '<div class="calculator-choice is-selected"><strong>室內棚拍</strong><span>期間限定方案已包含基本棚租，僅依方案規則計算特殊數量加價。</span></div>';
      note.textContent = "期間限定方案已包含 1 小時基本棚租；超出時數依一般棚拍費計算。";
      return;
    }
    if (state.species === "dog") {
      state.environment = "outdoor";
      holder.innerHTML = '<div class="calculator-choice is-selected"><strong>戶外拍攝</strong><span>一般狗狗方案維持戶外拍攝，攝影棚費為 NT$0。</span></div>';
      note.textContent = "狗狗戶外拍攝不加攝影棚費。";
      return;
    }
    holder.innerHTML = ["outdoor", "indoor"].map((environment) => {
      const selected = state.environment === environment;
      const title = environment === "outdoor" ? "戶外拍攝" : "室內棚拍";
      const detail = environment === "outdoor" ? "不加攝影棚費。" : "依毛孩數量與預估拍攝時數計算棚拍費。";
      return `<button type="button" data-environment="${environment}" class="calculator-choice ${selected ? "is-selected" : ""}" role="radio" aria-checked="${selected}"><strong>${title}</strong><span>${detail}</span></button>`;
    }).join("");
    note.textContent = state.environment === "indoor" ? "已選擇室內棚拍，費用明細將列出預估時數與棚拍費。" : state.environment === "outdoor" ? "已選擇戶外拍攝，不加攝影棚費。" : "請選擇拍攝環境以完成費用試算。";
  };

  const renderProducts = () => {
    root.querySelector("#productCounters").innerHTML = products.map((product) => {
      const quantity = state.products[product.id];
      return `<div class="calculator-counter-row"><div><strong>${escapeHtml(product.name)}</strong><p>每份 +${money(product.price)}｜填寫 0 即表示不加購</p></div><div class="calculator-counter"><button type="button" data-product="${product.id}" data-product-delta="-1" aria-label="減少${escapeHtml(product.name)}" ${quantity <= 0 ? "disabled" : ""}>−</button><span>${quantity}</span><button type="button" data-product="${product.id}" data-product-delta="1" aria-label="增加${escapeHtml(product.name)}">＋</button></div></div>`;
    }).join("");
  };

  const renderSummary = () => {
    const result = calculate();
    root.querySelector("#breakdown").innerHTML = result.lines.length === 0
      ? "<p>請先選擇拍攝方案，費用會在這裡即時整理。</p>"
      : result.lines.map((line) => `<div><span><b>${escapeHtml(line.name)}</b>${line.summary ? `<small>${escapeHtml(line.summary)}</small>` : ""}</span><strong>${line.base ? money(line.amount) : line.amount === 0 ? "NT$0" : `+${money(line.amount)}`}</strong></div>`).join("");
    root.querySelector("#totalAmount").textContent = money(result.total);
    const complete = Boolean(state.plan && state.species && !(requiresEnvironmentChoice() && !state.environment));
    root.querySelector("#completionNotice").textContent = complete ? "必填欄位已完成，您可查看完整預估費用。" : "完成拍攝方案、毛孩與環境選擇後即可查看完整費用。";
    root.querySelector("#planValidation").textContent = state.plan ? "" : "請選擇一個拍攝方案。";
    root.querySelector("#speciesValidation").textContent = state.plan && !state.species ? "請選擇毛孩種類與數量。" : "";
    root.querySelector("#environmentValidation").textContent = requiresEnvironmentChoice() && !state.environment ? "請選擇拍攝環境。" : "";
  };

  const render = () => {
    const plan = currentPlan();
    root.querySelectorAll(".plan-card").forEach((element) => {
      const selected = element.dataset.plan === state.plan;
      element.classList.toggle("is-selected", selected);
      element.setAttribute("aria-checked", String(selected));
    });
    root.querySelectorAll(".calculator-species-choice").forEach((element) => {
      const allowed = Boolean(plan && plan.allowed.includes(element.dataset.species));
      const selected = element.dataset.species === state.species;
      element.hidden = !allowed;
      element.classList.toggle("is-selected", selected);
      element.setAttribute("aria-checked", String(selected));
    });
    root.querySelector("#speciesChoices").hidden = !plan;
    renderAnimalCounter();
    renderEnvironment();
    renderProducts();
    renderSummary();
  };

  root.addEventListener("click", (event) => {
    const planButton = event.target.closest("[data-plan]");
    if (planButton) return selectPlan(planButton.dataset.plan);
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

  renderStaticChoices();
  render();
  window.__MOKOMOKO_CALCULATOR__ = { state, calculate, selectPlan, selectSpecies, changePetCount, changeProductCount };
}
