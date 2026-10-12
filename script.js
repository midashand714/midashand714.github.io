const navLinks = document.querySelectorAll(".nav > a[href]");
const navDropdowns = document.querySelectorAll(".nav-dropdown");
const placeholderLinks = document.querySelectorAll("a[href='#']");
const countUpValues = document.querySelectorAll("[data-count-up]");
const lightbox = document.querySelector("[data-image-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxTriggers = document.querySelectorAll(".assembly-wiki-step img, [data-lightbox-trigger]");

const currentPage = window.location.pathname.split("/").pop() || "index.html";

const normalizePage = (href) => {
  const url = new URL(href, window.location.href);
  return url.pathname.split("/").pop() || "index.html";
};

navLinks.forEach((link) => {
  link.classList.toggle("active", normalizePage(link.href) === currentPage);
});

navDropdowns.forEach((dropdown) => {
  const dropdownLinks = dropdown.querySelectorAll("a[href]");
  const isActive = Array.from(dropdownLinks).some((link) => normalizePage(link.href) === currentPage);
  dropdown.classList.toggle("active", isActive);
});

placeholderLinks.forEach((link) => {
  link.setAttribute("aria-disabled", "true");
  link.addEventListener("click", (event) => {
    event.preventDefault();
  });
});

const formatCountValue = (value, element) => {
  const decimals = Number(element.dataset.countDecimals || 0);
  const prefix = element.dataset.countPrefix || "";
  const suffix = element.dataset.countSuffix || "";
  const formattedNumber = element.dataset.countFormat === "currency"
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value.toFixed(decimals);

  return `${prefix}${formattedNumber}${suffix}`;
};

const animateCountValue = (element) => {
  if (element.dataset.countAnimated === "true") {
    return;
  }

  element.dataset.countAnimated = "true";

  const target = Number(element.dataset.countTarget);
  if (!Number.isFinite(target)) {
    return;
  }

  const duration = 2000;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatCountValue(target * eased, element);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    element.textContent = formatCountValue(target, element);
  };

  requestAnimationFrame(tick);
};

if (
  countUpValues.length
  && "IntersectionObserver" in window
  && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      animateCountValue(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  countUpValues.forEach((element) => countObserver.observe(element));
}

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.hidden = true;
  document.body.classList.remove("modal-open");
  lightboxImage.src = "";
  lightboxImage.alt = "";
};

const imageFromLightboxTrigger = (trigger) => (
  trigger.matches("img") ? trigger : trigger.querySelector("img")
);

const openLightbox = (image) => {
  if (!image) {
    return;
  }

  if (!lightbox || !lightboxImage) {
    return;
  }

  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || "Enlarged image";
  lightbox.hidden = false;
  document.body.classList.add("modal-open");
  lightboxClose?.focus();
};

lightboxTriggers.forEach((trigger) => {
  const image = imageFromLightboxTrigger(trigger);
  image?.closest("figure")?.classList.add("is-zoomable");

  trigger.addEventListener("click", () => {
    if (!lightbox || !lightboxImage) {
      return;
    }

    openLightbox(image);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});


document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
});
