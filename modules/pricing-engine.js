const formatMoney = (amount) => `NT$${Number(amount).toLocaleString("zh-TW")}`;

export function createPricingEngine(content) {
  const plans = Object.fromEntries(
    content.plans
      .filter((plan) => plan.active !== false)
      .map((plan) => [plan.id, plan]),
  );
  const addons = Object.fromEntries(content.addons.items.map((item) => [item.id, item]));
  const bookingAddons = content.addons.items.filter((item) => item.stage === "booking");
  const species = content.calculator.species;

  const getPlan = (planId) => plans[planId] || null;
  const getStudioHours = (speciesId, count) => {
    if (!speciesId || !count) return 0;
    if (speciesId === "cat") return 2;
    if (speciesId === "exotic" || speciesId === "guinea") {
      if (count <= 2) return 1;
      if (count === 3) return 1.5;
      return 2;
    }
    if (speciesId === "dog") {
      if (count === 1) return 1;
      if (count === 2) return 1.5;
      return 2;
    }
    return 0;
  };

  const requiresEnvironmentChoice = (plan, speciesId) => Boolean(
    plan && plan.group === "regular" && (speciesId === "cat" || speciesId === "exotic"),
  );

  const isComplete = (state) => {
    const plan = getPlan(state.plan);
    if (!plan || !state.species || state.count < 1) return false;
    return !(requiresEnvironmentChoice(plan, state.species) && !state.environment);
  };

  const calculate = (state) => {
    const plan = getPlan(state.plan);
    const lines = [];
    let total = 0;
    if (!plan) return { lines, total, complete: false };

    lines.push({ id: "plan", label: plan.name, detail: plan.packageSummary || "", amount: plan.price, kind: "base" });
    total += plan.price;

    if (state.species && state.count > 1) {
      const amount = (state.count - 1) * addons["second-pet"].price;
      lines.push({ id: "pets", label: `毛孩加價（第 2–${state.count} 隻）`, amount, kind: "fee" });
      total += amount;
    }

    if (state.species && plan.group === "regular" && state.environment === "indoor") {
      const hours = getStudioHours(state.species, state.count);
      const amount = hours * addons["studio-hour"].price;
      lines.push({
        id: "studio",
        label: `攝影棚費（預估 ${hours} 小時 × ${formatMoney(addons["studio-hour"].price)}）`,
        amount,
        kind: "fee",
      });
      total += amount;
    }

    if (state.species && plan.group === "limited") {
      const hours = getStudioHours(state.species, state.count);
      const extraHours = Math.max(0, hours - content.calculator.limitedIncludedHours);
      lines.push({ id: "included-studio", label: "基本棚租 1 小時", amount: 0, kind: "included" });
      if (extraHours > 0) {
        const amount = extraHours * addons["studio-hour"].price;
        lines.push({ id: "extra-studio", label: `額外棚拍費（${extraHours} 小時）`, amount, kind: "fee" });
        total += amount;
      }
    }

    bookingAddons.forEach((addon) => {
      const quantity = state.products[addon.id] || 0;
      if (!quantity) return;
      const amount = addon.price * quantity;
      lines.push({ id: addon.id, label: `${addon.calculatorName || addon.name} × ${quantity}`, amount, kind: "addon" });
      total += amount;
    });

    return { lines, total, complete: isComplete(state) };
  };

  return {
    plans,
    species,
    bookingAddons,
    addons,
    formatMoney,
    getPlan,
    getStudioHours,
    requiresEnvironmentChoice,
    isComplete,
    calculate,
  };
}
