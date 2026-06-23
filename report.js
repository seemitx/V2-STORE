// ============================================================
// report.js — Premium UI (logic unchanged)
// ============================================================

let reportData = [];
let reportType = 'inventory';

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('รายงาน', 'reports');
  loadReportPage();
});

function loadReportPage() {
  const container = document.getElementById('pageContent');
  container.innerHTML = getReportHTML();
  loadReport('inventory');
}

function getReportHTML() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';
  const svgSearch  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  const svgExcel   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  const svgPDF     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

  return `
    <div class="page-header">
      <div>
        <div class="page-header-title">รายงาน</div>
        <div class="page-header-sub">ข้อมูลสรุปและประวัติการเคลื่อนไหวสินค้า</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline-primary btn-sm" onclick="exportExcel()">${svgExcel} Export CSV</button>
        <button class="btn btn-danger btn-sm" onclick="exportPDF()">${svgPDF} Export PDF</button>
      </div>
    </div>

    <!-- Tabs & Date Filter -->
    <div class="card mb-4">
      <div class="card-body" style="padding:14px 20px;">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="tab-inventory" onclick="loadReport('inventory')">
              สินค้าคงเหลือ
            </button>
            <button class="btn btn-outline-primary" id="tab-stockin" onclick="loadReport('stockin')">
              รับเข้า
            </button>
            <button class="btn btn-outline-primary" id="tab-stockout" onclick="loadReport('stockout')">
              เบิกออก
            </button>
          </div>
          <div id="dateFilters" style="display:none;align-items:center;gap:8px;flex-wrap:wrap;">
            <input type="date" class="form-control" id="fromDate" value="${monthStart}" style="width:140px;">
            <span style="color:var(--text-muted);font-size:12px;">ถึง</span>
            <input type="date" class="form-control" id="toDate" value="${today}" style="width:140px;">
            <button class="btn btn-outline-primary btn-sm" onclick="applyDateFilter()">กรอง</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div id="reportSummary" class="mb-4"></div>

    <!-- Table -->
    <div class="table-wrapper">
      <div class="table-toolbar">
        <span class="card-title" id="reportTitle" style="font-size:15px;">สินค้าคงเหลือ</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="search-bar">
            <span class="search-icon">${svgSearch}</span>
            <input type="text" class="form-control" id="reportSearch" placeholder="ค้นหา..." oninput="filterReport()" style="min-width:180px;">
          </div>
          <span class="table-info" id="reportInfo" style="font-size:13px;color:var(--text-muted);white-space:nowrap;"></span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead id="reportThead"><tr><td style="padding:16px;color:var(--text-muted);">กำลังโหลด...</td></tr></thead>
          <tbody id="reportTbody"><tr><td></td></tr></tbody>
        </table>
      </div>
      <div class="table-footer">
        <span id="reportInfoBottom" style="font-size:13px;color:var(--text-muted);"></span>
        <div id="reportPagination"></div>
      </div>
    </div>
  `;
}

let filteredReport = [];
let reportPage = 1;
const REPORT_PAGE_SIZE = 20;

async function loadReport(type) {
  reportType = type;
  reportPage = 1;

  ['inventory','stockin','stockout'].forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (btn) btn.className = t === type ? 'btn btn-primary' : 'btn btn-outline-primary';
  });

  const df = document.getElementById('dateFilters');
  if (df) df.style.display = (type !== 'inventory') ? 'flex' : 'none';

  const titles = { inventory: 'สินค้าคงเหลือ', stockin: 'รายงานรับเข้า', stockout: 'รายงานเบิกออก' };
  const titleEl = document.getElementById('reportTitle');
  if (titleEl) titleEl.textContent = titles[type] || type;

  let params = { type };
  if (type !== 'inventory') {
    const from = document.getElementById('fromDate')?.value;
    const to = document.getElementById('toDate')?.value;
    if (from) params.from = from;
    if (to) params.to = to;
  }

  const result = await apiGetReport(params);
  if (!result.success) {
    document.getElementById('reportTbody').innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:#F87171;">⚠️ ${result.message}</td></tr>`;
    return;
  }

  reportData = result.data || [];
  renderSummaryCards();
  filteredReport = [...reportData];
  renderReportTable();
}

function applyDateFilter() {
  loadReport(reportType);
}

function filterReport() {
  const q = document.getElementById('reportSearch')?.value.toLowerCase() || '';
  filteredReport = reportData.filter(r =>
    Object.values(r).some(v => (v||'').toString().toLowerCase().includes(q))
  );
  reportPage = 1;
  renderReportTable();
}

