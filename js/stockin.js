// ============================================================
// stockin.js — Premium UI (logic unchanged)
// ============================================================

let siAllProducts = [];
let siHistory = [];
let siCurrentPage = 1;
const SI_PAGE_SIZE = 15;

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('รับสินค้าเข้า', 'stockin');
  loadStockInPage();
});

async function loadStockInPage() {
  const container = document.getElementById('pageContent');
  container.innerHTML = getStockInHTML();

  const [pRes, hRes] = await Promise.all([apiGetProducts(), apiGetStockIn()]);

  if (pRes.success) {
    siAllProducts = pRes.data || [];
    populateProductSelect();
  }

  if (hRes.success) {
    siHistory = hRes.data || [];
    renderHistory();
  }
}

function getStockInHTML() {
  const today = new Date().toISOString().split('T')[0];
  const svgSearch = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  const svgSave   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

  return `
    <div class="page-header">
      <div>
        <div class="page-header-title">รับสินค้าเข้า</div>
        <div class="page-header-sub">บันทึกการรับสินค้าเข้าคลัง</div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Form Card -->
      <div class="col-lg-4">
        <div class="card card-accent-green" style="position:sticky;top:80px;">
          <div class="card-header">
            <span class="card-title">เพิ่มรายการรับเข้า</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">ค้นหาสินค้า</label>
              <div class="search-bar mb-2">
                <span class="search-icon">${svgSearch}</span>
                <input type="text" class="form-control" id="siSearchProduct" placeholder="ค้นหาสินค้า..." oninput="filterSiProducts()">
              </div>
              <select class="form-select" id="siProductID" size="5" style="height:auto;border-radius:12px;" onchange="onSiProductChange()">
                <option value="">-- กำลังโหลด --</option>
              </select>
            </div>

            <div id="siProductInfo" style="display:none;background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:12px 14px;margin-bottom:14px;">
              <div id="siProductDetail"></div>
            </div>

            <div class="mb-3">
              <label class="form-label">จำนวนที่รับเข้า *</label>
              <input type="number" class="form-control" id="siQuantity" min="1" value="1">
            </div>
            <div class="mb-3">
              <label class="form-label">ผู้จัดจำหน่าย / แหล่งที่มา</label>
              <input type="text" class="form-control" id="siSupplier" placeholder="ชื่อ Supplier">
            </div>
            <div class="mb-3">
              <label class="form-label">วันที่รับสินค้า</label>
              <input type="date" class="form-control" id="siDate" value="${today}">
            </div>
            <div class="mb-4">
              <label class="form-label">หมายเหตุ</label>
              <textarea class="form-control" id="siNote" rows="2" placeholder="หมายเหตุ (ไม่บังคับ)"></textarea>
            </div>
            <button class="btn btn-success w-100" onclick="submitStockIn()" style="justify-content:center;">
              ${svgSave} บันทึกการรับสินค้า
            </button>
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="col-lg-8">
        <div class="table-wrapper">
          <div class="table-toolbar">
            <span class="card-title" style="font-size:15px;">ประวัติการรับสินค้า</span>
            <span class="table-info" id="siHistoryInfo" style="font-size:13px;color:var(--text-muted);">กำลังโหลด...</span>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>สินค้า</th>
                  <th>จำนวน</th>
                  <th>ผู้จัดจำหน่าย</th>
                  <th>วันที่</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody id="siHistoryBody">
                <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">กำลังโหลด...</td></tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <div></div>
            <div id="siPagination"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function filterSiProducts() {
  const q = document.getElementById('siSearchProduct').value.toLowerCase();
  const filtered = siAllProducts.filter(p =>
    (p.ProductName||'').toLowerCase().includes(q) ||
    (p.SKU||'').toLowerCase().includes(q)
  );
  populateProductSelect(filtered);
}

function populateProductSelect(products = null) {
  const list = products || siAllProducts;
  const sel = document.getElementById('siProductID');
  if (!sel) return;
  sel.innerHTML = list.map(p =>
    `<option value="${p.ProductID}">[${p.SKU||'--'}] ${p.ProductName} (${p.Quantity} ${p.Unit||'ชิ้น'})</option>`
  ).join('');
  if (list.length > 0) { sel.value = list[0].ProductID; onSiProductChange(); }
  else sel.innerHTML = '<option value="">ไม่พบสินค้า</option>';
}

function onSiProductChange() {
  const id = document.getElementById('siProductID').value;
  const p = siAllProducts.find(x => x.ProductID === id);
  const infoEl = document.getElementById('siProductInfo');
  const detailEl = document.getElementById('siProductDetail');
  if (!p) { infoEl.style.display = 'none'; return; }
  infoEl.style.display = 'block';
  detailEl.innerHTML = `
    <div style="font-weight:700;margin-bottom:5px;color:var(--text-primary);">${p.ProductName}</div>
    <div style="font-size:12px;color:var(--text-secondary);line-height:1.7;">
      SKU: <strong>${p.SKU||'-'}</strong> &nbsp;•&nbsp; หมวด: <strong>${p.Category||'-'}</strong><br>
      คงเหลือ: ${getStockBadge(p.Quantity, p.MinStock)}
      &nbsp;&nbsp; ราคาทุน: <strong style="color:var(--primary-light);">${formatCurrency(p.CostPrice)}</strong>
    </div>
  `;
}

async function submitStockIn() {
  const productID = document.getElementById('siProductID').value;
  const quantity = parseInt(document.getElementById('siQuantity').value);
  const supplier = document.getElementById('siSupplier').value.trim();
  const date = document.getElementById('siDate').value;
  const note = document.getElementById('siNote').value.trim();

  if (!productID) { showToast('กรุณาเลือกสินค้า', 'warning'); return; }
  if (!quantity || quantity < 1) { showToast('กรุณากรอกจำนวนที่ถูกต้อง', 'warning'); return; }

  const p = siAllProducts.find(x => x.ProductID === productID);
  const ok = await confirmDialog(
    'ยืนยันการรับสินค้า',
    `รับ "${p?.ProductName}" จำนวน ${quantity} ${p?.Unit||'ชิ้น'} เข้าสต๊อก?`,
    'ยืนยัน'
  );
  if (!ok) return;

  const result = await apiStockIn({ productID, quantity, supplier, date, note });
  if (result.success) {
    showToast(`รับสินค้าเข้าสำเร็จ! รหัส: ${result.transactionID}`, 'success');
    document.getElementById('siQuantity').value = 1;
    document.getElementById('siSupplier').value = '';
    document.getElementById('siNote').value = '';
    const [pRes, hRes] = await Promise.all([apiGetProducts(), apiGetStockIn()]);
    if (pRes.success) { siAllProducts = pRes.data; populateProductSelect(); }
    if (hRes.success) { siHistory = hRes.data; renderHistory(); }
  } else {
    showToast(result.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

function renderHistory() {
  const tbody = document.getElementById('siHistoryBody');
  const infoEl = document.getElementById('siHistoryInfo');
  if (!tbody) return;

  const paged = paginate(siHistory, siCurrentPage, SI_PAGE_SIZE);
  if (infoEl) infoEl.textContent = `${siHistory.length} รายการ`;

  if (!paged.items.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.2;margin-bottom:10px;"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
        <p>ยังไม่มีประวัติการรับสินค้า</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = paged.items.map(r => `
    <tr>
      <td><code style="font-size:11px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);padding:2px 6px;border-radius:5px;color:var(--primary-light);">${r.TransactionID}</code></td>
      <td>
        <div style="font-weight:600;">${r.ProductName||'-'}</div>
        <div style="font-size:11px;color:var(--text-muted);">${r.ProductID}</div>
      </td>
      <td><span class="badge bg-success">+${formatNumber(r.Quantity)}</span></td>
      <td style="font-size:13px;">${r.Supplier||'-'}</td>
      <td style="font-size:13px;">${formatDate(r.Date)}</td>
      <td style="font-size:12px;color:var(--text-muted);">${r.Note||'-'}</td>
    </tr>
  `).join('');

  renderPagination('siPagination', siCurrentPage, paged.totalPages, p => {
    siCurrentPage = p;
    renderHistory();
  });
}
