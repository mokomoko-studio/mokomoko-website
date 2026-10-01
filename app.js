(() => {
  const CONTENT_URL = "./content/site-content.json";
  const root = document.querySelector("#site-root");

  const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);

  const safeUrl = (value = "") => {
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) || value.startsWith("#") ? escapeHtml(value) : "#";
    } catch {
      return value.startsWith("#") ? escapeHtml(value) : "#";
    }
  };

  const renderLines = (lines, className = "copy-lines") => `
    <div class="${className}">${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;

  const renderImage = (image, className, overlay = "") => image.path
    ? `<div class="${className}"><img src="${safeUrl(image.path)}" alt="${escapeHtml(image.alt)}">${overlay}</div>`
    : `<div class="${className} image-placeholder" role="img" aria-label="${escapeHtml(image.alt)}">${overlay}<small>${escapeHtml(image.placeholder)}</small></div>`;

  const renderHero = ({ hero, social }) => `
    <section class="hero blue-section" aria-labelledby="hero-title">
      <a class="instagram-mark" href="${safeUrl(social.instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="前往 MOKOMOKO Instagram"><span aria-hidden="true">◎</span> ${escapeHtml(social.instagramLabel)}</a>
      <div class="hero-inner">
        <p class="hero-kicker">${escapeHtml(hero.kicker)}</p>
        <h1 id="hero-title">${hero.titleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</h1>
        <p class="hero-tagline">${escapeHtml(hero.tagline)}</p>
        <div class="hero-images" aria-label="首頁攝影作品位置">
          ${renderImage(hero.images.dog, "hero-dog")}
          ${renderImage(hero.images.cat, "hero-cat")}
        </div>
      </div>
      <div class="wave" aria-hidden="true"></div>
    </section>`;

  const renderIntro = ({ intro, navigation }) => `
    <section class="intro blue-section" aria-labelledby="intro-title">
      <div class="content narrow">
        <h2 id="intro-title" class="section-title light">${escapeHtml(intro.title)}</h2>
        <p class="intro-copy">${escapeHtml(intro.subtitle)}</p>
        <nav class="jump-nav" aria-label="頁面內容導覽">${navigation.map((item) => `<a${item.primary ? ' class="primary"' : ""} href="${safeUrl(item.url)}">${escapeHtml(item.label)}</a>`).join("")}</nav>
      </div>
      <div class="wave" aria-hidden="true"></div>
    </section>`;

  const renderPhilosophy = (section) => `
    <section id="philosophy" class="section philosophy off-white" aria-labelledby="philosophy-title">
      <div class="content narrow centered">
        <h2 id="philosophy-title" class="section-title">${escapeHtml(section.title)}</h2>
        <p class="outline-pill">${escapeHtml(section.definition)}</p>
        ${renderLines(section.firstBlock)}
        <div class="divider" aria-hidden="true"></div>
        <p class="outline-pill short">${escapeHtml(section.secondTitle)}</p>
        ${renderLines(section.secondBlock)}
        <div class="divider" aria-hidden="true"></div>
        <p class="outline-pill short">${escapeHtml(section.closing)}</p>
      </div>
    </section>`;

  const renderPlanTypes = (section) => `
    <section id="plans" class="section plan-types light-gray" aria-labelledby="plans-title">
      <div class="content narrow centered">
        <h2 id="plans-title" class="section-title">${escapeHtml(section.title)}</h2>
        ${renderLines(section.intro, "copy-lines section-intro")}
        ${section.items.map((item) => `<article class="plan-type"><h3 class="outline-pill short">${escapeHtml(item.name)}</h3><p class="plan-lead">${escapeHtml(item.lead)}</p>${item.details.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</article>`).join("")}
      </div>
    </section>`;

  const renderPricing = ({ plans, integrations }) => `
    <section class="section pricing blue-section" aria-label="攝影價格方案">
      <div class="content pricing-list">
        ${plans.map((plan) => {
          const overlay = `<span class="ribbon${plan.featured ? " popular" : ""}">${escapeHtml(plan.badge)}</span><strong>${escapeHtml(plan.imageOverlay)}</strong>`;
          return `<article class="price-card${plan.featured ? " featured" : ""}">
            ${renderImage(plan.image, "price-image", overlay)}
            <div class="price-details">
              <p class="price"><span>$</span>${escapeHtml(plan.price)}</p>
              ${plan.originalPrice ? `<p class="original-price">（原價 $${escapeHtml(plan.originalPrice)}）</p>` : ""}
              ${plan.items.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
              ${plan.notes.map((note) => `<p class="note">${escapeHtml(note)}</p>`).join("")}
            </div>
          </article>`;
        }).join("")}
        <div id="${escapeHtml(integrations.calculator.mountId)}" class="future-module" data-content-source="plans,addons" hidden></div>
      </div>
    </section>`;

  const renderAddons = (section) => {
    const columns = [section.items.slice(0, 4), section.items.slice(4)];
    return `<section class="section add-ons light-gray" aria-labelledby="addons-title">
      <div class="content">
        <h2 id="addons-title" class="blue-pill">${escapeHtml(section.title)}</h2>
        <div class="addon-grid">${columns.map((items) => `<dl>${items.map((item) => `<div><dt>【${escapeHtml(item.name)}】</dt><dd>NT$${escapeHtml(item.price)}</dd></div>`).join("")}</dl>`).join("")}</div>
        <div class="addon-images">${section.images.map((image) => renderImage(image, "")).join("")}</div>
      </div>
    </section>`;
  };

  const renderFaq = (section) => `
    <section id="faq" class="section faq off-white" aria-labelledby="faq-title">
      <div class="content narrow centered">
        <h2 id="faq-title" class="section-title">${escapeHtml(section.title)}</h2>
        <div class="copy-lines section-intro"><p>${escapeHtml(section.intro[0])}</p><p>${escapeHtml(section.intro[1])} <a href="${safeUrl(section.contact.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(section.contact.label)}</a> ${escapeHtml(section.intro[2])}</p></div>
        ${section.items.map((item) => `<article class="faq-item">
          <h3>${escapeHtml(item.question)}</h3>
          ${item.answer.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          ${item.subquestion ? `<p class="subquestion">${escapeHtml(item.subquestion)}</p>` : ""}
          ${item.list.length ? `<ul>${item.list.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}
        </article>`).join("")}
      </div>
    </section>`;

  const renderBooking = ({ booking, bookingCta, integrations }) => `
    <section id="booking" class="section booking" aria-labelledby="booking-title">
      <div class="content narrow centered">
        <h2 id="booking-title" class="section-title">${escapeHtml(booking.title)}</h2>
        ${renderLines(booking.intro, "copy-lines section-intro")}
        <p class="outline-pill">${escapeHtml(booking.pill)}</p>
        <ol class="booking-notes">${booking.notes.map((note) => `<li><span>${escapeHtml(note.number)}</span><div>${note.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div></li>`).join("")}</ol>
        <p class="booking-prompt">${escapeHtml(booking.prompt)}</p>
      </div>
    </section>
    <section class="section booking-cta off-white" aria-labelledby="form-title">
      <div class="content narrow centered">
        <h2 id="form-title" class="section-title">${escapeHtml(bookingCta.title)}</h2>
        <p>${escapeHtml(bookingCta.description)}</p>
        <a class="booking-button" href="${safeUrl(bookingCta.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(bookingCta.label)}</a>
        <div id="${escapeHtml(integrations.bookingForm.mountId)}" class="future-module" data-content-source="booking" hidden></div>
      </div>
    </section>`;

  const renderClosing = ({ closing, social }) => `
    <footer class="closing blue-section">
      <div class="content narrow centered">
        <h2 class="section-title light">${escapeHtml(closing.title)}</h2>
        ${renderLines(closing.lines, "copy-lines light-copy")}
        <a class="instagram-icon" href="${safeUrl(social.instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="前往 MOKOMOKO Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg>
        </a>
      </div>
    </footer>`;

  const bindNavigation = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", link.getAttribute("href"));
      });
    });
  };

  const applyMetadata = (meta) => {
    document.title = meta.title;
    document.querySelector('meta[name="description"]').content = meta.description;
    document.querySelector('meta[property="og:title"]').content = meta.ogTitle;
    document.querySelector('meta[property="og:description"]').content = meta.ogDescription;
  };

  const renderSite = (content) => {
    applyMetadata(content.meta);
    root.innerHTML = `<main>
      ${renderHero(content)}
      ${renderIntro(content)}
      ${renderPhilosophy(content.philosophy)}
      ${renderPlanTypes(content.photographyTypes)}
      ${renderPricing(content)}
      ${renderAddons(content.addons)}
      <div id="${escapeHtml(content.integrations.featuredWorks.mountId)}" class="future-module" data-content-source="works.featured" hidden></div>
      <div id="${escapeHtml(content.integrations.recentWorks.mountId)}" class="future-module" data-content-source="works.recent" hidden></div>
      ${renderFaq(content.faq)}
      ${renderBooking(content)}
    </main>${renderClosing(content)}`;
    bindNavigation();
  };

  fetch(CONTENT_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
      return response.json();
    })
    .then(renderSite)
    .catch(() => {
      root.innerHTML = '<main class="section off-white centered"><p>網站內容暫時無法載入，請稍後再試。</p></main>';
    });
})();
