// glö — site script (reveal, card tilt, orb parallax, year)
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll reveal
  const revealEls = $$(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // Product card tilt (Home only)
  const card = $("#card3d");
  if (card) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 8}deg) rotateX(${ -y * 8 }deg) translateZ(0)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
  }

  // Background orb parallax (Home only)
  const orb = $(".orb");
  if (orb) {
    let needsFrame = true, mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => {
      const { innerWidth: w, innerHeight: h } = window;
      mx = (e.clientX / w - 0.5) * 140;
      my = (e.clientY / h - 0.5) * 100;
      if (needsFrame) {
        needsFrame = false;
        requestAnimationFrame(() => {
          orb.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
          needsFrame = true;
        });
      }
    }, { passive: true });
  }
})();
