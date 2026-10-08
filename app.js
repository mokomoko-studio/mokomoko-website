import { initCalculator } from "./modules/calculator.js?v=mobile-swipe-2";
import { initBookingForm } from "./modules/booking-form.js?v=ui-finish-1";
import { initEditor, prepareEditorContent } from "./modules/editor.js?v=addon-image-draft-v2";

(() => {
  const contentUrl = document.body.dataset.contentUrl || "./content/site-content.json";
  const root = document.querySelector("#site-root");

  if (new URLSearchParams(window.location.search).get("edit") === "1" && document.body.dataset.editor !== "true") {
    document.body.dataset.editor = "true";
    document.body.dataset.editorQuery = "true";
    document.body.classList.add("editor-page");
    const editorStyles = document.createElement("link");
    editorStyles.rel = "stylesheet";
    editorStyles.href = "./edit/editor.css";
    document.head.append(editorStyles);
    const shell = document.createElement("div");
    shell.className = "editor-shell";
    const preview = document.createElement("div");
    preview.className = "editor-preview";
    preview.setAttribute("aria-label", "網站預覽");
    const inspector = document.createElement("aside");
    inspector.id = "editor-inspector";
    inspector.className = "editor-inspector";
    inspector.setAttribute("aria-label", "編輯設定");
    root.replaceWith(shell);
    preview.append(root);
    shell.append(preview, inspector);
  }

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

  const safeImageUrl = (value = "") => {
    if (document.body.dataset.editor === "true" && (/^blob:/.test(value) || /^data:image\//.test(value))) return escapeHtml(value);
    if (/^\.\/assets\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(value)) {
      return escapeHtml(document.body.dataset.editor === "true" ? `.${value}` : value);
    }
    return safeUrl(value);
  };

  const galleryItems = (section) => section.gallery?.items || [...(section.gallery?.row1 || []), ...(section.gallery?.row2 || [])];
  const renderPhilosophyGallery = (items = []) => {
    if (!items.length) return "";
    const midpoint = Math.ceil(items.length / 2);
    const rows = [items.slice(0, midpoint), items.slice(midpoint)];
    return `<div class="philosophy-gallery" aria-label="作品照片預覽">
      ${rows.filter((images) => images.length).map((images, rowIndex) => `<div class="philosophy-gallery-row" data-gallery-row="${rowIndex}" data-direction="${rowIndex ? "1" : "-1"}">
        <div class="philosophy-gallery-track">
          ${[false, true].map((duplicate) => `<div class="philosophy-gallery-group"${duplicate ? ' aria-hidden="true"' : ""}>${images.map((image, imageIndex) => {
            const galleryIndex = (rowIndex ? midpoint : 0) + imageIndex;
            return `<button class="philosophy-polaroid" type="button" data-gallery-index="${galleryIndex}" data-gallery-src="${escapeHtml(image.src)}" data-gallery-width="${Number(image.width) || ""}" data-gallery-height="${Number(image.height) || ""}"${duplicate ? ' tabindex="-1" aria-hidden="true"' : ` aria-label="放大查看${escapeHtml(image.alt || `作品照片 ${galleryIndex + 1}`)}"`}><img src="${safeImageUrl(image.src)}" alt="${duplicate ? "" : escapeHtml(image.alt || `作品照片 ${galleryIndex + 1}`)}" ${galleryIndex < 3 ? "" : 'loading="lazy" '}decoding="async" draggable="false"></button>`;
          }).join("")}</div>`).join("")}
        </div>
      </div>`).join("")}
    </div>
    <div class="philosophy-lightbox" role="dialog" aria-modal="true" aria-label="作品照片預覽" hidden>
      <button class="philosophy-lightbox-close" type="button" aria-label="關閉照片預覽">×</button>
      <button class="philosophy-lightbox-nav philosophy-lightbox-prev" type="button" aria-label="上一張照片">‹</button>
      <div class="philosophy-lightbox-content">
        <div class="philosophy-lightbox-frame"><img alt="" draggable="false"></div>
        <div class="product-lightbox-thumbnails" role="list" aria-label="商品圖片列表" hidden></div>
      </div>
      <button class="philosophy-lightbox-nav philosophy-lightbox-next" type="button" aria-label="下一張照片">›</button>
    </div>`;
  };

  const renderLines = (lines, path, className = "copy-lines") => `
    <div class="${className}">${lines.map((line, index) => `<p${editAttr(`${path}.${index}`)}>${escapeHtml(line)}</p>`).join("")}</div>`;

  const renderHighlightedText = (line, highlights = []) => highlights.reduce(
    (html, highlight) => html.replace(escapeHtml(highlight), `<mark class="booking-highlight">${escapeHtml(highlight)}</mark>`),
    escapeHtml(line),
  );

  const renderImage = (image, className) => image.path
    ? `<div class="${className}"><img src="${safeImageUrl(image.path)}" alt="${escapeHtml(image.alt)}"></div>`
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
    const message = `<span class="announcement-instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg><span${editAttr("announcement.text")}>${escapeHtml(announcement.text)}</span></span>`;
    return `<aside class="announcement-bar" aria-label="Instagram">${announcement.link ? `<a href="${safeUrl(announcement.link)}" target="_blank" rel="noopener noreferrer">${message}</a>` : message}</aside>`;
  };

  const renderHeader = (header, hasAnnouncement = false) => `
    <header class="site-header${hasAnnouncement ? " has-announcement" : ""}">
      <div class="site-header-inner">
        <nav class="header-desktop-nav" aria-label="主要導覽">${header.items.map(renderHeaderLink).join("")}</nav>
      </div>
    </header>`;

  const renderHero = ({ hero }) => {
    return `<section class="hero blue-section" aria-labelledby="hero-title">
      <picture class="hero-background hero-visual">
        <source media="(max-width: 767px)" srcset="${safeImageUrl(hero.images.mobile.path)}">
        <img src="${safeImageUrl(hero.images.dog.path)}" alt="${escapeHtml(hero.images.dog.alt)}">
      </picture>
      <div class="hero-title-layer">
        <h1 id="hero-title"><img class="hero-title-image" src="${safeImageUrl(hero.images.mobileTitle.path)}" alt="${escapeHtml(hero.images.mobileTitle.alt)}">${hero.titleLines.map((line, index) => `<span${editAttr(`hero.titleLines.${index}`)}>${escapeHtml(line)}</span>`).join("")}</h1>
      </div>
      <div class="hero-content hero-inner">
        <p class="hero-tagline"${editAttr("hero.tagline")}>${escapeHtml(hero.tagline)}</p>
      </div>
    </section>`;
  };

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
        <div class="philosophy-label" aria-label="MOKOMOKO 品牌名稱說明">
          <p class="philosophy-label-title"${editAttr("philosophy.label.title")}>${escapeHtml(section.label.title)}</p>
          <p class="philosophy-label-description"${editAttr("philosophy.label.description")}>${escapeHtml(section.label.description)}</p>
        </div>
        <div class="philosophy-copy">
          <p${editAttr("philosophy.lines.0")}>${escapeHtml(section.lines[0])}</p>
          <p${editAttr("philosophy.lines.1")}>${escapeHtml(section.lines[1])}</p>
        </div>
        <div class="philosophy-gallery-host">${renderPhilosophyGallery(galleryItems(section))}</div>
      </div>
    </section>`;

  const renderPricingCalculator = ({ calculator, integrations }) => `
    <section id="plans" class="section pricing-section" aria-labelledby="pricing-title">
      <div class="content">
        <div class="section-heading centered">
          <p class="section-kicker">PRICING</p>
          <h2 id="pricing-title" class="section-title"${editAttr("calculator.title")}>${escapeHtml(calculator.title)}</h2>
          <p class="section-description"${editAttr("calculator.subtitle")}>${escapeHtml(calculator.subtitle)}</p>
          <div class="pricing-shooting-info">${calculator.shootingInfo.map((line, index) => `<p${editAttr(`calculator.shootingInfo.${index}`)}>${escapeHtml(line)}</p>`).join("")}</div>
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

  const renderBooking = ({ booking, bookingCta, bookingForm, integrations }) => `
    <section id="booking" class="section booking-section" aria-labelledby="booking-title">
      <div class="content narrow">
        <div class="section-heading centered">
          <p class="section-kicker">BOOKING</p>
          <h2 id="booking-title" class="section-title"${editAttr("booking.title")}>${escapeHtml(booking.title)}</h2>
          ${booking.intro?.length ? renderLines(booking.intro, "booking.intro", "copy-lines section-description") : ""}
        </div>
        <p class="outline-pill centered"${editAttr("booking.pill")}>${escapeHtml(booking.pill)}</p>
        <ol class="booking-notes">${booking.notes.map((note, index) => `<li><span>${escapeHtml(note.number)}</span><div>${note.lines.map((line, lineIndex) => `<p${editAttr(`booking.notes.${index}.lines.${lineIndex}`)}>${renderHighlightedText(line, note.highlights)}</p>`).join("")}</div></li>`).join("")}</ol>
        ${booking.prompt ? `<p class="booking-prompt centered"${editAttr("booking.prompt")}>${escapeHtml(booking.prompt)}</p>` : ""}
      </div>
    </section>
    <section id="booking-form-section" class="section booking-form-section" aria-labelledby="form-title">
      <div class="content narrow">
        <div class="section-heading centered">
          <p class="booking-eyebrow"${editAttr("bookingForm.eyebrow")}>${escapeHtml(bookingForm.eyebrow)}</p>
          <h2 id="form-title" class="section-title"${editAttr("bookingCta.title")}>${escapeHtml(bookingCta.title)}</h2>
          <p class="section-description"${editAttr("bookingCta.description")}>${escapeHtml(bookingCta.description)}</p>
        </div>
        <div id="${escapeHtml(integrations.bookingForm.mountId)}" class="booking-module" data-content-source="bookingForm"></div>
      </div>
    </section>`;

  const renderClosing = ({ closing, social }) => `
    <footer class="closing blue-section">
      <div class="content narrow centered">
        ${closing.title ? `<h2 class="section-title light"${editAttr("closing.title")}>${escapeHtml(closing.title)}</h2>` : ""}
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
    document.addEventListener("click", (event) => {
      if (!menu.hidden && !header.contains(event.target)) closeMenu();
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

  const initHeroParallax = () => {
    const hero = root.querySelector(".hero");
    const background = hero?.querySelector(".hero-background");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || !background || reducedMotion.matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.max(0, Math.min(hero.offsetHeight, -hero.getBoundingClientRect().top));
      background.style.setProperty("--hero-scroll-parallax-y", `${Math.min(28, progress * 0.04)}px`);
    };
    const requestUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  };

  const initHeroMouseParallax = () => {
    const hero = root.querySelector(".hero");
    const background = hero?.querySelector(".hero-background");
    const title = hero?.querySelector("h1");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || !background || !title || !finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const render = () => {
      frame = 0;
      background.style.setProperty("--hero-mouse-parallax-x", `${pointerX * 8}px`);
      background.style.setProperty("--hero-mouse-parallax-y", `${pointerY * 6}px`);
      title.style.setProperty("--hero-title-mouse-x", `${pointerX * -4}px`);
      title.style.setProperty("--hero-title-mouse-y", `${pointerY * -3}px`);
    };

    const requestRender = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    hero.addEventListener("pointermove", (event) => {
      const bounds = hero.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
      hero.classList.remove("is-mouse-parallax-resetting");
      requestRender();
    }, { passive: true });

    hero.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
      hero.classList.add("is-mouse-parallax-resetting");
      requestRender();
    }, { passive: true });
  };

  let galleryCleanup = () => {};
  const initPhilosophyGallery = () => {
    const gallery = root.querySelector(".philosophy-gallery");
    const lightbox = root.querySelector(".philosophy-lightbox");
    if (!gallery || !lightbox) return () => {};
    document.body.append(lightbox);
    const controller = new AbortController();
    const on = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: controller.signal });

    const rows = [...gallery.querySelectorAll(".philosophy-gallery-row")].map((row) => ({
      row,
      track: row.querySelector(".philosophy-gallery-track"),
      groups: [...row.querySelectorAll(".philosophy-gallery-group")],
      direction: Number(row.dataset.direction),
      offset: 0,
      loopWidth: 0,
      pausedUntil: 0,
      pointerId: null,
      startX: 0,
      startY: 0,
      startOffset: 0,
      gesture: "idle",
      moved: false,
      suppressClickUntil: 0,
      lastX: 0,
      lastMoveTime: 0,
      velocityX: 0,
      inertiaStart: 0,
      inertiaFrom: 0,
      inertiaDistance: 0,
      autoBlendStart: 0,
    }));
    const originals = [...gallery.querySelectorAll(".philosophy-gallery-group:not([aria-hidden]) .philosophy-polaroid")];
    const galleryImages = originals.map((button) => button.querySelector("img"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousTime = performance.now();
    let frameId = 0;
    let lightboxIndex = 0;
    let lightboxPointerX = null;
    let returnFocus = null;
    let lockedScrollY = 0;
    let activeLightboxImages = [];
    const lightboxNav = [...lightbox.querySelectorAll(".philosophy-lightbox-nav")];
    const thumbnailStrip = lightbox.querySelector(".product-lightbox-thumbnails");

    const lightboxSource = (image, fallbackAlt) => ({
      src: typeof image === "string" ? image : image?.src,
      alt: typeof image === "string" ? fallbackAlt : image?.alt || fallbackAlt,
    });

    const setLightboxImage = (index, animateImage = false) => {
      if (!activeLightboxImages.length) return;
      lightboxIndex = (index + activeLightboxImages.length) % activeLightboxImages.length;
      const source = activeLightboxImages[lightboxIndex];
      const image = lightbox.querySelector(".philosophy-lightbox-frame img");
      const apply = () => {
        image.src = source.src;
        image.alt = source.alt;
        thumbnailStrip.querySelectorAll("button").forEach((button, buttonIndex) => {
          const selected = buttonIndex === lightboxIndex;
          button.classList.toggle("is-selected", selected);
          button.setAttribute("aria-current", selected ? "true" : "false");
        });
        const selectedThumb = thumbnailStrip.children[lightboxIndex];
        if (selectedThumb) thumbnailStrip.scrollLeft = Math.max(0, selectedThumb.offsetLeft - (thumbnailStrip.clientWidth - selectedThumb.clientWidth) / 2);
        requestAnimationFrame(() => image.classList.remove("is-changing"));
      };
      if (!animateImage) return apply();
      image.classList.add("is-changing");
      window.setTimeout(apply, 80);
    };

    const renderProductThumbnails = () => {
      thumbnailStrip.hidden = activeLightboxImages.length < 2;
      thumbnailStrip.innerHTML = activeLightboxImages.map((image, index) => `<button type="button" role="listitem" data-lightbox-index="${index}" aria-label="查看第 ${index + 1} 張商品圖片"><img src="${escapeHtml(image.src)}" alt=""></button>`).join("");
    };

    const easeOut = (progress) => {
      let parameter = progress;
      for (let index = 0; index < 5; index += 1) {
        const inverse = 1 - parameter;
        const x = 3 * inverse * inverse * parameter * 0.22 + 3 * inverse * parameter * parameter * 0.36 + parameter ** 3;
        const derivative = 3 * inverse * inverse * 0.22 + 6 * inverse * parameter * (0.36 - 0.22) + 3 * parameter * parameter * (1 - 0.36);
        if (Math.abs(derivative) < 0.0001) break;
        parameter -= (x - progress) / derivative;
      }
      parameter = Math.max(0, Math.min(1, parameter));
      return 1 - (1 - parameter) ** 3;
    };

    const measure = () => rows.forEach((state) => {
      state.loopWidth = state.groups[1].offsetLeft - state.groups[0].offsetLeft;
      if (state.loopWidth) state.offset = ((state.offset % state.loopWidth) + state.loopWidth) % state.loopWidth;
    });
    const renderRows = () => rows.forEach((state) => {
      const normalizedOffset = state.loopWidth ? ((state.offset % state.loopWidth) + state.loopWidth) % state.loopWidth : state.offset;
      const distance = state.direction < 0 ? -normalizedOffset : normalizedOffset - state.loopWidth;
      state.track.style.transform = `translate3d(${distance}px, 0, 0)`;
    });
    const animate = (time) => {
      const delta = Math.min(time - previousTime, 40);
      previousTime = time;
      if (!reducedMotion.matches) rows.forEach((state) => {
        if (state.inertiaStart) {
          const progress = Math.min((time - state.inertiaStart) / 420, 1);
          state.offset = state.inertiaFrom + state.inertiaDistance * easeOut(progress);
          if (progress === 1) {
            state.inertiaStart = 0;
            state.pausedUntil = time + 1000;
            state.autoBlendStart = state.pausedUntil;
          }
        } else if (state.pointerId === null && time >= state.pausedUntil && state.loopWidth) {
          const speedBlend = state.autoBlendStart ? Math.min((time - state.autoBlendStart) / 320, 1) : 1;
          state.offset += delta * 0.025 * speedBlend;
          if (speedBlend === 1) state.autoBlendStart = 0;
        }
      });
      renderRows();
      frameId = requestAnimationFrame(animate);
    };

    const openLightbox = (index, trigger) => {
      activeLightboxImages = galleryImages.map((image) => ({ src: image.currentSrc || image.src, alt: image.alt }));
      returnFocus = trigger;
      lightboxNav.forEach((button) => { button.hidden = false; });
      thumbnailStrip.hidden = true;
      thumbnailStrip.innerHTML = "";
      lightbox.dataset.lightboxSource = "philosophy";
      lockedScrollY = window.scrollY;
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.classList.add("gallery-lightbox-open");
      lightbox.hidden = false;
      setLightboxImage(index);
      lightbox.querySelector(".philosophy-lightbox-close").focus();
    };
    const openStandaloneImage = (event) => {
      const { src, images, alt, trigger, index = 0 } = event.detail || {};
      activeLightboxImages = (Array.isArray(images) && images.length ? images : [src])
        .map((image) => lightboxSource(image, alt || "商品圖片預覽"))
        .filter((image) => image.src && /^(?:(?:\.\.?\/)assets\/|https?:|blob:|data:image\/)/.test(image.src));
      if (!activeLightboxImages.length) return;
      returnFocus = trigger instanceof HTMLElement ? trigger : null;
      lightboxNav.forEach((button) => { button.hidden = activeLightboxImages.length < 2; });
      renderProductThumbnails();
      lightbox.dataset.lightboxSource = "product";
      lockedScrollY = window.scrollY;
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.classList.add("gallery-lightbox-open");
      lightbox.hidden = false;
      setLightboxImage(Number(index) || 0);
      lightbox.querySelector(".philosophy-lightbox-close").focus();
    };
    const showLightboxImage = (step) => {
      setLightboxImage(lightboxIndex + step, true);
    };
    const closeLightbox = () => {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove("gallery-lightbox-open");
      document.body.style.top = "";
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: lockedScrollY, left: 0, behavior: "auto" });
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      returnFocus?.focus({ preventScroll: true });
    };

    rows.forEach((state) => {
      on(state.row, "pointerdown", (event) => {
        state.pointerId = event.pointerId;
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.startOffset = state.offset;
        state.lastX = event.clientX;
        state.lastMoveTime = performance.now();
        state.velocityX = 0;
        state.inertiaStart = 0;
        state.autoBlendStart = 0;
        state.gesture = "pending";
        state.moved = false;
        state.pausedUntil = Infinity;
      });
      on(state.row, "pointermove", (event) => {
        if (event.pointerId !== state.pointerId || state.gesture === "vertical") return;
        const deltaX = event.clientX - state.startX;
        const deltaY = event.clientY - state.startY;
        if (state.gesture === "pending" && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 7) {
          state.gesture = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
          if (state.gesture === "horizontal") {
            state.moved = true;
            state.row.classList.add("is-dragging");
            state.row.setPointerCapture(event.pointerId);
          } else {
            state.pausedUntil = performance.now() + 900;
          }
        }
        if (state.gesture !== "horizontal") return;
        event.preventDefault();
        const time = performance.now();
        const elapsed = Math.max(time - state.lastMoveTime, 1);
        state.velocityX = state.velocityX * 0.55 + ((event.clientX - state.lastX) / elapsed) * 0.45;
        state.lastX = event.clientX;
        state.lastMoveTime = time;
        state.offset = state.startOffset + deltaX * state.direction;
      });
      const endDrag = (event) => {
        if (event.pointerId !== state.pointerId) return;
        if (state.row.hasPointerCapture(event.pointerId)) state.row.releasePointerCapture(event.pointerId);
        state.row.classList.remove("is-dragging");
        state.pointerId = null;
        if (state.moved && !reducedMotion.matches) {
          state.inertiaFrom = state.offset;
          state.inertiaDistance = Math.max(-90, Math.min(90, state.velocityX * 150 * state.direction));
          state.inertiaStart = performance.now();
          state.pausedUntil = state.inertiaStart;
        } else {
          state.pausedUntil = performance.now() + 900;
        }
        if (state.moved) state.suppressClickUntil = performance.now() + 100;
        window.setTimeout(() => { state.moved = false; }, 0);
      };
      on(state.row, "pointerup", endDrag);
      on(state.row, "pointercancel", endDrag);
      on(state.row, "click", (event) => {
        const button = event.target.closest(".philosophy-polaroid");
        if (!button || button.closest('[aria-hidden="true"]')) return;
        event.preventDefault();
        if (state.moved || performance.now() < state.suppressClickUntil) return;
        openLightbox(Number(button.dataset.galleryIndex), button);
      });
    });

    on(lightbox.querySelector(".philosophy-lightbox-close"), "click", closeLightbox);
    on(lightbox.querySelector(".philosophy-lightbox-prev"), "click", () => showLightboxImage(-1));
    on(lightbox.querySelector(".philosophy-lightbox-next"), "click", () => showLightboxImage(1));
    on(thumbnailStrip, "click", (event) => {
      const button = event.target.closest("[data-lightbox-index]");
      if (button) setLightboxImage(Number(button.dataset.lightboxIndex), true);
    });
    on(lightbox, "click", (event) => { if (event.target === lightbox) closeLightbox(); });
    on(lightbox, "pointerdown", (event) => { lightboxPointerX = event.clientX; });
    on(lightbox, "pointerup", (event) => {
      if (lightboxPointerX === null) return;
      const delta = event.clientX - lightboxPointerX;
      if (activeLightboxImages.length > 1 && Math.abs(delta) > 45) showLightboxImage(delta < 0 ? 1 : -1);
      lightboxPointerX = null;
    });
    on(window, "mokomoko:open-image", openStandaloneImage);
    on(document, "keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (activeLightboxImages.length > 1 && event.key === "ArrowLeft") showLightboxImage(-1);
      if (activeLightboxImages.length > 1 && event.key === "ArrowRight") showLightboxImage(1);
    });
    on(window, "resize", measure, { passive: true });
    requestAnimationFrame(() => {
      measure();
      rows[1].offset = rows[1].loopWidth * 0.5;
      renderRows();
      frameId = requestAnimationFrame(animate);
    });
    on(window, "pagehide", () => cancelAnimationFrame(frameId), { once: true });
    return () => {
      controller.abort();
      cancelAnimationFrame(frameId);
      if (!lightbox.hidden) closeLightbox();
      lightbox.remove();
    };
  };

  const initScrollReveal = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const revealSections = [...root.querySelectorAll("#philosophy, #plans, #booking, #faq")];
    const fadeTargets = [...root.querySelectorAll([
      ".intro .content",
      ".booking-form-section .section-heading",
      ".booking-form-section .booking-module",
      ".closing .content",
    ].join(","))];

    const bookingNotes = root.querySelector(".booking-notes");
    const targets = [...revealSections, ...fadeTargets, ...(bookingNotes ? [bookingNotes] : [])];
    targets.forEach((target) => target.classList.add(target === bookingNotes ? "booking-notes-reveal" : "reveal-item"));
    bookingNotes?.querySelectorAll(":scope > li").forEach((item, index) => {
      item.style.setProperty("--booking-reveal-index", index);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

    targets.forEach((target) => observer.observe(target));
    root.classList.add("reveal-enabled");
  };

  const renderSite = async (sourceContent) => {
    const content = await prepareEditorContent(sourceContent);
    applyMetadata(content.meta);
    const hasAnnouncement = Boolean(content.announcement?.enabled && content.announcement.text);
    root.innerHTML = `${renderAnnouncement(content.announcement)}${renderHeader(content.header, hasAnnouncement)}<main>${renderHero(content)}${renderIntro(content)}${renderPhilosophy(content.philosophy)}${renderPricingCalculator(content)}<div id="${escapeHtml(content.integrations.featuredWorks.mountId)}" hidden></div><div id="${escapeHtml(content.integrations.recentWorks.mountId)}" hidden></div>${renderBooking(content)}${renderFaq(content.faq)}</main>${renderClosing(content)}`;
    bindNavigation();
    bindHeader();
    bindFaq();
    initCalculator(document.getElementById(content.integrations.calculator.mountId), content);
    initBookingForm(document.getElementById(content.integrations.bookingForm.mountId), content);
    initHeroParallax();
    initHeroMouseParallax();
    galleryCleanup = initPhilosophyGallery();
    window.__MOKOMOKO_GALLERY_UPDATE__ = (items) => {
      galleryCleanup();
      const host = root.querySelector(".philosophy-gallery-host");
      if (!host) return;
      host.innerHTML = renderPhilosophyGallery(items);
      galleryCleanup = initPhilosophyGallery();
    };
    initScrollReveal();
    await initEditor(content);
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
