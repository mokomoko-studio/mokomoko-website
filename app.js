import { initCalculator } from "./modules/calculator.js?v=mobile-refinement-2";
import { initBookingForm } from "./modules/booking-form.js?v=mobile-refinement-2";
import { initEditor, prepareEditorContent } from "./modules/editor.js?v=mobile-refinement-2";

(() => {
  const contentUrl = document.body.dataset.contentUrl || "./content/site-content.json";
  const root = document.querySelector("#site-root");

  const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);
  const editAttr = (path) => path ? ` data-edit-path="${escapeHtml(path)}"` : "";

  const safeUrl = (value = "") => {
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) || value.startsWith("#") ? escapeHtml(value) : "#";
    } catch {
      return value.startsWith("#") ? escapeHtml(value) : "#";
    }
  };

  const renderLines = (lines, path, className = "copy-lines") => `
    <div class="${className}">${lines.map((line, index) => `<p${editAttr(`${path}.${index}`)}>${escapeHtml(line)}</p>`).join("")}</div>`;

  const renderImage = (image, className) => image.path
    ? `<div class="${className}"><img src="${safeUrl(image.path)}" alt="${escapeHtml(image.alt)}"></div>`
    : `<div class="${className} image-placeholder" role="img" aria-label="${escapeHtml(image.alt)}"><small>${escapeHtml(image.placeholder)}</small></div>`;

  const renderHeaderLink = (item) => `<a class="header-nav-link" href="${safeUrl(item.url)}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
    <span class="header-nav-english">${escapeHtml(item.english)}</span>
    <span class="header-nav-chinese">${escapeHtml(item.chinese)}</span>
  </a>`;

  const renderBookingCta = (header, className = "") => `<a class="header-booking ${className}" href="${safeUrl(header.ctaUrl)}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="1.5"></rect><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"></path></svg>
    <span>${escapeHtml(header.ctaLabel)}</span>
  </a>`;

  const renderAnnouncement = (announcement) => {
    if (!announcement?.enabled || !announcement.text) return "";
    const message = `<span${editAttr("announcement.text")}>${escapeHtml(announcement.text)}</span>`;
    return `<aside class="announcement-bar" aria-label="最新消息">${announcement.link ? `<a href="${safeUrl(announcement.link)}">${message}</a>` : message}</aside>`;
  };

  const renderHeader = (header, hasAnnouncement = false) => `
    <header class="site-header${hasAnnouncement ? " has-announcement" : ""}">
      <div class="site-header-inner">
        <a class="header-wordmark" href="#site-root" aria-label="回到網站頂部">
          <span>${escapeHtml(header.logo)}</span>
          <small>${escapeHtml(header.subtitle)}</small>
        </a>
        <nav class="header-desktop-nav" aria-label="主要導覽">${header.items.map(renderHeaderLink).join("")}</nav>
        <div class="header-actions">
          <span class="header-doodle" aria-hidden="true"><svg viewBox="0 0 42 40"><path d="M27 3l7 10M38 17l-9 3M24 25l-6 9"></path></svg></span>
          ${renderBookingCta(header)}
          <button class="header-menu-button" type="button" aria-expanded="false" aria-controls="mobile-navigation" aria-label="開啟導覽選單">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <nav id="mobile-navigation" class="header-mobile-nav" aria-label="手機主要導覽" hidden>${header.items.map(renderHeaderLink).join("")}</nav>
    </header>`;

  const renderHero = ({ hero, social }) => `
    <section class="hero blue-section" aria-labelledby="hero-title">
      <a class="instagram-mark" href="${safeUrl(social.instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="前往 MOKOMOKO Instagram"><span aria-hidden="true">◎</span> ${escapeHtml(social.instagramLabel)}</a>
      <div class="hero-inner">
        <p class="hero-kicker"${editAttr("hero.kicker")}>${escapeHtml(hero.kicker)}</p>
        <h1 id="hero-title">${hero.titleLines.map((line, index) => `<span${editAttr(`hero.titleLines.${index}`)}>${escapeHtml(line)}</span>`).join("")}</h1>
        <p class="hero-tagline"${editAttr("hero.tagline")}>${escapeHtml(hero.tagline)}</p>
        <div class="hero-images" aria-label="首頁攝影作品位置">${renderImage(hero.images.dog, "hero-dog")}${renderImage(hero.images.cat, "hero-cat")}</div>
      </div>
      <div class="wave" aria-hidden="true"></div>
    </section>`;

  const renderIntro = ({ intro, navigation }) => `
    <section class="intro blue-section" aria-labelledby="intro-title">
      <div class="content narrow centered">
        <h2 id="intro-title" class="section-title light"${editAttr("intro.title")}>${escapeHtml(intro.title)}</h2>
        <p class="intro-copy"${editAttr("intro.subtitle")}>${escapeHtml(intro.subtitle)}</p>
        <nav class="jump-nav" aria-label="頁面內容導覽">${navigation.map((item, index) => `<a${item.primary ? ' class="primary"' : ""} href="${safeUrl(item.url)}"><span${editAttr(`navigation.${index}.label`)}>${escapeHtml(item.label)}</span></a>`).join("")}</nav>
      </div>
      <div class="wave" aria-hidden="true"></div>
    </section>`;

  const renderPhilosophy = (section) => `
    <section id="philosophy" class="section off-white" aria-labelledby="philosophy-title">
      <div class="content narrow centered">
        <p class="section-kicker">OUR PHILOSOPHY</p>
        <h2 id="philosophy-title" class="section-title"${editAttr("philosophy.title")}>${escapeHtml(section.title)}</h2>
        <p class="outline-pill"${editAttr("philosophy.definition")}>${escapeHtml(section.definition)}</p>
        ${renderLines(section.firstBlock, "philosophy.firstBlock")}
        <div class="divider" aria-hidden="true"></div>
        <h3 class="subsection-title"${editAttr("philosophy.secondTitle")}>${escapeHtml(section.secondTitle)}</h3>
        ${renderLines(section.secondBlock, "philosophy.secondBlock")}
        <p class="closing-line"${editAttr("philosophy.closing")}>${escapeHtml(section.closing)}</p>
      </div>
    </section>`;

  const renderPricingCalculator = ({ calculator, integrations }) => `
    <section id="plans" class="section pricing-section" aria-labelledby="pricing-title">
      <div class="content">
        <div class="section-heading centered">
          <p class="section-kicker">PRICING</p>
          <h2 id="pricing-title" class="section-title"${editAttr("calculator.title")}>${escapeHtml(calculator.title)}</h2>
          <p class="section-description"${editAttr("calculator.subtitle")}>${escapeHtml(calculator.subtitle)}</p>
        </div>
        <div id="${escapeHtml(integrations.calculator.mountId)}" class="calculator-module" data-content-source="plans,addons,calculator"></div>
      </div>
    </section>`;

  const renderFaq = (section) => `
    <section id="faq" class="section off-white" aria-labelledby="faq-title">
      <div class="content narrow">
        <div class="section-heading centered">
          <p class="section-kicker">QUESTIONS</p>
          <h2 id="faq-title" class="section-title"${editAttr("faq.title")}>${escapeHtml(section.title)}</h2>
          <div class="section-description"><span${editAttr("faq.intro.0")}>${escapeHtml(section.intro[0])}</span><br><span${editAttr("faq.intro.1")}>${escapeHtml(section.intro[1])}</span> <a href="${safeUrl(section.contact.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(section.contact.label)}</a> <span${editAttr("faq.intro.2")}>${escapeHtml(section.intro[2])}</span></div>
        </div>
        <div class="faq-list">${section.items.map((item, index) => `<article class="faq-item">
          <h3><button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-answer-${index}"><span${editAttr(`faq.items.${index}.question`)}>${escapeHtml(item.question)}</span><span class="faq-toggle" aria-hidden="true">＋</span></button></h3>
          <div id="faq-answer-${index}" class="faq-answer-shell"><div class="faq-answer">${item.answer.map((line, lineIndex) => `<p${editAttr(`faq.items.${index}.answer.${lineIndex}`)}>${escapeHtml(line)}</p>`).join("")}${item.subquestion ? `<h4${editAttr(`faq.items.${index}.subquestion`)}>${escapeHtml(item.subquestion)}</h4>` : ""}${item.list.length ? `<ul>${item.list.map((line, lineIndex) => `<li${editAttr(`faq.items.${index}.list.${lineIndex}`)}>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}</div></div>
        </article>`).join("")}</div>
      </div>
    </section>`;

  const renderBooking = ({ booking, bookingCta, integrations }) => `
    <section id="booking" class="section booking-section" aria-labelledby="booking-title">
      <div class="content narrow">
        <div class="section-heading centered">
          <p class="section-kicker">BOOKING</p>
          <h2 id="booking-title" class="section-title"${editAttr("booking.title")}>${escapeHtml(booking.title)}</h2>
          ${renderLines(booking.intro, "booking.intro", "copy-lines section-description")}
        </div>
        <p class="outline-pill centered"${editAttr("booking.pill")}>${escapeHtml(booking.pill)}</p>
        <ol class="booking-notes">${booking.notes.map((note, index) => `<li><span>${escapeHtml(note.number)}</span><div>${note.lines.map((line, lineIndex) => `<p${editAttr(`booking.notes.${index}.lines.${lineIndex}`)}>${escapeHtml(line)}</p>`).join("")}</div></li>`).join("")}</ol>
        <p class="booking-prompt centered"${editAttr("booking.prompt")}>${escapeHtml(booking.prompt)}</p>
      </div>
    </section>
    <section id="booking-form-section" class="section booking-form-section" aria-labelledby="form-title">
      <div class="content narrow">
        <div class="section-heading centered">
          <h2 id="form-title" class="section-title"${editAttr("bookingCta.title")}>${escapeHtml(bookingCta.title)}</h2>
          <p class="section-description"${editAttr("bookingCta.description")}>${escapeHtml(bookingCta.description)}</p>
        </div>
        <div id="${escapeHtml(integrations.bookingForm.mountId)}" class="booking-module" data-content-source="bookingForm"></div>
      </div>
    </section>`;

  const renderClosing = ({ closing, social }) => `
    <footer class="closing blue-section">
      <div class="content narrow centered">
        <h2 class="section-title light"${editAttr("closing.title")}>${escapeHtml(closing.title)}</h2>
        ${renderLines(closing.lines, "closing.lines", "copy-lines light-copy")}
        <a class="instagram-icon" href="${safeUrl(social.instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="前往 MOKOMOKO Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg></a>
      </div>
    </footer>`;

  const bindNavigation = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        if (link.getAttribute("aria-disabled") === "true") return;
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", link.getAttribute("href"));
      });
    });
  };

  const bindHeader = () => {
    const header = document.querySelector(".site-header");
    const button = header?.querySelector(".header-menu-button");
    const menu = header?.querySelector(".header-mobile-nav");
    if (!header || !button || !menu) return;

    const closeMenu = (returnFocus = false) => {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "開啟導覽選單");
      if (returnFocus) button.focus();
    };

    button.addEventListener("click", () => {
      const opening = button.getAttribute("aria-expanded") !== "true";
      menu.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));
      button.setAttribute("aria-label", opening ? "關閉導覽選單" : "開啟導覽選單");
      if (opening) menu.querySelector("a")?.focus();
    });
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) closeMenu(true);
    });
  };

  const bindFaq = () => {
    const items = [...document.querySelectorAll(".faq-item")];
    items.forEach((item) => {
      const button = item.querySelector(".faq-question");
      button?.addEventListener("click", () => {
        const opening = button.getAttribute("aria-expanded") !== "true";
        items.forEach((candidate) => {
          candidate.classList.remove("is-open");
          candidate.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
        });
        if (opening) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  };

  const applyMetadata = (meta) => {
    if (document.body.dataset.editor === "true") return;
    document.title = meta.title;
    document.querySelector('meta[name="description"]').content = meta.description;
    document.querySelector('meta[property="og:title"]').content = meta.ogTitle;
    document.querySelector('meta[property="og:description"]').content = meta.ogDescription;
  };

  const renderSite = (sourceContent) => {
    const content = prepareEditorContent(sourceContent);
    applyMetadata(content.meta);
    const hasAnnouncement = Boolean(content.announcement?.enabled && content.announcement.text);
    root.innerHTML = `${renderAnnouncement(content.announcement)}${renderHeader(content.header, hasAnnouncement)}<main>${renderHero(content)}${renderIntro(content)}${renderPhilosophy(content.philosophy)}${renderPricingCalculator(content)}<div id="${escapeHtml(content.integrations.featuredWorks.mountId)}" hidden></div><div id="${escapeHtml(content.integrations.recentWorks.mountId)}" hidden></div>${renderFaq(content.faq)}${renderBooking(content)}</main>${renderClosing(content)}`;
    bindNavigation();
    bindHeader();
    bindFaq();
    initCalculator(document.getElementById(content.integrations.calculator.mountId), content);
    initBookingForm(document.getElementById(content.integrations.bookingForm.mountId), content);
    initEditor();
  };

  fetch(contentUrl, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
      return response.json();
    })
    .then(renderSite)
    .catch(() => {
      root.innerHTML = '<main class="section centered"><p>網站內容暫時無法載入，請稍後再試。</p></main>';
    });
})();
