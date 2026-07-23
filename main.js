/* ==========================================================================
   PROPERTY SERVICES — MAIN.JS
   Modular, dependency-free, performance-conscious interactions.
   ========================================================================== */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------- Utility: throttle via requestAnimationFrame -------------------- */
  function rafThrottle(fn) {
    let ticking = false;
    return (...args) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          fn(...args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  /* -------------------- Navbar scroll state -------------------- */
  const navbar = document.getElementById('navbar');
  const onScrollNav = rafThrottle(() => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 40);
  });
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* -------------------- Mobile menu -------------------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMobileMenu() {
    mobileMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function openMobileMenu() {
    mobileMenu.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('is-open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  /* -------------------- Smooth scroll offset for sticky navbar -------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight + 1;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* -------------------- Scroll reveal (IntersectionObserver) -------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* -------------------- Property filter tabs -------------------- */
  const filterButtons = document.querySelectorAll('.filter-tabs__btn');
  const propertyCards = document.querySelectorAll('.property-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;
      propertyCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* -------------------- Animated counters -------------------- */
  const counters = document.querySelectorAll('.counter__number');
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.floor(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix;
      }
    }
    if (prefersReducedMotion) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(tick);
    }
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  /* -------------------- Testimonial carousel (auto-sliding) -------------------- */
  const track = document.getElementById('testimonialTrack');
  const dotsWrap = document.getElementById('testimonialDots');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  if (track) {
    const slides = Array.from(track.children);
    let index = 0;
    let autoplayId = null;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
    }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      stopAutoplay();
      autoplayId = setInterval(() => goTo(index + 1), 5500);
    }
    function stopAutoplay() {
      if (autoplayId) clearInterval(autoplayId);
    }

    const slider = track.closest('.testimonial-slider');
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
    slider.addEventListener('touchstart', stopAutoplay, { passive: true });

    // Basic swipe support
    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? goTo(index - 1) : goTo(index + 1);
      }
      startAutoplay();
    }, { passive: true });

    prevBtn.addEventListener('click', () => { goTo(index - 1); startAutoplay(); });
    nextBtn.addEventListener('click', () => { goTo(index + 1); startAutoplay(); });

    goTo(0);
    startAutoplay();
  }

  /* -------------------- FAQ accordion -------------------- */
  const accordionItems = document.querySelectorAll('.accordion__item');
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion__trigger');
    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('is-active');
      accordionItems.forEach(i => {
        i.classList.remove('is-active');
        i.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        item.classList.add('is-active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* -------------------- Contact form validation -------------------- */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  function setFieldError(field, message) {
    const wrapper = field.closest('.form-field');
    const errorEl = wrapper.querySelector('.form-error');
    if (message) {
      wrapper.classList.add('has-error');
      errorEl.textContent = message;
    } else {
      wrapper.classList.remove('has-error');
      errorEl.textContent = '';
    }
  }

  function validateContactForm() {
    let valid = true;
    const name = contactForm.elements.from_name;
    const email = contactForm.elements.reply_to;
    const message = contactForm.elements.message;

    if (!name.value.trim()) {
      setFieldError(name, 'Please enter your name.');
      valid = false;
    } else {
      setFieldError(name, '');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      setFieldError(email, 'Please enter a valid email address.');
      valid = false;
    } else {
      setFieldError(email, '');
    }

    if (!message.value.trim()) {
      setFieldError(message, 'Please enter a message.');
      valid = false;
    } else {
      setFieldError(message, '');
    }

    return valid;
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateContactForm()) return;

      const submitBtn = contactForm.querySelector('.form-submit');
      const originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      emailjs.sendForm('service_b78j6l7', 'template_5x9peob', contactForm)
        .then(() => {
          formSuccess.hidden = false;
          contactForm.reset();
          setTimeout(() => { formSuccess.hidden = true; }, 6000);
        })
        .catch((error) => {
          alert('Sorry, your message could not be sent. Please try again or contact us directly. (' + (error && error.text ? error.text : 'unknown error') + ')');
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
        });
    });
  }

  /* -------------------- Newsletter form -------------------- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterSuccess = document.getElementById('newsletterSuccess');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.elements.newsletterEmail;
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailPattern.test(email.value.trim())) {
        newsletterSuccess.hidden = false;
        newsletterForm.reset();
        setTimeout(() => { newsletterSuccess.hidden = true; }, 5000);
      }
    });
  }

  /* -------------------- Search form (scrolls to properties) -------------------- */
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const target = document.getElementById('properties');
      const navHeight = navbar.offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight + 1;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* -------------------- Back to top -------------------- */
  const backToTop = document.getElementById('backToTop');
  const onScrollTopBtn = rafThrottle(() => {
    backToTop.classList.toggle('is-visible', window.scrollY > 600);
  });
  window.addEventListener('scroll', onScrollTopBtn, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* -------------------- Footer year -------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();