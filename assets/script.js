(function () {
  'use strict';

  /* ---------- Mobile nav toggle ---------- */
  var burger = document.getElementById('navBurger');
  var mobileMenu = document.getElementById('navMobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('menu-open', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  /* ---------- Sticky nav shadow on scroll ---------- */
  var nav = document.getElementById('siteNav');
  if (nav) {
    var onScrollNav = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScrollNav, { passive: true });
    onScrollNav();
  }

  /* ---------- Scroll reveal animations ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  var itemEls = document.querySelectorAll('.reveal-item');

  function forceRevealAll() {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
    itemEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });

    var ioItems = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          ioItems.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    itemEls.forEach(function (el) { ioItems.observe(el); });

    // Safety net: never let content stay invisible (slow JS, quirky
    // browsers, automated screenshots that resize instead of scrolling).
    window.addEventListener('load', function () {
      setTimeout(forceRevealAll, 2000);
    });
  } else {
    forceRevealAll();
  }

  /* ---------- Testimonial carousel ---------- */
  var track = document.getElementById('testimonialCards');
  var carouselArrows = document.querySelectorAll('.carousel-arrow');
  if (track) {
    carouselArrows.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = parseInt(btn.getAttribute('data-dir'), 10) || 1;
        var card = track.querySelector('.t-card');
        var step = card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.85;
        track.scrollBy({ left: dir * step, behavior: 'smooth' });
      });
    });

    // Only show arrows when the track actually overflows (nothing to
    // scroll when all cards already fit side by side, e.g. desktop).
    var updateArrowVisibility = function () {
      var hasOverflow = track.scrollWidth > track.clientWidth + 4;
      carouselArrows.forEach(function (btn) {
        btn.style.display = hasOverflow ? '' : 'none';
      });
    };
    updateArrowVisibility();
    window.addEventListener('resize', updateArrowVisibility);
    window.addEventListener('load', updateArrowVisibility);
  }

  /* ---------- Back to top ---------- */
  var topBtn = document.querySelector('.btn-top');
  if (topBtn) {
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Smooth-scroll for in-page anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        var y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  var sections = ['formacao', 'sobre', 'faq', 'inscricao', 'contactos']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = document.querySelectorAll('.nav-links .lnk, .nav-mobile-menu .lnk');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' });
    sections.forEach(function (s) { navIo.observe(s); });
  }
})();


/* ---------- Ficha de inscrição: envia para o WhatsApp da escola ---------- */
(function () {
  'use strict';
  var form = document.getElementById('signupForm');
  if (!form) return;

  var WA = 'https://wa.me/244953654585?text=';
  var hint = document.getElementById('ageHint');
  var statusEl = document.getElementById('formStatus');
  var dob = form.elements['nascimento'];
  dob.max = new Date().toISOString().slice(0, 10);

  function val(name) { var el = form.elements[name]; return el && el.value ? el.value.trim() : ''; }
  function checked(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function digits(s) { return s.replace(/\D/g, '').length; }

  function ageOf(iso) {
    var p = iso.split('-'); if (p.length !== 3) return null;
    var born = new Date(+p[0], +p[1] - 1, +p[2]); if (isNaN(born)) return null;
    var now = new Date(), age = now.getFullYear() - born.getFullYear();
    var m = now.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
    return age;
  }
  function brDate(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  function updateHint() {
    var age = ageOf(dob.value), cat = checked('categoria'), msg = '';
    if (age !== null && cat) {
      if (age < 18) {
        msg = 'As inscrições são a partir dos 18 anos.';
      } else if (cat.indexOf('Ligeiro Amador') === 0 && age > 20) {
        msg = 'Ligeiro Amador é dos 18 aos 20 anos. Com ' + age + ' anos, a categoria indicada é Ligeiro Profissional ou Pesado Profissional.';
      } else if ((cat.indexOf('Ligeiro Profissional') === 0 || cat.indexOf('Pesado') === 0) && age < 21) {
        msg = 'Ligeiro Profissional e Pesado Profissional são dos 21 anos em diante. Com ' + age + ' anos, a categoria indicada é Ligeiro Amador.';
      }
    }
    hint.textContent = msg;
    hint.hidden = !msg;
  }
  dob.addEventListener('change', updateHint);
  dob.addEventListener('input', updateHint);
  form.querySelectorAll('input[name="categoria"]').forEach(function (r) { r.addEventListener('change', updateHint); });

  function setError(field, message) {
    if (!field) return;
    var out = field.querySelector('.field-error');
    field.classList.toggle('invalid', !!message);
    if (out) out.textContent = message || '';
  }
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field'); if (f) setError(f, '');
  });
  form.addEventListener('change', function (e) {
    var f = e.target.closest('.field'); if (f) setError(f, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';
    var checks = [
      ['nome', function (v) { return v.length >= 3 ? '' : 'Escreve o teu nome completo.'; }],
      ['nascimento', function (v) { return v ? '' : 'Indica a data de nascimento.'; }],
      ['bi', function (v) { return v.length >= 5 ? '' : 'Indica o número do BI.'; }],
      ['morada', function (v) { return v.length >= 3 ? '' : 'Indica a tua morada.'; }],
      ['contacto', function (v) { return digits(v) >= 9 ? '' : 'Indica um contacto com pelo menos 9 dígitos.'; }],
      ['alternativo', function (v) { return !v || digits(v) >= 9 ? '' : 'Este contacto precisa de pelo menos 9 dígitos.'; }],
      ['email', function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Confirma o e-mail.'; }]
    ];
    var first = null;
    checks.forEach(function (c) {
      var el = form.elements[c[0]], msg = c[1](val(c[0]));
      setError(el.closest('.field'), msg);
      if (msg && !first) first = el;
    });
    var catField = form.querySelector('input[name="categoria"]').closest('.field');
    if (!checked('categoria')) {
      setError(catField, 'Escolhe a categoria.');
      if (!first) first = catField.querySelector('input');
    } else { setError(catField, ''); }

    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (first.type !== 'radio') first.focus({ preventScroll: true });
      return;
    }

    var lines = [
      'Olá! Gostaria de fazer a minha inscrição na Drive Moderno.', '',
      '*Ficha de inscrição*',
      '*Nome:* ' + val('nome'),
      '*Data de nascimento:* ' + brDate(val('nascimento')),
      '*Nº do BI:* ' + val('bi'),
      '*Morada:* ' + val('morada'),
      '*Contacto:* ' + val('contacto')
    ];
    if (val('alternativo')) lines.push('*Contacto alternativo:* ' + val('alternativo'));
    if (val('email')) lines.push('*E-mail:* ' + val('email'));
    lines.push('*Categoria:* ' + checked('categoria'));
    if (checked('pagamento')) lines.push('*Forma de pagamento:* ' + checked('pagamento'));
    if (checked('horario')) lines.push('*Horário preferido:* ' + checked('horario'));

    var url = WA + encodeURIComponent(lines.join('\n'));
    var w = window.open(url, '_blank');
    if (!w) { window.location.href = url; }
    statusEl.textContent = 'Abrimos o WhatsApp com a tua ficha. Basta carregar em enviar.';
  });
})();
