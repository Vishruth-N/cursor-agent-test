const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector(".primary-nav");
const faqButtons = document.querySelectorAll(".faq-item button");
const yearNode = document.getElementById("year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    primaryNav.classList.toggle("open", !isExpanded);
  });
}

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    if (!item) {
      return;
    }

    const isOpen = item.classList.contains("open");

    faqButtons.forEach((otherButton) => {
      const otherItem = otherButton.closest(".faq-item");
      if (!otherItem) {
        return;
      }
      otherItem.classList.remove("open");
      otherButton.setAttribute("aria-expanded", "false");
    });

    item.classList.toggle("open", !isOpen);
    button.setAttribute("aria-expanded", String(!isOpen));
  });
});
