(function () {
  "use strict";
  /* main.js — Luis Ángel Anillo · Estadística en Salud
     Vanilla IIFE. GSAP/ScrollTrigger usados si están presentes; si no, fallback. */

  var data = window.__BRAND__ || {};
  var contact = data.contact || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $  = function (s, sc) { return (sc || document).querySelector(s); };
  var $$ = function (s, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(s)); };

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---- Contact links from manifest (centralized edit point) ---- */
  function initContactLinks() {
    if (contact.whatsapp) {
      var num = String(contact.whatsapp).replace(/\D/g, "");
      $$("[data-wa]").forEach(function (a) {
        var existing = a.getAttribute("href") || "";
        var text = "";
        var qIdx = existing.indexOf("?text=");
        if (qIdx > -1) text = existing.slice(qIdx + 6);
        else if (contact.whatsappText) text = encodeURIComponent(contact.whatsappText);
        a.href = "https://wa.me/" + num + (text ? "?text=" + text : "");
      });
    }
    if (contact.email) {
      $$("[data-email]").forEach(function (a) {
        a.href = "mailto:" + contact.email;
        if (a.classList.contains("contact-link")) a.textContent = contact.email;
      });
    }
    if (contact.instagram) {
      $$("[data-instagram]").forEach(function (a) {
        a.href = contact.instagram;
        if (a.classList.contains("contact-link") && contact.instagramHandle) a.textContent = contact.instagramHandle;
      });
    }
  }

  /* ---- Nav: scrolled state + mobile menu ---- */
  function initNav() {
    var nav = $(".nav");
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = $("[data-nav-toggle]");
    if (!toggle) return;

    var panel = document.createElement("div");
    panel.className = "nav-mobile";
    var links = $$(".nav-links a").map(function (a) {
      return '<a href="' + a.getAttribute("href") + '">' + a.textContent + "</a>";
    }).join("");
    var num = contact.whatsapp ? String(contact.whatsapp).replace(/\D/g, "") : "570000000000";
    var text = contact.whatsappText ? encodeURIComponent(contact.whatsappText) : "";
    panel.innerHTML = links +
      '<a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/' + num + (text ? "?text=" + text : "") + '">WhatsApp</a>';
    nav.appendChild(panel);

    var close = function () { panel.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menú"); };
    var open  = function () { panel.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Cerrar menú"); };

    toggle.addEventListener("click", function () {
      if (panel.classList.contains("open")) close(); else open();
    });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 960) close(); });
  }

  /* ---- Reveal on scroll (GSAP ScrollTrigger, IO fallback) ---- */
  function initReveals() {
    var els = $$(".reveal");
    if (!els.length) return;

    var show = function (el) { el.classList.add("in"); };

    if (window.gsap && window.ScrollTrigger) {
      ScrollTrigger.batch(els, {
        start: "top 88%",
        onEnter: function (batch) {
          batch.forEach(function (el, i) {
            el.style.transitionDelay = Math.min(i, 5) * 70 + "ms";
            show(el);
          });
        }
      });
      // Safety net: reveal anything still hidden after load
      window.setTimeout(function () { els.forEach(show); }, 2600);
      return;
    }

    if (!("IntersectionObserver" in window)) { els.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.05, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
    window.setTimeout(function () { els.forEach(show); }, 2600);
  }

  /* ---- Count-up numbers ---- */
  function initCountUp() {
    var nums = $$("[data-count-to]");
    if (!nums.length) return;

    var fill = function (n) { n.textContent = n.getAttribute("data-count-to") + (n.getAttribute("data-count-suffix") || ""); };
    if (reduced) { nums.forEach(fill); return; }

    var animate = function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      var target = parseFloat(el.getAttribute("data-count-to")) || 0;
      var suffix = el.getAttribute("data-count-suffix") || "";
      var dur = 1400, start = performance.now();
      function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };

    if (window.gsap && window.ScrollTrigger) {
      nums.forEach(function (n) {
        ScrollTrigger.create({ trigger: n, start: "top 90%", once: true, onEnter: function () { animate(n); } });
      });
      window.setTimeout(function () { nums.forEach(animate); }, 3000);
      return;
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(fill); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); animate(en.target); } });
    }, { threshold: 0.05 });
    nums.forEach(function (n) { io.observe(n); });
    window.setTimeout(function () { nums.forEach(animate); }, 3000);
  }

  /* ---- Magnetic buttons ---- */
  function initMagnetic() {
    if (!fineHover || reduced) return;
    $$("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.2;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---- Card tilt (subtle, fine pointers only) ---- */
  function initTilt() {
    if (!fineHover || reduced) return;
    $$("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        card.style.transform = "translateY(-4px) perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---- Contact form → Google Apps Script ---- */
  function initForm() {
    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6qQLtIhDfYBcMjNEOOtlb7yuuQm8oQQQHYkdK7kVpC0c-S5qJ0bdQHN0R5mNcZZ3qDA/exec';
    var form = $('[data-contact-form]');
    if (!form) return;
    var status = $('[data-form-status]', form);
    var btn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var hp = (form._hp && form._hp.value || '');
      if (hp) return;

      var payload = {
        name:    (form.name    && form.name.value    || '').trim(),
        email:   (form.email   && form.email.value   || '').trim(),
        role:    (form.role    && form.role.value    || '').trim(),
        message: (form.message && form.message.value || '').trim(),
        _hp: hp
      };

      btn.disabled = true;
      if (status) { status.textContent = 'Enviando…'; status.className = 'form-status'; }

      fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.result === 'ok') {
          if (status) {
            status.textContent = '¡Enviado correctamente!';
            status.className = 'form-status ok';
          }
          form.reset();
          window.setTimeout(function () { btn.disabled = false; }, 3000);
        } else { throw new Error(); }
      })
      .catch(function () {
        if (status) {
          status.textContent = 'Hubo un error. Escríbeme a anilloluis1@gmail.com';
          status.className = 'form-status err';
        }
        btn.disabled = false;
      });
    });
  }

  /* ---- Footer year ---- */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function boot() {
    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
    }
    safe(initContactLinks, "initContactLinks");
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initMagnetic, "initMagnetic");
    safe(initTilt, "initTilt");
    safe(initForm, "initForm");
    safe(initYear, "initYear");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
