(function () {
  var cfg = window.MOONFIELD || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Contact details from config ---------- */
  var waNumber = (cfg.whatsappNumber || '').replace(/\D/g, '');
  function waLink(text) {
    return 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text);
  }
  var defaultMsg = "Hi MoonField, I'd like to know more about your services.";
  if (waNumber) {
    $$('[data-wa]').forEach(function (a) { a.href = waLink(defaultMsg); });
    var waText = $('[data-wa-text]');
    if (waText) { waText.href = waLink(defaultMsg); waText.textContent = 'WhatsApp: +' + waNumber; waText.hidden = false; }
  } else {
    $$('[data-wa]').forEach(function (a) { a.hidden = true; });
    console.warn('MoonField: set whatsappNumber in assets/js/config.js to enable WhatsApp links.');
  }
  if (cfg.email) {
    var em = $('[data-email]');
    em.href = 'mailto:' + cfg.email; em.textContent = cfg.email; em.hidden = false;
  }

  /* ---------- Cloudflare Web Analytics (cookieless) ---------- */
  if (cfg.cfAnalyticsToken) {
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: cfg.cfAnalyticsToken }));
    document.head.appendChild(s);
  }

  /* ---------- Nav: stuck state, scroll progress, mobile menu ---------- */
  var nav = $('#nav'), bar = $('#progress');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-stuck', y > 10);
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (!reduce) {
      $$('[data-parallax]').forEach(function (el) {
        el.style.translate = '0 ' + (y * parseFloat(el.dataset.parallax)) + 'px';
      });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = $('#navToggle'), links = $('#navLinks');
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  $$('a', links).forEach(function (a) {
    a.addEventListener('click', function () { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- Scroll reveal + count-up ---------- */
  function countUp(el) {
    var end = parseInt(el.dataset.count, 10), t0 = null, dur = 1200;
    if (reduce || !end) return;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  var targets = $$('.reveal, .steps li');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.25) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Contact form -> Supabase, then continue on WhatsApp ---------- */
  var form = $('#leadForm'), err = $('#formErr'), btn = $('#submitBtn'), done = $('#done');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    err.hidden = true;
    var d = new FormData(form);
    if (d.get('website')) return; // honeypot: bots fill this, people never see it
    var lead = {
      name: (d.get('name') || '').trim(),
      business: (d.get('business') || '').trim(),
      contact: (d.get('contact') || '').trim(),
      message: (d.get('message') || '').trim(),
      source: location.href.slice(0, 300)
    };
    if (!lead.name || lead.contact.length < 3) {
      err.textContent = 'Please add your name and a phone number or email so we can reach you.';
      err.hidden = false;
      return;
    }
    btn.disabled = true;

    var save = Promise.resolve();
    if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
      save = fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.supabaseAnonKey,
          Authorization: 'Bearer ' + cfg.supabaseAnonKey,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(lead)
      }).catch(function () { /* the WhatsApp hand-off below still reaches us */ });
    }

    save.then(function () {
      var text = "Hi, I'm " + lead.name + (lead.business ? ' from ' + lead.business : '') + '.' +
        (lead.message ? ' ' + lead.message : " I'd like to know more about your services.");
      if (waNumber) $('#doneWa').href = waLink(text); else $('#doneWa').hidden = true;
      form.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  });

  /* ---------- Loader: moonrise over the field, once per visit ---------- */
  // Spiral of dots placed by the golden angle, growing slightly toward the edge
  var spiral = $('#loaderSpiral');
  if (spiral) {
    var N = 28, GOLDEN = 137.508 * Math.PI / 180;
    for (var di = 1; di <= N; di++) {
      var dr = Math.sqrt(di / N), da = di * GOLDEN, dot = document.createElement('span');
      dot.className = 'loader__dot';
      dot.style.left = (50 + Math.cos(da) * dr * 44) + '%';
      dot.style.top = (50 + Math.sin(da) * dr * 44) + '%';
      dot.style.width = (5 + dr * 7) + '%';
      dot.style.setProperty('--d', (-(di / N) * 1.6).toFixed(2) + 's');
      spiral.appendChild(dot);
    }
  }
  var root = document.documentElement, loader = $('#loader');
  function reveal() { root.classList.add('ready'); }
  setTimeout(function () { reveal(); if (loader) loader.remove(); }, 6000); // failsafe: never leave the page locked
  if (root.classList.contains('skip-loader') || !loader) {
    reveal();
    if (loader) loader.remove();
  } else {
    var started = Date.now(), minMs = reduce ? 800 : 2000;
    var loaded = new Promise(function (r) {
      if (document.readyState === 'complete') r(); else window.addEventListener('load', r);
    });
    loaded.then(function () {
      setTimeout(function () {
        loader.classList.add('done');
        reveal();
        try { sessionStorage.setItem('mf-seen', '1'); } catch (e) {}
        setTimeout(function () { loader.remove(); }, 800);
      }, Math.max(0, minMs - (Date.now() - started)));
    });
  }

  /* ---------- Hero: rotating "Built for ..." word ---------- */
  var rot = $('#rot');
  if (rot && !reduce) {
    var n = rot.children.length - 1, i = 0, h = rot.children[0].offsetHeight;
    setInterval(function () {
      i++;
      rot.style.transform = 'translateY(' + (-i * rot.children[0].offsetHeight) + 'px)';
      if (i === n) {
        setTimeout(function () {
          rot.style.transition = 'none';
          rot.style.transform = 'translateY(0)';
          i = 0;
          void rot.offsetHeight;
          rot.style.transition = '';
        }, 650);
      }
    }, 2200);
  }

  /* ---------- About: stagger the tool chips ---------- */
  $$('.chips li').forEach(function (li, k) { li.style.setProperty('--i', k); });

  /* ---------- Moon chatbot (Grok via Cloudflare Worker; keyword fallback offline) ---------- */
  var panel = $('#moonPanel'), mToggle = $('#moonToggle'), mLog = $('#moonLog'), mForm = $('#moonForm'),
      mInput = $('#moonInput'), mChips = $('#moonChips'), mHint = $('#moonHint');
  var history = [], busy = false;
  function setOpen(open) {
    panel.hidden = !open;
    mHint.hidden = open;
    mToggle.setAttribute('aria-expanded', open);
    mToggle.setAttribute('aria-label', open ? 'Close chat with Moon' : 'Open chat with Moon');
    if (open) mInput.focus();
  }
  mToggle.addEventListener('click', function () { setOpen(panel.hidden); });
  $('#moonClose').addEventListener('click', function () { setOpen(false); mToggle.focus(); });
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); mToggle.focus(); } });

  function addMsg(text, who) {
    var p = document.createElement('p');
    p.className = 'msg msg--' + who;
    if (who === 'bot') {
      // text only, but turn bare URLs into links
      text.split(/(https?:\/\/[^\s)]+)/g).forEach(function (part) {
        if (/^https?:\/\//.test(part)) {
          var a = document.createElement('a'); a.href = part; a.textContent = part; a.target = '_blank'; a.rel = 'noopener'; p.appendChild(a);
        } else p.appendChild(document.createTextNode(part));
      });
    } else p.textContent = text;
    mLog.appendChild(p);
    mLog.scrollTop = mLog.scrollHeight;
    return p;
  }
  function typing() {
    var p = document.createElement('p');
    p.className = 'msg msg--bot msg--typing'; p.setAttribute('aria-label', 'Moon is typing');
    p.innerHTML = '<i></i><i></i><i></i>';
    mLog.appendChild(p); mLog.scrollTop = mLog.scrollHeight;
    return p;
  }
  var phoneShown = '+91 93131 18039';
  var phoneTel = 'tel:+' + (waNumber || '919313118039');
  var FALLBACK = [
    [/website|site|web/i, "We build fast, mobile-first sites for local businesses. For a free 30-min audit, message Meenakshi directly:"],
    [/whatsapp|automat|reminder|invoice/i, "We automate WhatsApp replies, reminders and enquiry sheets. Tell Meenakshi what eats your evenings:"],
    [/google|seo|maps|review|rank|search/i, "We fix your Google profile and get reviews flowing. Chat with Meenakshi for a free check:"],
    [/price|cost|how much|fee/i, "Pricing is fixed and agreed in writing. For a real number, talk to Meenakshi directly:"]
  ];
  function fallback(text) {
    for (var i = 0; i < FALLBACK.length; i++) if (FALLBACK[i][0].test(text)) return FALLBACK[i][1];
    return "The quickest way to get an answer is to talk to Meenakshi directly:";
  }
  function addCta() {
    var p = document.createElement('p');
    p.className = 'msg msg--bot msg--cta';
    var a = document.createElement('a');
    a.className = 'btn btn--wa'; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'Chat on WhatsApp';
    a.href = waNumber ? waLink(defaultMsg) : '#contact';
    var c = document.createElement('a');
    c.href = phoneTel; c.textContent = 'or call ' + phoneShown;
    p.appendChild(a); p.appendChild(document.createElement('br')); p.appendChild(c);
    mLog.appendChild(p); mLog.scrollTop = mLog.scrollHeight;
  }
  function ask(text) {
    if (busy || !text) return;
    busy = true; mChips.hidden = true;
    mForm.querySelector('button').disabled = true;
    addMsg(text, 'me');
    history.push({ role: 'user', content: text });
    var dots = typing();
    var reply;
    if (cfg.moonApi) {
      reply = fetch(cfg.moonApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12) })
      }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { if (!j.reply) throw new Error('empty'); return j.reply; })
        .catch(function () { return fallback(text); });
    } else {
      reply = new Promise(function (r) { setTimeout(function () { r(fallback(text)); }, 600); });
    }
    reply.then(function (t) {
      dots.remove();
      addMsg(t, 'bot');
      addCta();
      history.push({ role: 'assistant', content: t });
      busy = false;
      mForm.querySelector('button').disabled = false;
      mInput.focus();
    });
  }
  mForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = mInput.value.trim(); mInput.value = '';
    ask(t);
  });
  $$('button', mChips).forEach(function (b) {
    b.addEventListener('click', function () { ask(b.textContent); });
  });
})();
