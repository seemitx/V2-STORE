// ============================================================
// dashboard.js — Premium UI
// ============================================================

let movementChart = null;

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('Dashboard', 'dashboard');
  loadDashboard();
});

async function loadDashboard() {
  const container = document.getElementById('pageContent');
  container.innerHTML = getSkeletonHTML();

  const result = await apiGetDashboard();

  if (!result.success) {
    container.innerHTML = renderError(result.message);
    return;
  }

  const d = result.data;
  container.innerHTML = getDashboardHTML(d);
  renderMovementChart(d.chart);
  renderCategoryBars(d.categories);
  renderLowStockList(d.lowStockItems);
}

function getDashboardHTML(d) {
  const svgBox     = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
  const svgWarn    = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  const svgBan     = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
  const svgMoney   = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
  const svgIn      = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`;
  const svgOut     = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="12" x2="12" y2="3"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`;
  const svgAdd     = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
  const svgReport  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-header-title">Dashboard</div>
        <div class="page-header-sub">ภาพรวมระบบสต๊อกสินค้า</div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-xl-3">
        <div class="stat-card blue">
          <div class="stat-icon blue">${svgBox}</div>
          <div class="stat-info">
            <div class="stat-value">${formatNumber(d.totalProducts)}</div>
            <div class="stat-label">สินค้าทั้งหมด</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="stat-card orange">
          <div class="stat-icon orange">${svgWarn}</div>
          <div class="stat-info">
            <div class="stat-value">${formatNumber(d.lowStock)}</div>
            <div class="stat-label">สินค้าใกล้หมด</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="stat-card red">
          <div class="stat-icon red">${svgBan}</div>
          <div class="stat-info">
            <div class="stat-value">${formatNumber(d.outOfStock)}</div>
            <div class="stat-label">หมดสต๊อก</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="stat-card green">
          <div class="stat-icon green">${svgMoney}</div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:18px;line-height:1.3;">${formatCurrency(d.totalValue)}</div>
            <div class="stat-label">มูลค่าสินค้ารวม</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock Alert -->
    ${d.lowStock > 0 ? `
    <div class="alert-low-stock mb-4">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <div>
        <strong>แจ้งเตือน:</strong> มีสินค้า <strong style="color:#F59E0B;">${d.lowStock} รายการ</strong>ที่ใกล้หมดสต๊อก
        <a href="products.html?filter=low" class="ms-2" style="color:#F59E0B;text-decoration:underline;font-weight:600;">ดูรายการ →</a>
      </div>
    </div>` : ''}

    <!-- Charts Row -->
    <div class="row g-3 mb-4">
      <div class="col-xl-8">
        <div class="card card-accent-blue h-100">
          <div class="card-header">
            <span class="card-title">การเคลื่อนไหวสินค้า 7 วันล่าสุด</span>
            <span style="font-size:12px;color:var(--text-muted);">รับเข้า vs เบิกออก</span>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="movementChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-4">
        <div class="card card-accent-cyan h-100">
          <div class="card-header">
            <span class="card-title">หมวดหมู่สินค้า</span>
          </div>
          <div class="card-body" id="categoryBars">
            <div class="empty-state"><p style="font-size:13px;">ไม่มีข้อมูล</p></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock + Quick Actions -->
    <div class="row g-3">
      <div class="col-xl-7">
        <div class="card card-accent-red">
          <div class="card-header">
            <span class="card-title">สินค้าใกล้หมด / หมดสต๊อก</span>
            <a href="products.html" class="btn btn-sm btn-outline-primary">ดูทั้งหมด</a>
          </div>
          <div class="card-body p-0" id="lowStockList">
            <div class="empty-state" style="padding:32px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#10B981;opacity:0.4;margin-bottom:10px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <p style="font-size:13px;margin:0;">สินค้าทุกรายการมีเพียงพอ</p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-5">
        <div class="card card-accent-blue">
          <div class="card-header">
            <span class="card-title">ทำรายการด่วน</span>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <a href="stock-in.html" class="btn btn-success" style="justify-content:center;">
                <span style="display:flex;align-items:center;gap:8px;">${svgIn} รับสินค้าเข้า</span>
              </a>
              <a href="stock-out.html" class="btn btn-primary" style="justify-content:center;">
                <span style="display:flex;align-items:center;gap:8px;">${svgOut} เบิกสินค้าออก</span>
              </a>
              <a href="products.html" class="btn btn-outline-primary" style="justify-content:center;">
                <span style="display:flex;align-items:center;gap:8px;">${svgAdd} เพิ่มสินค้าใหม่</span>
              </a>
              <a href="reports.html" class="btn btn-outline-primary" style="justify-content:center;">
                <span style="display:flex;align-items:center;gap:8px;">${svgReport} ดูรายงาน</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMovementChart(chart) {
  const ctx = document.getElementById('movementChart');
  if (!ctx || !chart) return;

  if (movementChart) movementChart.destroy();

  const isDark = document.body.classList.contains('dark-mode');
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? '#64748B' : '#94A3B8';

  movementChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chart.labels,
      datasets: [
        {
          label: 'รับเข้า',
          data: chart.in,
          backgroundColor: 'rgba(16,185,129,0.7)',
          borderColor: 'rgba(16,185,129,0.9)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'เบิกออก',
          data: chart.out,
          backgroundColor: 'rgba(239,68,68,0.65)',
          borderColor: 'rgba(239,68,68,0.85)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: tickColor,
            font: { family: 'Kanit', size: 12 },
            usePointStyle: true,
            pointStyleWidth: 10,
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(10,22,40,0.95)' : 'rgba(255,255,255,0.97)',
          titleColor: isDark ? '#F1F5F9' : '#1E293B',
          bodyColor: isDark ? '#94A3B8' : '#475569',
          borderColor: 'rgba(59,130,246,0.2)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 10,
          titleFont: { family: 'Kanit', weight: '700' },
          bodyFont: { family: 'Kanit' },
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'Kanit', size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { stepSize: 1, color: tickColor, font: { family: 'Kanit', size: 11 } }
        }
      }
    }
  });
}

