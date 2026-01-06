// burgermenu
function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll(".car-slide"));
    const prevBtn = carousel.querySelector("[data-prev]");
    const nextBtn = carousel.querySelector("[data-next]");
    const dotsWrap = carousel.querySelector("[data-dots]");
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll(".dot")) : [];

    let index = slides.findIndex(s => s.classList.contains("is-active"));
    if (index < 0) index = 0;

    function render(newIndex) {
      index = (newIndex + slides.length) % slides.length;

      slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }

    prevBtn?.addEventListener("click", () => render(index - 1));
    nextBtn?.addEventListener("click", () => render(index + 1));

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const i = Number(dot.dataset.dot);
        if (!Number.isNaN(i)) render(i);
      });
    });

    // Keyboard navigation when focused inside the carousel
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") render(index - 1);
      if (e.key === "ArrowRight") render(index + 1);
    });

    // Make carousel focusable for keyboard users
    carousel.tabIndex = 0;

    render(index);
  });
});
