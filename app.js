/* =========================================================
   Global Education Academy - app.js (Vanilla JS)
   1. Sticky navbar shadow & Sidebar drawer
   2. Dark / Light mode persistence
   3. Multi-Screen Router (Home, Marks, Enquiry, Students, Admin)
   4. LocalStorage Database (Students, Weekly Marks, Enquiries)
   5. Printable Marksheet, Leaderboard & Admin CSV Export
   ========================================================= */

(function () {
  'use strict';

  const body = document.body;
  const ADMIN_PIN = '1234'; // Change this PIN anytime

  /* ---------- Safe localStorage helpers ---------- */
  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  /* ---------- Initial Seed Data (So the website works immediately) ---------- */
  const defaultStudents = [
    { roll: 'GEA101', name: 'Aarav Sharma', studentClass: 'Class 10', batch: 'Class 9-10 Foundation', phone: '9876543210', status: 'Active / Paid' },
    { roll: 'GEA102', name: 'Priya Verma', studentClass: 'Class 10', batch: 'Class 9-10 Foundation', phone: '9876543211', status: 'Scholarship Holder' },
    { roll: 'GEA201', name: 'Rohan Raj', studentClass: 'Class 12', batch: 'Class 11-12 Target (JEE/NEET)', phone: '9876543212', status: 'Active / Paid' },
    { roll: 'GEA202', name: 'Ananya Gupta', studentClass: 'Class 12', batch: 'Class 11-12 Target (JEE/NEET)', phone: '9876543213', status: 'Active / Paid' }
  ];

  const defaultMarks = [
    { id: 'M1', roll: 'GEA101', name: 'Aarav Sharma', batch: 'Class 9-10 Foundation', testTitle: 'Weekly Test #01', date: '2026-10-18', maxPerSub: 100, sub1: 95, sub2: 91, sub3: 98, remarks: 'Outstanding accuracy in Science & Maths!' },
    { id: 'M2', roll: 'GEA102', name: 'Priya Verma', batch: 'Class 9-10 Foundation', testTitle: 'Weekly Test #01', date: '2026-10-18', maxPerSub: 100, sub1: 89, sub2: 94, sub3: 92, remarks: 'Very consistent performance.' },
    { id: 'M3', roll: 'GEA201', name: 'Rohan Raj', batch: 'Class 11-12 Target (JEE/NEET)', testTitle: 'Weekly Test #01', date: '2026-10-18', maxPerSub: 100, sub1: 92, sub2: 88, sub3: 96, remarks: 'Strong grip on Calculus & Mechanics.' },
    { id: 'M4', roll: 'GEA202', name: 'Ananya Gupta', batch: 'Class 11-12 Target (JEE/NEET)', testTitle: 'Weekly Test #01', date: '2026-10-18', maxPerSub: 100, sub1: 96, sub2: 94, sub3: 97, remarks: 'Batch Topper! Keep it up.' }
  ];

  let studentsDB = readJSON('gea_students', null);
  if (!studentsDB) {
    studentsDB = defaultStudents;
    writeJSON('gea_students', studentsDB);
  }

  let marksDB = readJSON('gea_marks', null);
  if (!marksDB) {
    marksDB = defaultMarks;
    writeJSON('gea_marks', marksDB);
  }

  let enquiriesDB = readJSON('gea_enquiries', []);

  /* ---------- 1. Sticky Navbar shadow ---------- */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ---------- 2. Sidebar (side drawer) ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  const drawerClose = document.getElementById('drawerClose');

  function isDrawerOpen() {
    return drawer && drawer.classList.contains('open');
  }

  function openDrawer() {
    if (!drawer || !overlay || !menuBtn) return;
    drawer.classList.add('open');
    overlay.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    body.classList.add('no-scroll');
    if (drawerClose) drawerClose.focus();
  }

  function closeDrawer(returnFocus) {
    if (!drawer || !overlay || !menuBtn) return;
    drawer.classList.remove('open');
    overlay.classList.remove('show');
    drawer.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    body.classList.remove('no-scroll');
    if (returnFocus) menuBtn.focus();
  }

  if (menuBtn && drawer && overlay && drawerClose) {
    menuBtn.addEventListener('click', function () {
      if (isDrawerOpen()) closeDrawer(true);
      else openDrawer();
    });
    drawerClose.addEventListener('click', function () { closeDrawer(true); });
    overlay.addEventListener('click', function () { closeDrawer(true); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isDrawerOpen()) closeDrawer(true);
    });
  }

  /* ---------- 3. Dark / Light mode ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');

  function applyTheme(isDark) {
    body.classList.toggle('dark', isDark);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(isDark));
    if (themeLabel) themeLabel.textContent = isDark ? 'Dark mode' : 'Light mode';
  }

  applyTheme(body.classList.contains('dark') || readStore('gea-theme') === 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const makeDark = !body.classList.contains('dark');
      applyTheme(makeDark);
      writeStore('gea-theme', makeDark ? 'dark' : 'light');
    });
  }

  /* ---------- 4. Multi-Screen Router (Opens Separate Screens) ---------- */
  const screens = {
    home: document.getElementById('screen-home'),
    marks: document.getElementById('screen-marks'),
    enquiry: document.getElementById('screen-enquiry'),
    students: document.getElementById('screen-students'),
    admin: document.getElementById('screen-admin')
  };

  function openScreen(screenKey, options) {
    const opts = options || {};
    Object.keys(screens).forEach(function (key) {
      if (screens[key]) {
        screens[key].classList.toggle('active', key === screenKey);
      }
    });

    if (isDrawerOpen()) closeDrawer(false);

    if (screenKey === 'marks') {
      populateTestDropdown();
      renderMarksPortal(opts.searchQuery || '');
    } else if (screenKey === 'students') {
      renderStudentDirectory();
    } else if (screenKey === 'enquiry' && opts.batch) {
      const batchSel = document.getElementById('enqBatch');
      if (batchSel) batchSel.value = opts.batch;
    } else if (screenKey === 'admin') {
      refreshAdminViews();
    }

    if (!opts.skipScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Delegate clicks on any [data-screen] button/link
  document.addEventListener('click', function (e) {
    const screenTrigger = e.target.closest('[data-screen]');
    if (screenTrigger) {
      e.preventDefault();
      const targetScreen = screenTrigger.getAttribute('data-screen');
      const presetBatch = screenTrigger.getAttribute('data-batch');
      openScreen(targetScreen, { batch: presetBatch });
      return;
    }

    // Handle links that scroll to a section on the Home screen (like Courses or Toppers)
    const scrollTrigger = e.target.closest('[data-home-scroll]');
    if (scrollTrigger) {
      e.preventDefault();
      const sectionId = scrollTrigger.getAttribute('data-home-scroll');
      openScreen('home', { skipScroll: true });
      const targetEl = document.getElementById(sectionId);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ---------- 5. Smart Search (Routes to Weekly Test Marks Screen) ---------- */
  document.querySelectorAll('.js-search').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input');
      const query = input ? input.value.trim() : '';
      if (!query) {
        if (input) input.focus();
        return;
      }
      const marksInput = document.getElementById('marksRollInput');
      if (marksInput) marksInput.value = query;
      openScreen('marks', { searchQuery: query });
    });
  });

  /* ---------- 6. Weekly Test Marks Screen Logic ---------- */
  function calcResultStats(record) {
    const total = Number(record.sub1) + Number(record.sub2) + Number(record.sub3);
    const maxTotal = Number(record.maxPerSub || 100) * 3;
    const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : '0.0';
    return { total: total, maxTotal: maxTotal, pct: Number(pct) };
  }

  function populateTestDropdown() {
    const select = document.getElementById('marksTestFilter');
    if (!select) return;
    const currentVal = select.value;
    const uniqueTests = [];
    marksDB.forEach(function (m) {
      if (uniqueTests.indexOf(m.testTitle) === -1) uniqueTests.push(m.testTitle);
    });
    select.innerHTML = '<option value="ALL">All Weekly Tests</option>' +
      uniqueTests.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('');
    if (uniqueTests.indexOf(currentVal) !== -1) select.value = currentVal;
  }

  function renderMarksPortal(overrideQuery) {
    const rollInput = document.getElementById('marksRollInput');
    const batchFilter = document.getElementById('marksBatchFilter');
    const testFilter = document.getElementById('marksTestFilter');
    const tbody = document.getElementById('marksTableBody');
    const countBadge = document.getElementById('marksCountBadge');
    const leaderboardGrid = document.getElementById('leaderboardGrid');

    if (overrideQuery && rollInput) rollInput.value = overrideQuery;

    const query = (rollInput ? rollInput.value : '').trim().toLowerCase();
    const batchVal = batchFilter ? batchFilter.value : 'ALL';
    const testVal = testFilter ? testFilter.value : 'ALL';

    // Filter marks
    const filtered = marksDB.filter(function (m) {
      const matchQuery = !query ||
        m.roll.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query);
      const matchBatch = batchVal === 'ALL' || m.batch === batchVal;
      const matchTest = testVal === 'ALL' || m.testTitle === testVal;
      return matchQuery && matchBatch && matchTest;
    });

    // Sort by percentage descending
    filtered.sort(function (a, b) {
      return calcResultStats(b).pct - calcResultStats(a).pct;
    });

    // Render Top 3 Leaderboard
    if (leaderboardGrid) {
      const topThree = filtered.slice(0, 3);
      if (!topThree.length) {
        leaderboardGrid.innerHTML = '<p style="color: var(--muted);">No test records match your filter.</p>';
      } else {
        leaderboardGrid.innerHTML = topThree.map(function (item, idx) {
          const st = calcResultStats(item);
          return '<div class="leader-card">' +
            '<div class="leader-card__rank">#' + (idx + 1) + '</div>' +
            '<div class="leader-card__info">' +
              '<h4>' + item.name + ' <small>(' + item.roll + ')</small></h4>' +
              '<p>' + item.batch + ' &bull; ' + item.testTitle + '</p>' +
            '</div>' +
            '<div class="leader-card__score">' + st.pct + '%</div>' +
          '</div>';
        }).join('');
      }
    }

    if (countBadge) countBadge.textContent = filtered.length + ' Result(s)';

    if (tbody) {
      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--muted);">No matching test result found. Try Roll No GEA101 or GEA201.</td></tr>';
      } else {
        tbody.innerHTML = filtered.map(function (item) {
          const st = calcResultStats(item);
          return '<tr>' +
            '<td><strong>' + item.roll + '</strong></td>' +
            '<td>' + item.name + '</td>' +
            '<td>' + item.batch + '</td>' +
            '<td>' + item.testTitle + ' <small style="color:var(--muted);">(' + item.date + ')</small></td>' +
            '<td><strong>' + st.total + '</strong> / ' + st.maxTotal + '</td>' +
            '<td><span class="tag-badge tag-badge--success">' + st.pct + '%</span></td>' +
            '<td><button type="button" class="btn btn--cta btn--sm" data-view-mark="' + item.id + '">View Marksheet</button></td>' +
          '</tr>';
        }).join('');
      }
    }

    // Auto-open marksheet if exact roll number searched
    if (query && filtered.length === 1) {
      showDigitalMarksheet(filtered[0].id);
    }
  }

  function showDigitalMarksheet(markId) {
    const view = document.getElementById('marksheetView');
    if (!view) return;
    const record = marksDB.find(function (m) { return m.id === markId; });
    if (!record) return;

    const st = calcResultStats(record);
    const isFoundation = record.batch.includes('9-10');
    const sub1Label = isFoundation ? 'Science' : 'Physics';
    const sub2Label = isFoundation ? 'Social Science' : 'Chemistry';
    const sub3Label = isFoundation ? 'Mathematics' : 'Maths / Biology';
    const gradeBadge = st.pct >= 90 ? 'Distinction (A+)' : (st.pct >= 75 ? 'First Division (A)' : 'Passed (B)');

    view.classList.remove('hidden');
    view.innerHTML =
      '<div class="marksheet-head">' +
        '<div>' +
          '<h3 style="color: var(--heading); font-size: 1.35rem;">GLOBAL EDUCATION ACADEMY</h3>' +
          '<p style="font-size: 0.85rem; color: var(--muted);">Official Weekly Test Statement of Marks</p>' +
        '</div>' +
        '<div class="no-print" style="display:flex; gap: 8px;">' +
          '<button type="button" class="btn btn--cta btn--sm" onclick="window.print()">&#128424; Print / Save PDF</button>' +
          '<button type="button" class="btn btn--outline btn--sm" id="closeMarksheetBtn">Close</button>' +
        '</div>' +
      '</div>' +
      '<div class="marksheet-meta">' +
        '<div><span>Student Name</span><strong>' + record.name + '</strong></div>' +
        '<div><span>Roll Number</span><strong>' + record.roll + '</strong></div>' +
        '<div><span>Batch</span><strong>' + record.batch + '</strong></div>' +
        '<div><span>Test &amp; Date</span><strong>' + record.testTitle + ' (' + record.date + ')</strong></div>' +
      '</div>' +
      '<div class="table-responsive">' +
        '<table class="data-table" style="min-width: 100%;">' +
          '<thead><tr><th>Subject</th><th>Max Marks</th><th>Marks Obtained</th><th>Status</th></tr></thead>' +
          '<tbody>' +
            '<tr><td>' + sub1Label + '</td><td>' + record.maxPerSub + '</td><td><strong>' + record.sub1 + '</strong></td><td>Pass</td></tr>' +
            '<tr><td>' + sub2Label + '</td><td>' + record.maxPerSub + '</td><td><strong>' + record.sub2 + '</strong></td><td>Pass</td></tr>' +
            '<tr><td>' + sub3Label + '</td><td>' + record.maxPerSub + '</td><td><strong>' + record.sub3 + '</strong></td><td>Pass</td></tr>' +
            '<tr style="background: var(--bg-alt); font-weight: 700;">' +
              '<td>TOTAL SCORE</td><td>' + st.maxTotal + '</td><td>' + st.total + ' (' + st.pct + '%)</td><td>' + gradeBadge + '</td>' +
            '</tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<div class="progress-bar"><div class="progress-bar__fill" style="width: ' + Math.min(100, st.pct) + '%;"></div></div>' +
      '<p style="font-size: 0.9rem;"><strong>Faculty Remarks:</strong> ' + (record.remarks || 'Good effort, keep practicing regularly.') + '</p>';

    view.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const closeBtn = document.getElementById('closeMarksheetBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        view.classList.add('hidden');
      });
    }
  }

  const marksSearchForm = document.getElementById('marksSearchForm');
  if (marksSearchForm) {
    marksSearchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      renderMarksPortal();
    });
    ['marksBatchFilter', 'marksTestFilter'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', function () { renderMarksPortal(); });
    });
  }

  document.addEventListener('click', function (e) {
    const viewBtn = e.target.closest('[data-view-mark]');
    if (viewBtn) {
      showDigitalMarksheet(viewBtn.getAttribute('data-view-mark'));
    }
  });

  /* ---------- 7. Admission & Counselling Enquiry Screen Logic ---------- */
  const enquiryForm = document.getElementById('enquiryForm');
  const enquirySuccessBox = document.getElementById('enquirySuccessBox');

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const refId = 'ENQ-' + Math.floor(1000 + Math.random() * 9000);
      const today = new Date().toISOString().split('T')[0];

      const newEnq = {
        id: refId,
        date: today,
        name: document.getElementById('enqName').value.trim(),
        parent: document.getElementById('enqParent').value.trim(),
        phone: document.getElementById('enqPhone').value.trim(),
        studentClass: document.getElementById('enqClass').value,
        batch: document.getElementById('enqBatch').value,
        school: document.getElementById('enqSchool').value.trim(),
        msg: document.getElementById('enqMsg').value.trim(),
        status: 'Pending Call'
      };

      enquiriesDB.unshift(newEnq);
      writeJSON('gea_enquiries', enquiriesDB);

      if (enquirySuccessBox) {
        const waText = encodeURIComponent(
          'Hello Global Education Academy, I submitted an Admission Enquiry (Ref: ' + newEnq.id + ').\n' +
          'Student: ' + newEnq.name + '\nClass: ' + newEnq.studentClass + '\nBatch: ' + newEnq.batch + '\nPhone: ' + newEnq.phone
        );
        enquirySuccessBox.classList.remove('hidden');
        enquirySuccessBox.innerHTML =
          '<h4>&#10004; Enquiry Registered Successfully!</h4>' +
          '<p>Reference ID: <strong>' + newEnq.id + '</strong> | Student: <strong>' + newEnq.name + '</strong></p>' +
          '<p style="font-size: 0.9rem; margin-top: 6px;">Your details have been saved in our admission database. Our counsellor will call you shortly on <strong>' + newEnq.phone + '</strong>.</p>' +
          '<div style="margin-top: 12px;">' +
            '<a href="https://wa.me/?text=' + waText + '" target="_blank" rel="noopener" class="btn btn--primary btn--sm" style="width: auto;">Send Copy on WhatsApp</a>' +
          '</div>';
      }

      enquiryForm.reset();
    });
  }

  /* ---------- 8. Student Directory Screen Logic ---------- */
  function renderStudentDirectory() {
    const dirBody = document.getElementById('studentDirectoryBody');
    const searchInput = document.getElementById('dirSearchInput');
    const batchSelect = document.getElementById('dirBatchSelect');
    if (!dirBody) return;

    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const batchVal = batchSelect ? batchSelect.value : 'ALL';

    const list = studentsDB.filter(function (s) {
      const matchQuery = !query || s.roll.toLowerCase().includes(query) || s.name.toLowerCase().includes(query);
      const matchBatch = batchVal === 'ALL' || s.batch === batchVal;
      return matchQuery && matchBatch;
    });

    if (!list.length) {
      dirBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--muted);">No matching student records found.</td></tr>';
      return;
    }

    dirBody.innerHTML = list.map(function (s) {
      return '<tr>' +
        '<td><strong>' + s.roll + '</strong></td>' +
        '<td>' + s.name + '</td>' +
        '<td>' + s.studentClass + '</td>' +
        '<td>' + s.batch + '</td>' +
        '<td><span class="tag-badge tag-badge--success">' + s.status + '</span></td>' +
        '<td><button type="button" class="btn btn--outline btn--sm" data-check-roll="' + s.roll + '">Check Marks &rarr;</button></td>' +
      '</tr>';
    }).join('');
  }

  const dirSearchInput = document.getElementById('dirSearchInput');
  const dirBatchSelect = document.getElementById('dirBatchSelect');
  if (dirSearchInput) dirSearchInput.addEventListener('input', renderStudentDirectory);
  if (dirBatchSelect) dirBatchSelect.addEventListener('change', renderStudentDirectory);

  document.addEventListener('click', function (e) {
    const rollBtn = e.target.closest('[data-check-roll]');
    if (rollBtn) {
      const roll = rollBtn.getAttribute('data-check-roll');
      openScreen('marks', { searchQuery: roll });
    }
  });

  /* ---------- 9. Admin & Faculty Portal Logic ---------- */
  const adminLockBox = document.getElementById('adminLockBox');
  const adminDashboard = document.getElementById('adminDashboard');
  const adminPinForm = document.getElementById('adminPinForm');
  const adminPinInput = document.getElementById('adminPinInput');
  const adminPinError = document.getElementById('adminPinError');
  const lockAdminBtn = document.getElementById('lockAdminBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  function setAdminUnlocked(unlocked) {
    if (!adminLockBox || !adminDashboard) return;
    adminLockBox.classList.toggle('hidden', unlocked);
    adminDashboard.classList.toggle('hidden', !unlocked);
    if (unlocked) refreshAdminViews();
  }

  if (adminPinForm) {
    adminPinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const entered = adminPinInput ? adminPinInput.value.trim() : '';
      if (entered === ADMIN_PIN) {
        if (adminPinError) adminPinError.classList.add('hidden');
        adminPinInput.value = '';
        setAdminUnlocked(true);
      } else {
        if (adminPinError) adminPinError.classList.remove('hidden');
      }
    });
  }

  if (lockAdminBtn) {
    lockAdminBtn.addEventListener('click', function () { setAdminUnlocked(false); });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      setAdminUnlocked(false);
      closeDrawer(true);
      openScreen('home');
    });
  }

  // Admin Tabs switching
  document.querySelectorAll('.admin-tab').forEach(function (tabBtn) {
    tabBtn.addEventListener('click', function () {
      const targetId = tabBtn.getAttribute('data-tab');
      document.querySelectorAll('.admin-tab').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('active'); });
      tabBtn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });

  function refreshAdminViews() {
    // Update stats
    const statStudents = document.getElementById('statStudents');
    const statTests = document.getElementById('statTests');
    const statEnquiries = document.getElementById('statEnquiries');
    if (statStudents) statStudents.textContent = studentsDB.length;
    if (statTests) statTests.textContent = marksDB.length;
    if (statEnquiries) statEnquiries.textContent = enquiriesDB.length;

    // Populate Student Select in Upload Marks Form
    const markStudentSelect = document.getElementById('markStudentSelect');
    if (markStudentSelect) {
      markStudentSelect.innerHTML = studentsDB.map(function (s) {
        return '<option value="' + s.roll + '">' + s.roll + ' - ' + s.name + ' (' + s.batch + ')</option>';
      }).join('');
    }

    // Set default date to today
    const markTestDate = document.getElementById('markTestDate');
    if (markTestDate && !markTestDate.value) {
      markTestDate.value = new Date().toISOString().split('T')[0];
    }

    // Render Admin Marks Table
    const adminMarksBody = document.getElementById('adminMarksBody');
    if (adminMarksBody) {
      adminMarksBody.innerHTML = marksDB.map(function (m) {
        const st = calcResultStats(m);
        return '<tr>' +
          '<td><strong>' + m.roll + '</strong></td>' +
          '<td>' + m.name + '</td>' +
          '<td>' + m.testTitle + '</td>' +
          '<td>' + m.date + '</td>' +
          '<td>' + st.total + ' / ' + st.maxTotal + '</td>' +
          '<td>' + st.pct + '%</td>' +
          '<td><button type="button" class="btn btn--danger btn--sm" data-del-mark="' + m.id + '">Delete</button></td>' +
        '</tr>';
      }).join('');
    }

    // Render Admin Students Table
    const adminStudentsBody = document.getElementById('adminStudentsBody');
    if (adminStudentsBody) {
      adminStudentsBody.innerHTML = studentsDB.map(function (s) {
        return '<tr>' +
          '<td><strong>' + s.roll + '</strong></td>' +
          '<td>' + s.name + '</td>' +
          '<td>' + s.studentClass + '</td>' +
          '<td>' + s.batch + '</td>' +
          '<td>' + s.phone + '</td>' +
          '<td>' + s.status + '</td>' +
          '<td><button type="button" class="btn btn--danger btn--sm" data-del-student="' + s.roll + '">Delete</button></td>' +
        '</tr>';
      }).join('');
    }

    // Render Admin Enquiries Table
    const adminEnquiriesBody = document.getElementById('adminEnquiriesBody');
    if (adminEnquiriesBody) {
      if (!enquiriesDB.length) {
        adminEnquiriesBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--muted);">No enquiries submitted yet.</td></tr>';
      } else {
        adminEnquiriesBody.innerHTML = enquiriesDB.map(function (q) {
          return '<tr>' +
            '<td><strong>' + q.id + '</strong></td>' +
            '<td>' + q.date + '</td>' +
            '<td>' + q.name + '<br><small style="color:var(--muted);">Parent: ' + q.parent + '</small></td>' +
            '<td><a href="tel:' + q.phone + '" style="color:var(--heading); font-weight:600;">' + q.phone + '</a></td>' +
            '<td>' + q.studentClass + '<br><small>' + q.batch + '</small></td>' +
            '<td>' + (q.msg || '-') + '</td>' +
            '<td><span class="tag-badge">' + q.status + '</span></td>' +
            '<td><button type="button" class="btn btn--outline btn--sm" data-toggle-enq="' + q.id + '">Mark Contacted</button></td>' +
          '</tr>';
        }).join('');
      }
    }
  }

  // Add Weekly Test Marks Form
  const addMarksForm = document.getElementById('addMarksForm');
  if (addMarksForm) {
    addMarksForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const roll = document.getElementById('markStudentSelect').value;
      const stu = studentsDB.find(function (s) { return s.roll === roll; });
      if (!stu) return;

      const newMark = {
        id: 'M' + Date.now(),
        roll: stu.roll,
        name: stu.name,
        batch: stu.batch,
        testTitle: document.getElementById('markTestTitle').value.trim(),
        date: document.getElementById('markTestDate').value,
        maxPerSub: Number(document.getElementById('markMaxPerSub').value) || 100,
        sub1: Number(document.getElementById('markSub1').value) || 0,
        sub2: Number(document.getElementById('markSub2').value) || 0,
        sub3: Number(document.getElementById('markSub3').value) || 0,
        remarks: document.getElementById('markRemarks').value.trim()
      };

      marksDB.unshift(newMark);
      writeJSON('gea_marks', marksDB);
      addMarksForm.reset();
      refreshAdminViews();
      alert('Weekly Test Result published for ' + stu.name + ' (' + stu.roll + ')!');
    });
  }

  // Add Student Form
  const addStudentForm = document.getElementById('addStudentForm');
  if (addStudentForm) {
    addStudentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const roll = document.getElementById('stuRoll').value.trim().toUpperCase();
      if (studentsDB.some(function (s) { return s.roll.toUpperCase() === roll; })) {
        alert('A student with Roll No ' + roll + ' already exists!');
        return;
      }

      const newStu = {
        roll: roll,
        name: document.getElementById('stuName').value.trim(),
        studentClass: document.getElementById('stuClass').value,
        batch: document.getElementById('stuBatch').value,
        phone: document.getElementById('stuPhone').value.trim(),
        status: document.getElementById('stuFee').value
      };

      studentsDB.push(newStu);
      writeJSON('gea_students', studentsDB);
      addStudentForm.reset();
      refreshAdminViews();
      alert('Student ' + newStu.name + ' (' + newStu.roll + ') added successfully!');
    });
  }

  // Admin Delete / Status Actions
  document.addEventListener('click', function (e) {
    const delMark = e.target.closest('[data-del-mark]');
    if (delMark) {
      const id = delMark.getAttribute('data-del-mark');
      marksDB = marksDB.filter(function (m) { return m.id !== id; });
      writeJSON('gea_marks', marksDB);
      refreshAdminViews();
      return;
    }

    const delStu = e.target.closest('[data-del-student]');
    if (delStu) {
      const roll = delStu.getAttribute('data-del-student');
      studentsDB = studentsDB.filter(function (s) { return s.roll !== roll; });
      writeJSON('gea_students', studentsDB);
      refreshAdminViews();
      return;
    }

    const toggleEnq = e.target.closest('[data-toggle-enq]');
    if (toggleEnq) {
      const id = toggleEnq.getAttribute('data-toggle-enq');
      enquiriesDB.forEach(function (q) {
        if (q.id === id) q.status = q.status === 'Contacted' ? 'Pending Call' : 'Contacted';
      });
      writeJSON('gea_enquiries', enquiriesDB);
      refreshAdminViews();
    }
  });

  /* ---------- 10. CSV Export Helpers ---------- */
  function downloadCSV(filename, rows) {
    const csvContent = rows.map(function (r) {
      return r.map(function (cell) {
        return '"' + String(cell === undefined || cell === null ? '' : cell).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const exportMarksCsvBtn = document.getElementById('exportMarksCsvBtn');
  if (exportMarksCsvBtn) {
    exportMarksCsvBtn.addEventListener('click', function () {
      const rows = [['Roll No', 'Student Name', 'Batch', 'Test Name', 'Date', 'Sub 1', 'Sub 2', 'Sub 3', 'Remarks']];
      marksDB.forEach(function (m) {
        rows.push([m.roll, m.name, m.batch, m.testTitle, m.date, m.sub1, m.sub2, m.sub3, m.remarks]);
      });
      downloadCSV('GEA_Weekly_Marks.csv', rows);
    });
  }

  const exportStudentsCsvBtn = document.getElementById('exportStudentsCsvBtn');
  if (exportStudentsCsvBtn) {
    exportStudentsCsvBtn.addEventListener('click', function () {
      const rows = [['Roll No', 'Student Name', 'Class', 'Batch', 'Parent Phone', 'Status']];
      studentsDB.forEach(function (s) {
        rows.push([s.roll, s.name, s.studentClass, s.batch, s.phone, s.status]);
      });
      downloadCSV('GEA_Students_List.csv', rows);
    });
  }

  const exportEnquiriesCsvBtn = document.getElementById('exportEnquiriesCsvBtn');
  if (exportEnquiriesCsvBtn) {
    exportEnquiriesCsvBtn.addEventListener('click', function () {
      const rows = [['Ref ID', 'Date', 'Student Name', 'Parent Name', 'Phone', 'Class', 'Batch', 'Message', 'Status']];
      enquiriesDB.forEach(function (q) {
        rows.push([q.id, q.date, q.name, q.parent, q.phone, q.studentClass, q.batch, q.msg, q.status]);
      });
      downloadCSV('GEA_Admission_Enquiries.csv', rows);
    });
  }

})();
