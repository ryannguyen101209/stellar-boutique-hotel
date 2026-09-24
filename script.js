// ============================================================================
// Stellar Boutique Hotel — behavior
// Every interactive element here does something real: header state, mobile
// menu (keyboard + escape supported), scroll-spy nav, reveal-on-scroll,
// and a reservation form that builds a real mailto: with the entered details
// (no fabricated "booking confirmed" — we're honest that a human replies).
// ============================================================================

(function () {
  "use strict";

  // ---- Room data (kept out of markup so the room-row alternating layout
  // is generated once, consistently, instead of hand-duplicated HTML) ----
  var ROOMS = [
    {
      name: "Superior Room",
      desc: "Lựa chọn gọn gàng, phù hợp cho khách đi công tác hoặc lưu trú ngắn ngày. Không gian được bố trí tối ưu, đầy đủ tiện nghi cơ bản.",
      tags: ["1 giường đôi", "Phù hợp 1-2 khách"],
      grad: ["#e7dfd0", "#547d5f"]
    },
    {
      name: "Deluxe Queen Room",
      desc: "Phòng rộng rãi hơn với giường Queen, phù hợp cho cặp đôi hoặc khách muốn thêm không gian nghỉ ngơi.",
      tags: ["1 giường Queen", "Phù hợp 2 khách"],
      grad: ["#f2ece1", "#3e6349"]
    },
    {
      name: "Deluxe King Room",
      desc: "Không gian thoáng đãng với giường King cỡ lớn, thích hợp cho kỳ nghỉ thư giãn hoặc dịp đặc biệt.",
      tags: ["1 giường King", "Phù hợp 2 khách"],
      grad: ["#e7dfd0", "#2d4a37"]
    },
    {
      name: "Deluxe Twin Room",
      desc: "Hai giường đơn tách biệt, lựa chọn linh hoạt cho bạn bè, đồng nghiệp đi công tác cùng nhau.",
      tags: ["2 giường đơn", "Phù hợp 2 khách"],
      grad: ["#f2ece1", "#547d5f"]
    },
    {
      name: "Suite",
      desc: "Hạng phòng cao cấp nhất với không gian sinh hoạt riêng biệt, dành cho khách cần sự riêng tư và thoải mái tối đa.",
      tags: ["Khu vực sinh hoạt riêng", "Phù hợp 2-3 khách"],
      grad: ["#e7dfd0", "#16241c"]
    },
    {
      name: "Family Room",
      desc: "Không gian rộng rãi cho gia đình, bố trí linh hoạt để phù hợp với cả người lớn và trẻ nhỏ.",
      tags: ["Bố trí linh hoạt", "Phù hợp 3-4 khách"],
      grad: ["#f2ece1", "#3e6349"]
    }
  ];

  function roomArtSVG(grad, seed) {
    var id = "rg" + seed;
    return (
      '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + grad[0] + '"/>' +
      '<stop offset="100%" stop-color="' + grad[1] + '"/>' +
      "</linearGradient></defs>" +
      '<rect width="400" height="300" fill="url(#' + id + ')"/>' +
      '<g stroke="#16241c" stroke-opacity="0.15" stroke-width="1" fill="none">' +
      '<rect x="40" y="40" width="320" height="220" rx="2"/>' +
      '<line x1="40" y1="150" x2="360" y2="150"/>' +
      '<line x1="150" y1="40" x2="150" y2="260"/>' +
      '<line x1="260" y1="40" x2="260" y2="260"/>' +
      "</g>" +
      "</svg>"
    );
  }

  function renderRooms() {
    var list = document.getElementById("roomList");
    if (!list) return;
    var html = ROOMS.map(function (room, i) {
      return (
        '<article class="room-row reveal">' +
        '<div class="room-art">' + roomArtSVG(room.grad, i) + "</div>" +
        '<div class="room-body">' +
        "<h3>" + room.name + "</h3>" +
        "<p>" + room.desc + "</p>" +
        '<div class="room-tags">' +
        room.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("") +
        "</div>" +
        '<div class="room-cta">' +
        '<a href="#reserve" class="btn btn-primary btn-sm" data-room="' + room.name + '">Kiểm tra giá phòng</a>' +
        "</div>" +
        "</div>" +
        "</article>"
      );
    }).join("");
    list.innerHTML = html;

    // Clicking "Kiểm tra giá phòng" on a room pre-selects it in the form.
    list.querySelectorAll("[data-room]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var select = document.getElementById("fRoom");
        if (select) select.value = btn.getAttribute("data-room");
      });
    });
  }

  // ---- Header scroll state ----
  function initHeaderScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 8) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- Mobile nav toggle (keyboard + escape supported) ----
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var panel = document.getElementById("mobilePanel");
    if (!toggle || !panel) return;

    function close() {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Mở menu");
    }
    function open() {
      panel.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Đóng menu");
    }
    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.contains("is-open");
      if (isOpen) close(); else open();
    });
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        close();
        toggle.focus();
      }
    });
  }

  // ---- Scroll-spy: highlight the nav link for the section in view ----
  function initScrollSpy() {
    var sections = ["about", "rooms", "amenities", "offers", "reserve"]
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var links = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!sections.length || !links.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }

  // ---- Reveal on scroll (subtle, purposeful: draws eye to new section) ----
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  // ---- Reservation form: validates, then opens a prefilled mailto: ----
  function initReserveForm() {
    var form = document.getElementById("reserveForm");
    var status = document.getElementById("formStatus");
    if (!form || !status) return;

    function showStatus(message, type) {
      status.textContent = message;
      status.className = "form-status is-visible " + (type === "error" ? "is-error" : "is-success");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var email = form.email.value.trim();
      var checkin = form.checkin.value;
      var checkout = form.checkout.value;
      var room = form.room.value;
      var note = form.note.value.trim();

      if (!name || !phone || !email || !checkin || !checkout) {
        showStatus("Vui lòng điền đầy đủ họ tên, số điện thoại, email và ngày nhận/trả phòng.", "error");
        return;
      }
      if (checkout <= checkin) {
        showStatus("Ngày trả phòng phải sau ngày nhận phòng.", "error");
        return;
      }

      var subject = "Yêu cầu đặt phòng — " + room + " (" + checkin + " đến " + checkout + ")";
      var bodyLines = [
        "Họ và tên: " + name,
        "Số điện thoại: " + phone,
        "Email: " + email,
        "Hạng phòng quan tâm: " + room,
        "Ngày nhận phòng: " + checkin,
        "Ngày trả phòng: " + checkout,
        "Ghi chú: " + (note || "(không có)")
      ];
      var mailto =
        "mailto:sabinaresident@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailto;
      showStatus("Đã mở ứng dụng email với thông tin của bạn. Vui lòng bấm gửi trong ứng dụng email để hoàn tất yêu cầu.", "success");
    });
  }

  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderRooms();
    initHeaderScroll();
    initMobileNav();
    initScrollSpy();
    initReveal();
    initReserveForm();
    initYear();
  });
})();