function renderSummaryCards() {
  const el = document.getElementById('reportSummary');
  if (!el) return;

  if (reportType === 'inventory') {
    const total = reportData.length;
    const totalValue = reportData.reduce((s, p) => s + parseFloat(p.CostPrice||0) * parseInt(p.Quantity||0), 0);
    const outOfStock = reportData.filter(p => parseInt(p.Quantity) === 0).length;
    const totalQty = reportData.reduce((s,p)=>s+parseInt(p.Quantity||0),0);
    el.innerHTML = `
      <div class="row g-3">
        <div class="col-6 col-md-3">
          <div class="stat-card blue">
            <div class="stat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
            <div class="stat-info"><div class="stat-value">${formatNumber(total)}</div><div class="stat-label">รายการสินค้า</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card green">
            <div class="stat-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div class="stat-info"><div class="stat-value" style="font-size:18px;">${formatCurrency(totalValue)}</div><div class="stat-label">มูลค่ารวม</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card red">
            <div class="stat-icon red"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
            <div class="stat-info"><div class="stat-value">${formatNumber(outOfStock)}</div><div class="stat-label">หมดสต๊อก</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card teal">
            <div class="stat-icon teal"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
            <div class="stat-info"><div class="stat-value">${formatNumber(totalQty)}</div><div class="stat-label">รวมจำนวนทั้งหมด</div></div>
          </div>
        </div>
      </div>
    `;
  } else {
    const totalQty = reportData.reduce((s, r) => s + parseInt(r.Quantity||0), 0);
    const color = reportType === 'stockin' ? 'green' : 'orange';
    const svgIcon = reportType === 'stockin'
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="12" x2="12" y2="3"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`;
    el.innerHTML = `
      <div class="row g-3">
        <div class="col-6 col-md-4">
          <div class="stat-card blue">
            <div class="stat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div class="stat-info"><div class="stat-value">${formatNumber(reportData.length)}</div><div class="stat-label">รายการทั้งหมด</div></div>
          </div>
        </div>
        <div class="col-6 col-md-4">
          <div class="stat-card ${color}">
            <div class="stat-icon ${color}">${svgIcon}</div>
            <div class="stat-info"><div class="stat-value">${formatNumber(totalQty)}</div><div class="stat-label">จำนวนรวม</div></div>
          </div>
        </div>
      </div>
    `;
  }
}

function renderReportTable() {
  const thead = document.getElementById('reportThead');
  const tbody = document.getElementById('reportTbody');
  const infoEl = document.getElementById('reportInfo');
  const infoBotEl = document.getElementById('reportInfoBottom');
  if (!thead || !tbody) return;

  let headers = [];
  if (reportType === 'inventory') {
    headers = ['SKU','ชื่อสินค้า','หมวดหมู่','คงเหลือ','หน่วย','ราคาทุน','ราคาขาย','มูลค่า','ที่จัดเก็บ'];
  } else {
    headers = ['รหัส TX','สินค้า','จำนวน', reportType==='stockin' ? 'ผู้จัดจำหน่าย' : 'ผู้รับ', 'วันที่','หมายเหตุ'];
  }
  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

  const paged = paginate(filteredReport, reportPage, REPORT_PAGE_SIZE);
  const total = filteredReport.length;
  const start = (reportPage - 1) * REPORT_PAGE_SIZE + 1;
  const end = Math.min(reportPage * REPORT_PAGE_SIZE, total);
  const infoText = total ? `${start}–${end} จาก ${total} รายการ` : 'ไม่พบข้อมูล';
  if (infoEl) infoEl.textContent = infoText;
  if (infoBotEl) infoBotEl.textContent = infoText;

  if (!paged.items.length) {
    tbody.innerHTML = `<tr><td colspan="${headers.length}">
      <div class="empty-state">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.2;margin-bottom:10px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
        <p>ไม่พบข้อมูล</p>
      </div>
    </td></tr>`;
    document.getElementById('reportPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = paged.items.map(r => {
    if (reportType === 'inventory') {
      const value = parseFloat(r.CostPrice||0) * parseInt(r.Quantity||0);
      return `<tr>
        <td><code style="font-size:11px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);padding:2px 6px;border-radius:5px;color:var(--primary-light);">${r.SKU||'-'}</code></td>
        <td><strong>${r.ProductName}</strong></td>
        <td><span class="badge bg-secondary">${r.Category||'-'}</span></td>
        <td>${getStockBadge(r.Quantity, r.MinStock)}</td>
        <td style="font-size:13px;">${r.Unit||'-'}</td>
        <td style="font-size:13px;">${formatCurrency(r.CostPrice)}</td>
        <td style="font-size:13px;">${formatCurrency(r.SellPrice)}</td>
        <td><strong style="color:#34D399;">${formatCurrency(value)}</strong></td>
        <td style="font-size:13px;">${r.Location||'-'}</td>
      </tr>`;
    } else {
      const badge = reportType === 'stockin'
        ? `<span class="badge bg-success">+${formatNumber(r.Quantity)}</span>`
        : `<span class="badge bg-danger">-${formatNumber(r.Quantity)}</span>`;
      return `<tr>
        <td><code style="font-size:11px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);padding:2px 6px;border-radius:5px;color:var(--primary-light);">${r.TransactionID}</code></td>
        <td style="font-weight:600;">${r.ProductName||r.ProductID}</td>
        <td>${badge}</td>
        <td style="font-size:13px;">${r.Supplier||r.Receiver||'-'}</td>
        <td style="font-size:13px;">${formatDate(r.Date)}</td>
        <td style="font-size:12px;color:var(--text-muted);">${r.Note||'-'}</td>
      </tr>`;
    }
  }).join('');

  renderPagination('reportPagination', reportPage, paged.totalPages, p => {
    reportPage = p;
    renderReportTable();
    window.scrollTo(0, 0);
  });
}

// ============================================================
// Export Functions (logic unchanged)
// ============================================================
function exportExcel() {
  if (!reportData.length) { showToast('ไม่มีข้อมูลสำหรับ Export', 'warning'); return; }

  let csv = '';
  let headers = [];

  if (reportType === 'inventory') {
    headers = ['SKU','ชื่อสินค้า','หมวดหมู่','คงเหลือ','หน่วย','ราคาทุน','ราคาขาย','มูลค่า','ที่จัดเก็บ'];
    csv = headers.join(',') + '\n';
    csv += reportData.map(r => [
      r.SKU, r.ProductName, r.Category, r.Quantity, r.Unit,
      r.CostPrice, r.SellPrice,
      (parseFloat(r.CostPrice||0) * parseInt(r.Quantity||0)).toFixed(2),
      r.Location
    ].map(v => `"${v||''}"`).join(',')).join('\n');
  } else {
    headers = ['รหัส TX','ProductID','ชื่อสินค้า','จำนวน', reportType==='stockin'?'ผู้จัดจำหน่าย':'ผู้รับ','วันที่','หมายเหตุ'];
    csv = headers.join(',') + '\n';
    csv += reportData.map(r => [
      r.TransactionID, r.ProductID, r.ProductName, r.Quantity,
      r.Supplier||r.Receiver, r.Date, r.Note
    ].map(v => `"${v||''}"`).join(',')).join('\n');
  }

  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export CSV สำเร็จ', 'success');
}

function exportPDF() {
  if (!reportData.length) { showToast('ไม่มีข้อมูลสำหรับ Export', 'warning'); return; }

  const titles = { inventory: 'รายงานสินค้าคงเหลือ', stockin: 'รายงานรับสินค้าเข้า', stockout: 'รายงานเบิกสินค้าออก' };
  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  let tableHTML = '';
  if (reportType === 'inventory') {
    tableHTML = `<table border="1" style="border-collapse:collapse;width:100%;font-size:12px;">
      <thead style="background:#1565C0;color:#fff;">
        <tr><th>SKU</th><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th>คงเหลือ</th><th>หน่วย</th><th>ราคาทุน</th><th>ราคาขาย</th><th>มูลค่า</th></tr>
      </thead><tbody>` +
      reportData.map((r, i) => `<tr style="background:${i%2?'#F5F7FA':'#fff'}">
        <td>${r.SKU||'-'}</td><td>${r.ProductName}</td><td>${r.Category||'-'}</td>
        <td align="center">${r.Quantity}</td><td>${r.Unit||'-'}</td>
        <td align="right">${parseFloat(r.CostPrice||0).toFixed(2)}</td>
        <td align="right">${parseFloat(r.SellPrice||0).toFixed(2)}</td>
        <td align="right"><strong>${(parseFloat(r.CostPrice||0)*parseInt(r.Quantity||0)).toFixed(2)}</strong></td>
      </tr>`).join('') + `</tbody></table>`;
  } else {
    tableHTML = `<table border="1" style="border-collapse:collapse;width:100%;font-size:12px;">
      <thead style="background:#1565C0;color:#fff;">
        <tr><th>รหัส TX</th><th>ชื่อสินค้า</th><th>จำนวน</th><th>${reportType==='stockin'?'ผู้จัดจำหน่าย':'ผู้รับ'}</th><th>วันที่</th><th>หมายเหตุ</th></tr>
      </thead><tbody>` +
      reportData.map((r, i) => `<tr style="background:${i%2?'#F5F7FA':'#fff'}">
        <td>${r.TransactionID}</td><td>${r.ProductName||r.ProductID}</td>
        <td align="center">${r.Quantity}</td>
        <td>${r.Supplier||r.Receiver||'-'}</td>
        <td>${r.Date||'-'}</td><td>${r.Note||'-'}</td>
      </tr>`).join('') + `</tbody></table>`;
  }

  const totalValue = reportType === 'inventory'
    ? reportData.reduce((s,p) => s + parseFloat(p.CostPrice||0)*parseInt(p.Quantity||0), 0) : null;

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>${titles[reportType]}</title>
    <style>
      body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #1A2332; padding: 20px; }
      h1 { color: #1565C0; font-size: 20px; margin-bottom: 4px; }
      .meta { color: #546E7A; font-size: 12px; margin-bottom: 16px; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      th, td { padding: 6px 10px; }
      .summary { margin-top: 12px; font-size: 13px; }
    </style>
  </head><body>
    <h1>${titles[reportType]}</h1>
    <div class="meta">วันที่พิมพ์: ${printDate} | จำนวน: ${reportData.length} รายการ</div>
    ${tableHTML}
    ${totalValue !== null ? `<div class="summary"><strong>มูลค่ารวม: ${formatCurrency(totalValue)}</strong></div>` : ''}
    <script>window.print();<\/script>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}
