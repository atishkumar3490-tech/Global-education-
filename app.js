/* =========================================================
   Global Education Academy - Vanilla JS
   1. Sticky navbar shadow on scroll
   2. Sidebar (side drawer) open / close
   3. Dark / Light mode (Settings > Appearance)
   4. Smart search (Enter shows an alert)
   5. Placeholder actions (Logout, "#" links)
   ========================================================= */

(function () {
  'use strict';

  const body = document.body;

  /* ---------- Small helpers: safe localStorage access ---------- */
  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  /* ---------- 1. Navbar shadow on scroll ---------- */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ---------- 2. Sidebar (side drawer) ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  const drawerClose = document.getElementById('drawerClose');

  function isDrawerOpen() {
    return drawer.classList.contains('open');
  }

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    body.classList.add('no-scroll');
    drawerClose.focus();                       // move focus into the drawer
  }

  function closeDrawer(returnFocus) {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
    drawer.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    body.classList.remove('no-scroll');
    if (returnFocus) menuBtn.focus();
  }

  menuBtn.addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', function () { closeDrawer(true); });
  overlay.addEventListener('click', function () { closeDrawer(true); });

  // Close with the Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isDrawerOpen()) closeDrawer(true);
  });

  // Keep keyboard focus inside the drawer while it is open
  drawer.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    const focusable = Array.prototype.filter.call(
      drawer.querySelectorAll('a[href], button, input'),
      function (el) { return el.offsetParent !== null; }   // skip hidden elements
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Close the drawer after choosing a page link (Settings and Logout are buttons, handled separately)
  drawer.querySelectorAll('a.drawer__item').forEach(function (link) {
    link.addEventListener('click', function () { closeDrawer(false); });
  });

  /* ---------- 3. Dark / Light mode ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');

  function applyTheme(isDark) {
    body.classList.toggle('dark', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeLabel.textContent = isDark ? 'Dark mode' : 'Light mode';
  }

  // Sync the toggle with the theme already applied before first paint
  applyTheme(body.classList.contains('dark') || readStore('gea-theme') === 'dark');

  themeToggle.addEventListener('click', function () {
    const makeDark = !body.classList.contains('dark');
    applyTheme(makeDark);
    writeStore('gea-theme', makeDark ? 'dark' : 'light');   // remember the choice
  });

  /* ---------- 4. Smart search ---------- */
  // Works for every search form (navbar on desktop, sidebar on mobile).
  // Pressing Enter submits the form and shows the alert.
  document.querySelectorAll('.js-search').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const input = form.querySelector('input');
      const query = input.value.trim();

      if (!query) {            // nothing typed: just keep the cursor in the box
        input.focus();
        return;
      }

      if (isDrawerOpen()) closeDrawer(false);
      alert('Searching study material for: ' + query);
    });
  });

  /* ---------- 5. Placeholder actions ---------- */
  // Logout: connect this to your real logout logic later.
  document.getElementById('logoutBtn').addEventListener('click', function () {
    closeDrawer(true);
  });

  // Links with href="#" (like Student Login) should not jump the page to the top.
  document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
