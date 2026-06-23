// ============================================================
// stockout.js — Premium UI (logic unchanged)
// ============================================================

let soAllProducts = [];
let soHistory = [];
let soCurrentPage = 1;
const SO_PAGE_SIZE = 15;

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('เบิกสินค้าออก', 'stockout');
  loadStockOutPage();
});

async function loadStockOutPage() {
  const container = document.getElementById('pageContent');
  container.innerHTML = getStockOutHTML();

  const [pRes, hRes] = await Promise.all([apiGetProducts(), apiGetStockOut()]);

  if (pRes.success) {
    soAllProducts = pRes.data || [];
    populateSoProductSelect();
  }

  if (hRes.success) {
    soHistory = hRes.data || [];
    renderSoHistory();
  }
}

function getStockOutHTML() {
  const today = new Date().toISOString().split('T')[0];
  const svgSearch = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  const svgSave   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

  return `
    <div class="page-header">
      <div>
        <div class="page-header-title">เบิกสินค้าออก</div>
        <div class="page-header-sub">บันทึกการเบิกสินค้าออกจากคลัง</div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Form Card -->
      <div class="col-lg-4">
        <div class="card card-accent-blue" style="position:sticky;top:80px;">
          <div class="card-header">
            <span class="card-title">เพิ่มรายการเบิกออก</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="12" x2="12" y2="3"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">ค้นหาสินค้า</label>
              <div class="search-bar mb-2">
                <span class="search-icon">${svgSearch}</span>
                <input type="text" class="form-control" id="soSearchProduct" placeholder="ค้นหาสินค้า..." oninput="filterSoProducts()">
              </div>
              <select class="form-select" id="soProductID" size="5" style="height:auto;border-radius:12px;" onchange="onSoProductChange()">
                <option value="">-- กำลังโหลด --</option>
              </select>
            </div>

            <div id="soProductInfo" style="display:none;background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:12px 14px;margin-bottom:14px;">
              <div id="soProductDetail"></div>
            </div>

            <div class="mb-3">
              <label class="form-label">จำนวนที่เบิก *</label>
              <input type="number" class="form-control" id="soQuantity" min="1" value="1">
              <div style="font-size:11px;color:var(--text-muted);margin-top:5px;" id="soMaxHint"></div>
            </div>
            <div class="mb-3">
              <label class="form-label">ผู้รับสินค้า / แผนก</label>
              <input type="text" class="form-control" id="soReceiver" placeholder="ชื่อผู้รับหรือแผนก">
            </div>
            <div class="mb-3">
              <label class="form-label">วันที่เบิก</label>
              <input type="date" class="form-control" id="soDate" value="${today}">
            </div>
            <div class="mb-4">
              <label class="form-label">หมายเหตุ</label>
              <textarea class="form-control" id="soNote" rows="2" placeholder="หมายเหตุ (ไม่บังคับ)"></textarea>
            </div>
            <button class="btn btn-primary w-100" onclick="submitStockOut()" style="justify-content:center;">
              ${svgSave} บันทึกการเบิกสินค้า
            </button>
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="col-lg-8">
        <div class="table-wrapper">
          <div class="table-toolbar">
            <span class="card-title" style="font-size:15px;">ประวัติการเบิกสินค้า</span>
            <span class="table-info" id="soHistoryInfo" style="font-size:13px;color:var(--text-muted);">กำลังโหลด...</span>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>สินค้า</th>
                  <th>จำนวน</th>
                  <th>ผู้รับ</th>
                  <th>วันที่</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody id="soHistoryBody">
                <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">กำลังโหลด...</td></tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <div></div>
            <div id="soPagination"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function filterSoProducts() {
  const q = document.getElementById('soSearchProduct').value.toLowerCase();
  const filtered = soAllProducts.filter(p =>
    (p.ProductName||'').toLowerCase().includes(q) ||
    (p.SKU||'').toLowerCase().includes(q)
  );
  populateSoProductSelect(filtered);
}

function populateSoProductSelect(products = null) {
  const list = products || soAllProducts;
  const sel = document.getElementById('soProductID');
  if (!sel) return;
  sel.innerHTML = list.map(p => {
    const qty = parseInt(p.Quantity);
    const disabled = qty === 0 ? 'disabled' : '';
    return `<option value="${p.ProductID}" ${disabled}>[${p.SKU||'--'}] ${p.ProductName} (${qty} ${p.Unit||'ชิ้น'})${qty === 0 ? ' ✕' : ''}</option>`;
  }).join('');
  const first = list.find(p => parseInt(p.Quantity) > 0);
  if (first) { sel.value = first.ProductID; onSoProductChange(); }
  else if (list.length === 0) sel.innerHTML = '<option value="">ไม่พบสินค้า</option>';
}

function onSoProductChange() {
  const id = document.getElementById('soProductID').value;
  const p = soAllProducts.find(x => x.ProductID === id);
  const infoEl = document.getElementById('soProductInfo');
  const detailEl = document.getElementById('soProductDetail');
  const hintEl = document.getElementById('soMaxHint');
  const qtyInput = document.getElementById('soQuantity');
  if (!p) { infoEl.style.display = 'none'; return; }

  const qty = parseInt(p.Quantity);
  infoEl.style.display = 'block';
  detailEl.innerHTML = `
    <div style="font-weight:700;margin-bottom:5px;color:var(--text-primary);">${p.ProductName}</div>
    <div style="font-size:12px;color:var(--text-secondary);line-height:1.7;">
      SKU: <strong>${p.SKU||'-'}</strong> &nbsp;•&nbsp; หมวด: <strong>${p.Category||'-'}</strong><br>
      คงเหลือ: ${getStockBadge(p.Quantity, p.MinStock)}
    </div>
  `;

  if (hintEl) hintEl.textContent = `สูงสุด ${qty} ${p.Unit||'ชิ้น'}`;
  if (qtyInput) {
    qtyInput.max = qty;
    if (parseInt(qtyInput.value) > qty) qtyInput.value = qty;
  }
}

async function submitStockOut() {
  const productID = document.getElementById('soProductID').value;
  const quantity = parseInt(document.getElementById('soQuantity').value);
  const receiver = document.getElementById('soReceiver').value.trim();
  const date = document.getElementById('soDate').value;
  const note = document.getElementById('soNote').value.trim();

  if (!productID) { showToast('กรุณาเลือกสินค้า', 'warning'); return; }
  if (!quantity || quantity < 1) { showToast('กรุณากรอกจำนวนที่ถูกต้อง', 'warning'); return; }

  const p = soAllProducts.find(x => x.ProductID === productID);
  if (p && quantity > parseInt(p.Quantity)) {
    showToast(`สินค้าไม่เพียงพอ! คงเหลือ ${p.Quantity} ${p.Unit||'ชิ้น'}`, 'error');
    return;
  }

  const ok = await confirmDialog(
    'ยืนยันการเบิกสินค้า',
    `เบิก "${p?.ProductName}" จำนวน ${quantity} ${p?.Unit||'ชิ้น'} ออกจากสต๊อก?`,
    'ยืนยัน'
  );
  if (!ok) return;

  const result = await apiStockOut({ productID, quantity, receiver, date, note });
  if (result.success) {
    showToast(`เบิกสินค้าสำเร็จ! รหัส: ${result.transactionID}`, 'success');
    document.getElementById('soQuantity').value = 1;
    document.getElementById('soReceiver').value = '';
    document.getElementById('soNote').value = '';
    const [pRes, hRes] = await Promise.all([apiGetProducts(), apiGetStockOut()]);
    if (pRes.success) { soAllProducts = pRes.data; populateSoProductSelect(); }
    if (hRes.success) { soHistory = hRes.data; renderSoHistory(); }
  } else {
    showToast(result.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

function renderSoHistory() {
  const tbody = document.getElementById('soHistoryBody');
  const infoEl = document.getElementById('soHistoryInfo');
  if (!tbody) return;

  const paged = paginate(soHistory, soCurrentPage, SO_PAGE_SIZE);
  if (infoEl) infoEl.textContent = `${soHistory.length} รายการ`;

  if (!paged.items.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.2;margin-bottom:10px;"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="12" x2="12" y2="3"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
        <p>ยังไม่มีประวัติการเบิกสินค้า</p>
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
      <td><span class="badge bg-danger">-${formatNumber(r.Quantity)}</span></td>
      <td style="font-size:13px;">${r.Receiver||'-'}</td>
      <td style="font-size:13px;">${formatDate(r.Date)}</td>
      <td style="font-size:12px;color:var(--text-muted);">${r.Note||'-'}</td>
    </tr>
  `).join('');

  renderPagination('soPagination', soCurrentPage, paged.totalPages, p => {
    soCurrentPage = p;
    renderSoHistory();
  });
}
