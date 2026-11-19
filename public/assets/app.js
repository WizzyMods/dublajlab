/* DublajLab — ortak istemci kodu */
(function () {
  "use strict";

  var LANGS = ["tr", "en"];
  var DEFAULT_LANG = "tr";
  var state = { lang: DEFAULT_LANG, dict: {}, site: null, currentAudio: null };

  /* ---------- yardımcılar ---------- */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function param(name) { return new URLSearchParams(location.search).get(name); }

  function L(obj) {
    if (obj === null || obj === undefined) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] !== undefined ? obj[state.lang] : (obj.tr || obj.en || "");
  }

  function money(amount, currency) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency", currency: currency || "USD",
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      return "$" + Number(amount).toFixed(2);
    }
  }

  function t(key, fallback) {
    var v = state.dict[key];
    return v === undefined || v === null ? (fallback || key) : v;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function track(event, data) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: event }, data || {}));
    } catch (e) { /* sessiz */ }
  }

  /* ---------- dil ---------- */
  function pickLang() {
    var q = (param("lang") || "").toLowerCase();
    if (LANGS.indexOf(q) > -1) return q;
    try {
      var saved = localStorage.getItem("dl_lang");
      if (saved && LANGS.indexOf(saved) > -1) return saved;
    } catch (e) { /* gizli mod */ }
    var nav = (navigator.language || "").slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) > -1 ? nav : DEFAULT_LANG;
  }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    qsa("[data-i18n]").forEach(function (node) {
      var v = state.dict[node.getAttribute("data-i18n")];
      if (v !== undefined) node.textContent = v;
    });
    qsa("[data-i18n-html]").forEach(function (node) {
      var v = state.dict[node.getAttribute("data-i18n-html")];
      if (v !== undefined) node.innerHTML = v;
    });
    qsa("[data-lang-label]").forEach(function (node) {
      node.textContent = state.lang === "tr" ? "EN" : "TR";
    });
    document.dispatchEvent(new CustomEvent("dl:lang", { detail: state.lang }));
  }

  function setLang(lang) {
    state.lang = LANGS.indexOf(lang) > -1 ? lang : DEFAULT_LANG;
    try { localStorage.setItem("dl_lang", state.lang); } catch (e) { /* yok */ }
    return fetch("/i18n/" + state.lang + ".json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { state.dict = d || {}; applyI18n(); })
      .catch(function () { state.dict = {}; applyI18n(); });
  }

  /* ---------- site verisi ---------- */
  function loadSite() {
    return fetch("/site.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { state.site = d; })
      .catch(function () { state.site = null; });
  }

  function priceText() {
    var p = state.site && state.site.price;
    return p ? money(p.amount, p.currency) : "$6.99";
  }

  function isBuyable() {
    return !!(state.site && state.site.gumroadUrl);
  }

  function checkoutUrl() {
    var url = state.site.gumroadUrl;
    return url + (url.indexOf("?") > -1 ? "&" : "?") + "wanted=true";
  }

  function paintBuyButton(node) {
    if (isBuyable()) {
      node.href = checkoutUrl();
      node.rel = "noopener";
      node.removeAttribute("aria-disabled");
      node.textContent = t("cta.buy", "Satın Al") + " · " + priceText();
    } else {
      node.removeAttribute("href");
      node.setAttribute("aria-disabled", "true");
      node.textContent = t("cta.soon", "Yakında satışta");
    }
  }

  /* ---------- dinamik bloklar ---------- */
  function renderFeatures() {
    var grid = qs("#featureGrid");
    if (!grid || !state.site) return;
    grid.innerHTML = "";
    (state.site.features || []).forEach(function (f) {
      var card = el("div", "card");
      card.appendChild(el("div", "ico", "✓"));
      card.appendChild(el("h3", null, L(f)));
      grid.appendChild(card);
    });
  }

  function renderSamples() {
    var list = qs("#sampleList");
    if (!list) return;
    var samples = (state.site && state.site.samples) || [];
    list.innerHTML = "";

    if (!samples.length) {
      var empty = el("div", "sample-empty", t("samples.empty", "Ses örnekleri kısa süre içinde burada olacak."));
      list.appendChild(empty);
      return;
    }

    samples.forEach(function (sample) {
      list.appendChild(buildSample(sample));
    });
  }

  function buildSample(sample) {
    var card = el("div", "sample");

    var meta = el("div", "meta");
    var who = el("div", "who");
    who.appendChild(el("span", null, L(sample.name) || "—"));
    if (sample.tag) who.appendChild(el("span", "tag", L(sample.tag)));
    meta.appendChild(who);
    if (sample.line) meta.appendChild(el("p", "line", "“" + L(sample.line) + "”"));
    card.appendChild(meta);

    var player = el("div", "player");
    var seg = el("div", "seg");
    var btnTr = el("button", null, "TR");
    var btnEn = el("button", null, "EN");
    btnTr.type = "button";
    btnEn.type = "button";
    seg.appendChild(btnTr);
    seg.appendChild(btnEn);

    var play = el("button", "play", "▶");
    play.type = "button";
    play.setAttribute("aria-label", t("samples.play", "Dinle"));

    var audio = document.createElement("audio");
    audio.preload = "none";
    audio.src = state.lang === "tr" ? sample.tr : (sample.en || sample.tr);
    audio.hidden = true;

    function setSide(side) {
      btnTr.setAttribute("aria-pressed", side === "tr" ? "true" : "false");
      btnEn.setAttribute("aria-pressed", side === "en" ? "true" : "false");
      var src = side === "tr" ? sample.tr : (sample.en || sample.tr);
      audio.pause();
      audio.src = src;
      play.textContent = "▶";
      play.classList.remove("playing");
    }

    btnTr.addEventListener("click", function () { setSide("tr"); });
    btnEn.addEventListener("click", function () { setSide("en"); });

    play.addEventListener("click", function () {
      if (audio.paused) {
        if (state.currentAudio && state.currentAudio !== audio) {
          state.currentAudio.pause();
        }
        state.currentAudio = audio;
        var p = audio.play();
        if (p && p.catch) p.catch(function () { /* dosya yok */ });
      } else {
        audio.pause();
      }
      track("sample_play", { id: sample.id || L(sample.name) });
    });

    audio.addEventListener("play", function () {
      play.textContent = "❚❚";
      play.classList.add("playing");
    });
    audio.addEventListener("pause", function () {
      play.textContent = "▶";
      play.classList.remove("playing");
    });
    audio.addEventListener("ended", function () {
      play.textContent = "▶";
      play.classList.remove("playing");
    });

    setSide(state.lang === "en" && sample.en ? "en" : "tr");
    player.appendChild(seg);
    player.appendChild(play);
    player.appendChild(audio);
    card.appendChild(player);

    return card;
  }

  function renderFaq(targets) {
    if (!state.site) return;
    var items = state.site.faq || [];
    targets.forEach(function (sel) {
      var box = qs(sel);
      if (!box) return;
      box.innerHTML = "";
      items.forEach(function (item, i) {
        var d = document.createElement("details");
        if (i === 0 && sel === "#faqList") d.open = true;
        var s = document.createElement("summary");
        s.textContent = L(item.q);
        var p = document.createElement("p");
        p.textContent = L(item.a);
        d.appendChild(s);
        d.appendChild(p);
        box.appendChild(d);
      });
    });
  }

  function renderVersions() {
    var box = qs("#versionList");
    if (!box || !state.site) return;
    var list = state.site.versions || [];
    box.innerHTML = "";
    if (!list.length) {
      box.appendChild(el("p", "muted small", t("ver.empty", "Sürüm notları yakında.")));
      return;
    }
    list.forEach(function (v) {
      var item = el("div", "release");
      var head = el("div", "head");
      head.appendChild(el("h3", null, "v" + v.version));
      if (v.date) head.appendChild(el("span", "date", v.date));
      item.appendChild(head);
      var notes = L(v.notes);
      if (notes && notes.length) {
        var ul = document.createElement("ul");
        notes.forEach(function (n) { ul.appendChild(el("li", null, n)); });
        item.appendChild(ul);
      }
      box.appendChild(item);
    });
  }

  function paintStaticSlots() {
    var s = state.site || {};

    qsa("[data-primary=price]").forEach(function (n) { n.textContent = priceText(); });
    qsa("[data-primary=title]").forEach(function (n) { n.textContent = L(s.product && s.product.title); });
    qsa("[data-primary=subtitle]").forEach(function (n) { n.textContent = L(s.product && s.product.subtitle); });
    qsa("[data-primary=version]").forEach(function (n) { n.textContent = "v" + (s.version || "1.0"); });
    qsa("[data-primary=gameVersion]").forEach(function (n) { n.textContent = s.gameVersion || "1.0"; });
    qsa("[data-bar=price]").forEach(function (n) { n.textContent = priceText(); });
    qsa("[data-bar=title]").forEach(function (n) { n.textContent = L(s.product && s.product.title); });

    qsa("[data-buy]").forEach(paintBuyButton);

    qsa("[data-buy-note]").forEach(function (n) {
      n.hidden = isBuyable();
    });

    qsa("[data-contact]").forEach(function (n) {
      var mail = (s.contactEmail || "destek@dublajlab.com");
      n.textContent = mail;
      if (n.tagName === "A") n.href = "mailto:" + mail;
    });
  }

  /* ---------- başlangıç ---------- */
  function boot() {
    var y = qs("#year");
    if (y) y.textContent = String(new Date().getFullYear());

    qsa("[data-lang-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(state.lang === "tr" ? "en" : "tr").then(render);
      });
    });

    setLang(pickLang())
      .then(loadSite)
      .then(function () {
        render();
        mountPlayerFallback();
      });
  }

  function render() {
    paintStaticSlots();
    renderFeatures();
    renderSamples();
    renderFaq(["#faqList", "#faqFull"]);
    renderVersions();
  }

  /* Ses dosyası henüz yoksa oynatıcı sessizce hata vermesin */
  function mountPlayerFallback() {
    document.addEventListener("error", function (e) {
      if (e.target && e.target.tagName === "AUDIO") {
        var card = e.target.closest(".sample");
        if (card) {
          var note = card.querySelector(".line");
          if (note && !note.dataset.err) {
            note.dataset.err = "1";
            note.textContent = t("samples.missing", "Bu örnek henüz yüklenmedi.");
          }
        }
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
