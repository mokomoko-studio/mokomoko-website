(() => {
  const button = document.querySelector(".return-directory");
  const root = document.querySelector("#site-root");
  if (!button || !root) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const initialiseDirectoryButton = () => {
    const directory = document.querySelector(".jump-nav");
    if (!directory) return false;

    if (!directory.id) directory.id = "page-directory";

    const setVisible = (visible) => {
      button.classList.toggle("is-visible", visible);
      button.setAttribute("aria-hidden", String(!visible));
      button.tabIndex = visible ? 0 : -1;
    };

    const observer = new IntersectionObserver(([entry]) => {
      const hasPassedDirectory = entry.boundingClientRect.bottom < 0;
      setVisible(!entry.isIntersecting && hasPassedDirectory);
    });

    observer.observe(directory);
    button.addEventListener("click", () => {
      directory.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "center"
      });
    });

    return true;
  };

  if (initialiseDirectoryButton()) return;

  const renderObserver = new MutationObserver(() => {
    if (initialiseDirectoryButton()) renderObserver.disconnect();
  });
  renderObserver.observe(root, { childList: true, subtree: true });
})();
