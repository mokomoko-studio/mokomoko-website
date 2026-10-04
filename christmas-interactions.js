(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const preparedLightboxes = new WeakSet();
  let galleryScrollY = 0;
  let christmasCardObserved = false;

  document.addEventListener("click", (event) => {
    if (event.target.closest(".philosophy-polaroid")) galleryScrollY = window.scrollY;
  }, true);

  const restoreGalleryPosition = () => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: galleryScrollY, left: 0, behavior: "auto" });
    requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
  };

  const prepareLightbox = (lightbox) => {
    if (preparedLightboxes.has(lightbox)) return;
    preparedLightboxes.add(lightbox);
    new MutationObserver(() => {
      if (lightbox.hidden) requestAnimationFrame(restoreGalleryPosition);
    }).observe(lightbox, { attributes: true, attributeFilter: ["hidden"] });
  };

  const prepareChristmasCard = () => {
    if (christmasCardObserved || reducedMotion.matches || !("IntersectionObserver" in window)) return;
    const card = document.querySelector('.plan-selector[data-plan="guinea"]');
    if (!card) return;
    christmasCardObserved = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.55) return;
      card.classList.add("is-christmas-attention");
      observer.disconnect();
    }, { threshold: [0.55] });
    observer.observe(card);
  };

  const prepareInteractions = () => {
    document.querySelectorAll(".philosophy-lightbox").forEach(prepareLightbox);
    prepareChristmasCard();
  };

  prepareInteractions();
  new MutationObserver(prepareInteractions).observe(document.querySelector("#site-root") || document.body, {
    childList: true,
    subtree: true
  });
})();
