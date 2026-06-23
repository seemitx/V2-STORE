// ============================================================
// layout.js - Shared Layout (Sidebar + Topbar) — Premium Theme
// ============================================================

function renderLayout(pageTitle, activeNav) {
  const user = requireAuth();
  if (!user) return;

  const isAdmin = user.role === 'admin';

  // SVG icon helper
  const icons = {
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    products:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    stockin:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`,
    stockout:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="12" x2="12" y2="3"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`,
    reports:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    logout:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  };

  const sidebarHTML = `
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">📦</div>
        <div>
          <div class="brand-name">IMS Stocker</div>
          <div class="brand-sub">จัดการสต๊อกสินค้า</div>
        </div>
      </div>
      <div class="sidebar-nav">
        <div class="nav-section-label">หลัก</div>
        <a href="index.html" class="sidebar-link ${activeNav==='dashboard'?'active':''}">
          <span class="nav-icon">${icons.dashboard}</span> Dashboard
        </a>
        <a href="products.html" class="sidebar-link ${activeNav==='products'?'active':''}">
          <span class="nav-icon">${icons.products}</span> สินค้า
        </a>
        <div class="nav-section-label">การเคลื่อนไหว</div>
        <a href="stock-in.html" class="sidebar-link ${activeNav==='stockin'?'active':''}">
          <span class="nav-icon">${icons.stockin}</span> รับสินค้าเข้า
        </a>
        <a href="stock-out.html" class="sidebar-link ${activeNav==='stockout'?'active':''}">
          <span class="nav-icon">${icons.stockout}</span> เบิกสินค้าออก
        </a>
        <div class="nav-section-label">รายงาน</div>
        <a href="reports.html" class="sidebar-link ${activeNav==='reports'?'active':''}">
          <span class="nav-icon">${icons.reports}</span> รายงาน
        </a>
        <div class="nav-section-label">ระบบ</div>
        <a href="#" class="sidebar-link" onclick="doLogout()">
          <span class="nav-icon">${icons.logout}</span> ออกจากระบบ
        </a>
      </div>
      <div class="sidebar-footer">
        <span style="font-size:11px;opacity:0.4;">v1.0 • IMS Stocker Premium</span>
      </div>
    </nav>
  `;

  const moonIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const menuIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;

  const topbarHTML = `
    <div class="topbar">
      <button class="sidebar-toggle" onclick="toggleSidebar()">${menuIcon}</button>
      <span class="topbar-title">${pageTitle}</span>
      <div class="topbar-actions">
        <label class="dark-toggle" title="สลับ Dark / Light Mode">
          ${moonIcon}
          <div class="form-check form-switch mb-0 ms-1">
            <input class="form-check-input" type="checkbox" id="darkModeToggle">
          </div>
        </label>
        <div class="user-badge">
          <div class="user-avatar" id="userAvatar">U</div>
          <span id="userInfo">User</span>
        </div>
      </div>
    </div>
  `;

  // สร้าง layout
  document.body.insertAdjacentHTML('afterbegin', `
    <div id="globalLoader" style="display:none;"><div class="loader-spinner"></div></div>
    <div class="app-layout">
      ${sidebarHTML}
      <div class="main-content">
        ${topbarHTML}
        <div class="page-content" id="pageContent"></div>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"
         style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);z-index:999;"></div>
  `);

  renderUserInfo();
  initDarkMode();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
}

function doLogout() {
  clearSession();
  window.location.href = 'login.html';
}
