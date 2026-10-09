/* AUTO HUB — site scripts (vanilla JS, no dependencies) */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ROOT = document.body.getAttribute("data-root") || "";
  var fmt = function (n) { return "$" + Number(n).toLocaleString("en-US"); };

  /* ---- safe storage ---- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var CK = "autohub_cart";
  function cart() {
    var items = store.get(CK, []);
    return Array.isArray(items) ? items.filter(function (id, i) { return typeof id === "string" && items.indexOf(id) === i; }) : [];
  }
  function saveCart(items) {
    try {
      localStorage.setItem(CK, JSON.stringify(items));
      return true;
    } catch (e) {
      toast("Could not save your cart. Enable browser storage and try again.");
      return false;
    }
  }
  function updateCartBadge() {
    var count = cart().length;
    $$(".cart-badge").forEach(function (badge) {
      badge.textContent = count;
      badge.classList.toggle("show", count > 0);
    });
  }

  /* ---- toast ---- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---- header ---- */
  var header = $(".site-header");
  var toTop = $(".to-top");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
    if (toTop) toTop.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  var burger = $(".hamburger"), mnav = $(".mobile-nav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var o = burger.classList.toggle("open"); mnav.classList.toggle("open", o);
      burger.setAttribute("aria-expanded", o); document.body.style.overflow = o ? "hidden" : "";
    });
    $$("a", mnav).forEach(function (a) { a.addEventListener("click", function () { burger.classList.remove("open"); mnav.classList.remove("open"); document.body.style.overflow = ""; }); });
  }

  /* ---- reveal on scroll ---- */
  var rev = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12 });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add("in"); });

  /* ---- counters ---- */
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, end = parseFloat(el.dataset.count), suf = el.dataset.suffix || "", t0 = null;
        (function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1600, 1), v = Math.floor(end * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString("en-US") + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: .4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---- hero slider ---- */
  var slides = $$(".hero-slide");
  if (slides.length) {
    var dots = $$(".hero-dots button"), idx = 0, timer;
    var go = function (i) { slides[idx].classList.remove("active"); dots[idx].classList.remove("active"); idx = (i + slides.length) % slides.length; slides[idx].classList.add("active"); dots[idx].classList.add("active"); };
    var play = function () { clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 5000); };
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); play(); }); });
    play();
  }

  /* ---- wishlist ---- */
  var WK = "autohub_wishlist";
  function wishlist() { return store.get(WK, []); }
  function updateBadge() {
    var n = wishlist().length;
    $$(".wish-badge").forEach(function (b) { b.textContent = n; b.classList.toggle("show", n > 0); });
  }
  function paintWish() { var w = wishlist(); $$(".wish[data-id]").forEach(function (b) { b.classList.toggle("on", w.indexOf(b.dataset.id) > -1); }); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".wish[data-id]"); if (!b) return;
    e.preventDefault();
    var w = wishlist(), id = b.dataset.id, i = w.indexOf(id);
    if (i > -1) { w.splice(i, 1); toast("Removed from your saved cars"); } else { w.push(id); toast("Saved! Find it under the heart icon"); }
    store.set(WK, w); updateBadge(); paintWish();
    if ($("#wishGrid")) renderWishlist();
  });
  updateBadge(); paintWish();

  function cardHTML(c) {
    return '<article class="car-card"><div class="car-media">' + (c.tag ? '<span class="tag ' + c.tagClass + '">' + c.tag + '</span>' : '') +
      '<button class="wish" data-id="' + c.slug + '" aria-label="Save ' + c.name + '"><i class="fa-regular fa-heart"></i></button>' +
      '<a href="' + ROOT + 'cars/' + c.slug + '.html"><img src="' + ROOT + c.img + '" alt="' + c.name + '" loading="lazy"></a></div>' +
      '<div class="car-body"><span class="brandname">' + c.brand + '</span><h3><a href="' + ROOT + 'cars/' + c.slug + '.html">' + c.name + '</a></h3>' +
      '<div class="specs"><span><i class="fa-regular fa-calendar"></i>' + c.year + '</span><span><i class="fa-solid fa-gauge-high"></i>' + c.km.toLocaleString("en-US") + ' km</span>' +
      '<span><i class="fa-solid fa-gas-pump"></i>' + c.fuel + '</span><span><i class="fa-solid fa-gears"></i>' + c.trans + '</span></div>' +
      '<div class="car-foot"><div class="price">' + fmt(c.price) + '</div><button class="btn btn-primary btn-sm" type="button" data-cart-add="' + c.slug + '">Add to Cart</button></div></div></article>';
  }
  function renderWishlist() {
    var grid = $("#wishGrid"), empty = $("#wishEmpty"); if (!grid || !window.CARS) return;
    var w = wishlist(), list = window.CARS.filter(function (c) { return w.indexOf(c.slug) > -1; });
    grid.innerHTML = list.map(cardHTML).join(""); empty.classList.toggle("show", !list.length); paintWish();
    $$(".wish", grid).forEach(function (b) { b.classList.add("on"); });
  }
  renderWishlist();

  /* ---- cart and WhatsApp checkout ---- */
  function renderCart() {
    var list = $("#cartItems"), empty = $("#cartEmpty"), summary = $("#cartSummary");
    if (!list || !empty || !summary || !window.CARS) return;
    var ids = cart(), items = ids.map(function (id) {
      return window.CARS.filter(function (car) { return car.slug === id; })[0];
    }).filter(Boolean);
    var total = items.reduce(function (sum, car) { return sum + Number(car.price); }, 0);
    list.innerHTML = items.map(function (car) {
      return '<article class="cart-item"><a class="cart-item-image" href="' + ROOT + 'cars/' + car.slug + '.html"><img src="' + ROOT + car.img + '" alt="' + car.name + '"></a>' +
        '<div class="cart-item-info"><a href="' + ROOT + 'cars/' + car.slug + '.html"><h3>' + car.name + '</h3></a>' +
        '<p>' + car.year + ' · ' + car.km.toLocaleString("en-US") + ' km · ' + car.fuel + '</p><strong>' + fmt(car.price) + '</strong></div>' +
        '<button class="btn btn-outline btn-sm" type="button" data-cart-remove="' + car.slug + '" aria-label="Remove ' + car.name + ' from cart">Remove</button></article>';
    }).join("");
    empty.hidden = items.length > 0;
    summary.hidden = items.length === 0;
    $("#cartTotal").textContent = fmt(total);
    updateCartBadge();
  }
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-cart-add]");
    if (add) {
      var id = add.dataset.cartAdd;
      if (!window.CARS || !window.CARS.some(function (car) { return car.slug === id; })) {
        toast("This car is unavailable. Please refresh and try again.");
        return;
      }
      var items = cart();
      if (items.indexOf(id) > -1) {
        toast("This car is already in your cart");
      } else {
        items.push(id);
        if (!saveCart(items)) return;
        toast("Added to your cart");
      }
      updateCartBadge();
      renderCart();
      return;
    }
    var remove = e.target.closest("[data-cart-remove]");
    if (remove) {
      if (!saveCart(cart().filter(function (id) { return id !== remove.dataset.cartRemove; }))) return;
      renderCart();
      toast("Removed from your cart");
    }
  });
  updateCartBadge();
  renderCart();
  $$(".car-card").forEach(function (card) {
    var button = $("[data-cart-add]", card);
    if (!button) {
      var wishButton = $(".wish[data-id]", card), details = $(".car-foot a", card);
      if (wishButton && details) {
        button = document.createElement("button");
        button.className = "btn btn-primary btn-sm";
        button.type = "button";
        button.dataset.cartAdd = wishButton.dataset.id;
        button.textContent = "Add to Cart";
        details.replaceWith(button);
      }
    }
  });
  var checkoutForm = $("#checkoutForm");
  if (checkoutForm) checkoutForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var items = cart(), name = $("#checkoutName").value.trim(), phone = $("#checkoutPhone").value.trim();
    var selected = items.map(function (id) {
      return window.CARS.filter(function (car) { return car.slug === id; })[0];
    }).filter(Boolean);
    if (!selected.length) { toast("Add a car to your cart before checkout"); return; }
    if (!name || !phone) { toast("Enter your name and phone number to continue"); return; }
    var total = selected.reduce(function (sum, car) { return sum + Number(car.price); }, 0);
    var message = [
      "Hello AUTO HUB, I would like to place this car order:",
      "",
      selected.map(function (car) { return car.name + " — " + fmt(car.price); }).join("\n"),
      "",
      "Total: " + fmt(total),
      "Name: " + name,
      "Phone: " + phone,
      "",
      "Please confirm availability and send me the payment and delivery details."
    ].join("\n");
    window.open("https://wa.me/2349128327370?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
  });

  /* ---- quick search (home) -> cars page ---- */
  var qs = $("#quickSearch");
  if (qs) qs.addEventListener("submit", function (e) {
    e.preventDefault(); var p = [];
    ["brand", "body", "fuel", "max"].forEach(function (k) { var v = qs.elements[k].value; if (v) p.push(k + "=" + encodeURIComponent(v)); });
    location.href = ROOT + "cars.html" + (p.length ? "?" + p.join("&") : "");
  });

  /* ---- cars listing filters ---- */
  var grid = $("#carGrid");
  if (grid) {
    var cards = $$(".car-card", grid), f = {
      q: $("#fSearch"), brand: $("#fBrand"), fuel: $("#fFuel"), max: $("#fMax"), sort: $("#fSort"),
      bodies: $$("input[name=body]")
    };
    var maxLabel = $("#fMaxLabel"), count = $("#resultCount"), empty = $("#carsEmpty");
    var params = new URLSearchParams(location.search);
    if (params.get("brand")) f.brand.value = params.get("brand");
    if (params.get("fuel")) f.fuel.value = params.get("fuel");
    if (params.get("max")) f.max.value = params.get("max");
    if (params.get("q")) f.q.value = params.get("q");
    if (params.get("body")) f.bodies.forEach(function (b) { b.checked = b.value === params.get("body"); });
    function apply() {
      var q = f.q.value.trim().toLowerCase(), max = +f.max.value, bodies = f.bodies.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      maxLabel.textContent = fmt(max); var shown = [];
      cards.forEach(function (c) {
        var d = c.dataset, ok = (!q || d.name.toLowerCase().indexOf(q) > -1) && (!f.brand.value || d.brand === f.brand.value) &&
          (!f.fuel.value || d.fuel === f.fuel.value) && (!bodies.length || bodies.indexOf(d.body) > -1) && +d.price <= max;
        c.style.display = ok ? "" : "none"; if (ok) shown.push(c);
      });
      var s = f.sort.value;
      shown.sort(function (a, b) {
        if (s === "low") return a.dataset.price - b.dataset.price;
        if (s === "high") return b.dataset.price - a.dataset.price;
        if (s === "km") return a.dataset.km - b.dataset.km;
        return a.dataset.order - b.dataset.order;
      }).forEach(function (c) { grid.appendChild(c); });
      count.innerHTML = "Showing <b>" + shown.length + "</b> of " + cards.length + " vehicles";
      empty.classList.toggle("show", !shown.length);
    }
    [f.q, f.brand, f.fuel, f.max, f.sort].forEach(function (el) { el.addEventListener("input", apply); });
    f.bodies.forEach(function (b) { b.addEventListener("change", apply); });
    var reset = $("#fReset");
    if (reset) reset.addEventListener("click", function () { f.q.value = ""; f.brand.value = ""; f.fuel.value = ""; f.max.value = f.max.max; f.bodies.forEach(function (b) { b.checked = false; }); f.sort.value = "latest"; apply(); });
    var ft = $("#filterToggle"); if (ft) ft.addEventListener("click", function () { $(".filters").classList.toggle("open"); });
    apply();
  }

  /* ---- tabs ---- */
  $$(".tabs").forEach(function (tabs) {
    $$("button", tabs).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("button", tabs).forEach(function (b) { b.classList.remove("active"); }); btn.classList.add("active");
        $$(".tab-panel").forEach(function (p) { p.classList.toggle("active", p.id === btn.dataset.tab); });
      });
    });
  });

  /* ---- accordion ---- */
  $$(".acc").forEach(function (acc) {
    var btn = $("button", acc), ans = $(".ans", acc);
    btn.addEventListener("click", function () {
      var open = acc.classList.toggle("open"); btn.setAttribute("aria-expanded", open);
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : 0;
    });
  });

  /* ---- forms (front-end validation + friendly confirmation) ---- */
  $$("form[data-form]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var ok = true;
      $$("[required]", form).forEach(function (el) {
        var wrap = el.closest("div"), v = el.value.trim(), bad = !v;
        if (!bad && el.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        if (!bad && el.type === "tel") bad = v.replace(/\D/g, "").length < 7;
        if (!bad && el.type === "password") bad = v.length < 6;
        if (!bad && el.type === "checkbox") bad = !el.checked;
        if (wrap) wrap.classList.toggle("invalid", bad); if (bad) ok = false;
      });
      if (!ok) { toast("Please check the highlighted fields"); return; }
      var ok2 = $(".form-success", form);
      if (ok2) { ok2.classList.add("show"); }
      toast(form.dataset.form); form.reset();
      if (ok2) setTimeout(function () { ok2.classList.remove("show"); }, 7000);
    });
    $$("[required]", form).forEach(function (el) { el.addEventListener("input", function () { var w = el.closest("div"); if (w) w.classList.remove("invalid"); }); });
  });

  /* ---- auth tabs & password toggle ---- */
  $$(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".seg button").forEach(function (x) { x.classList.toggle("active", x === b); });
      $$(".auth-panel").forEach(function (p) { p.classList.toggle("active", p.id === b.dataset.panel); });
    });
  });
  if (location.hash === "#register") { var rb = $(".seg button[data-panel=register]"); if (rb) rb.click(); }
  $$(".pw button").forEach(function (b) {
    b.addEventListener("click", function () { var i = b.previousElementSibling, show = i.type === "password"; i.type = show ? "text" : "password"; b.innerHTML = '<i class="fa-regular ' + (show ? "fa-eye-slash" : "fa-eye") + '"></i>'; });
  });

  /* ---- cookie notice ---- */
  var cookie = $(".cookie");
  if (cookie && !store.get("autohub_cookie", false)) {
    setTimeout(function () { cookie.classList.add("show"); }, 1800);
    $$("button", cookie).forEach(function (b) { b.addEventListener("click", function () { store.set("autohub_cookie", true); cookie.classList.remove("show"); }); });
  }

  /* ---- prefill enquiry message on detail pages ---- */
  $$("[data-prefill]").forEach(function (el) { el.value = el.dataset.prefill; });
})();