function renderCategoryBars(categories) {
  const el = document.getElementById('categoryBars');
  if (!el) return;
  const entries = Object.entries(categories || {});
  if (!entries.length) {
    el.innerHTML = '<div class="empty-state"><p style="font-size:13px;">ยังไม่มีหมวดหมู่</p></div>';
    return;
  }
  const max = Math.max(...entries.map(e => e[1]));
  el.innerHTML = entries.map(([cat, count]) => `
    <div class="category-bar">
      <span class="category-bar-label" title="${cat||'ไม่ระบุ'}">${cat||'ไม่ระบุ'}</span>
      <div class="category-bar-track">
        <div class="category-bar-fill" style="width:${Math.round((count/max)*100)}%"></div>
      </div>
      <span class="category-bar-count">${count}</span>
    </div>
  `).join('');
}

function renderLowStockList(items) {
  const el = document.getElementById('lowStockList');
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = `<div class="empty-state" style="padding:32px;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#10B981;opacity:0.4;margin-bottom:10px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <p style="font-size:13px;margin:0;">สินค้าทุกรายการมีเพียงพอ</p>
    </div>`;
    return;
  }
  el.innerHTML = '<div style="padding:4px 18px 8px;">' + items.map(item => `
    <div class="low-stock-item">
      <div>
        <div class="low-stock-name">${item.ProductName||'-'}</div>
        <div class="low-stock-sku">SKU: ${item.SKU||'-'} &nbsp;•&nbsp; ${item.Category||'-'}</div>
      </div>
      <div class="text-end">
        ${getStockBadge(item.Quantity, item.MinStock)}
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">ขั้นต่ำ ${item.MinStock||5} ${item.Unit||'ชิ้น'}</div>
      </div>
    </div>
  `).join('') + '</div>';
}

function getSkeletonHTML() {
  return `
    <div class="page-header">
      <div><div class="skeleton" style="width:140px;height:24px;margin-bottom:6px;"></div>
      <div class="skeleton" style="width:200px;height:14px;"></div></div>
    </div>
    <div class="row g-3 mb-4">
      ${[1,2,3,4].map(() => `
        <div class="col-6 col-xl-3">
          <div class="stat-card">
            <div class="skeleton" style="width:52px;height:52px;border-radius:14px;flex-shrink:0;"></div>
            <div style="flex:1;">
              <div class="skeleton" style="width:60px;height:28px;margin-bottom:7px;"></div>
              <div class="skeleton" style="width:90px;height:14px;"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="row g-3">
      <div class="col-xl-8"><div class="card" style="height:340px;"></div></div>
      <div class="col-xl-4"><div class="card" style="height:340px;"></div></div>
    </div>
  `;
}

function renderError(msg) {
  return `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:14px;padding:20px 24px;margin:8px 0;color:#F87171;display:flex;align-items:center;gap:12px;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ${msg||'เกิดข้อผิดพลาด'}
  </div>`;
}
