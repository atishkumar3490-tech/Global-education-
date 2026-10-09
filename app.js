/* =========================================================
   Global Education Academy - Vanilla JS
   1. Sticky navbar shadow on scroll
   2. Mobile menu toggle
   3. Smart search (suggestions + keyboard + highlight)
   ========================================================= */

(function () {
  'use strict';

  /* ---------- 1. Navbar shadow on scroll ---------- */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ---------- 2. Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the menu after tapping a link (mobile)
  nav.querySelectorAll('.nav__links a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- 3. Smart search ---------- */
  const input = document.getElementById('searchInput');
  const resultsBox = document.getElementById('searchResults');

  /*
    Search index. Add or edit entries as the site grows.
    keywords: extra words that should also match the entry.
  */
  const searchIndex = [
    { title: 'Foundation (Class 9-10)', target: '#courses', keywords: 'class 9 class 10 foundation weekly test study material' },
    { title: 'Target (Class 11-12 | JEE/NEET)', target: '#courses', keywords: 'class 11 class 12 jee neet doubt support advanced modules' },
    { title: 'JEE Preparation', target: '#courses', keywords: 'iit engineering jee main advanced' },
    { title: 'NEET Preparation', target: '#courses', keywords: 'medical mbbs neet biology' },
    { title: 'Fee Structure', target: '#courses', keywords: 'fees price cost payment' },
    { title: 'Toppers & Results', target: '#toppers', keywords: 'result topper rank selection' },
    { title: 'Book Free Counselling', target: '#counselling', keywords: 'counselling demo enquiry contact admission' }
  ];

  let activeIndex = -1; // keyboard-highlighted suggestion

  // Escape user text before using it in a RegExp or innerHTML
  const escapeHTML = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function highlight(text, query) {
    const safe = escapeHTML(text);
    return safe.replace(new RegExp('(' + escapeRegExp(escapeHTML(query)) + ')', 'ig'), '<mark>$1</mark>');
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    activeIndex = -1;

    if (!q) {
      resultsBox.classList.remove('show');
      resultsBox.innerHTML = '';
      return;
    }

    // Every typed word must appear in the title or keywords
    const words = q.split(/\s+/);
    const matches = searchIndex.filter(item => {
      const haystack = (item.title + ' ' + item.keywords).toLowerCase();
      return words.every(w => haystack.includes(w));
    });

    resultsBox.innerHTML = matches.length
      ? matches.map(m => `<li role="option"><a href="${m.target}">${highlight(m.title, q)}</a></li>`).join('')
      : '<li class="no-result">No results found</li>';

    resultsBox.classList.add('show');
  }

  function closeResults() {
    resultsBox.classList.remove('show');
    activeIndex = -1;
  }

  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('focus', () => renderResults(input.value));

  // Keyboard navigation: arrows to move, Enter to open, Esc to close
  input.addEventListener('keydown', e => {
    const items = resultsBox.querySelectorAll('li:not(.no-result)');

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      activeIndex = e.key === 'ArrowDown'
        ? (activeIndex + 1) % items.length
        : (activeIndex - 1 + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('active', i === activeIndex));
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = items[activeIndex] || items[0];
      if (pick) pick.querySelector('a').click();
    } else if (e.key === 'Escape') {
      closeResults();
      input.blur();
    }
  });

  // After choosing a result: clear the box, close the menu, flash the target card
  resultsBox.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;

    input.value = '';
    closeResults();
    nav.classList.remove('open');

    // Briefly highlight a matching course card if one exists
    const label = link.textContent.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
      const hit = label.split(/\W+/).some(w => w.length > 2 && card.dataset.search.includes(w));
      if (hit) {
        card.classList.add('highlight');
        setTimeout(() => card.classList.remove('highlight'), 2000);
      }
    });
  });

  // Close suggestions when clicking outside the search box
  document.addEventListener('click', e => {
    if (!e.target.closest('#search')) closeResults();
  });
})();
