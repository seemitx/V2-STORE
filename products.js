// ============================================================
// products.js — Premium UI (logic unchanged)
// ============================================================

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const PAGE_SIZE = 15;
let productModal = null;
let editMode = false;
let categories = new Set();

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('จัดการสินค้า', 'products');
  productModal = new bootstrap.Modal(document.getElementById('productModal'));
  loadProducts();

  const params = new URLSearchParams(window.location.search);
  if (params.get('filter') === 'low') {
    setTimeout(() => filterByLowStock(), 800);
  }
});

async function loadProducts() {
  const container = document.getElementById('pageContent');
  container.innerHTML = getProductsHTML();
  bindSearch();

  const result = await apiGetProducts();
  if (!result.success) {
    document.getElementById('productTableBody').innerHTML =
      `<tr><td colspan="9" style="text-align:center;padding:32px;color:#F87171;">⚠️ ${result.message}</td></tr>`;
    return;
  }

  allProducts = result.data || [];
  categories = new Set(allProducts.map(p => p.Category).filter(Boolean));
  updateCategoryOptions();
  applyFilters();
}

function getProductsHTML() {
  const svgSearch = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  const svgPlus   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  return `
    <div class="page-header">
      <div>
        <div class="page-header-title">จัดการสินค้า</div>
        <div class="page-header-sub">รายการสินค้าทั้งหมดในระบบ</div>
      </div>
      <button class="btn btn-primary" onclick="openAddModal()">
        ${svgPlus} เพิ่มสินค้า
      </button>
    </div>

    <div class="table-wrapper">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="search-bar">
            <span class="search-icon">${svgSearch}</span>
            <input type="text" class="form-control" id="searchInput" placeholder="ค้นหาสินค้า, SKU, หมวดหมู่..." style="min-width:220px;">
          </div>
          <select class="form-select" id="categoryFilter" style="min-width:140px;">
            <option value="all">ทุกหมวดหมู่</option>
          </select>
          <select class="form-select" id="stockFilter" style="min-width:130px;">
            <option value="all">ทุกสถานะ</option>
            <option value="out">หมดสต๊อก</option>
            <option value="low">ใกล้หมด</option>
            <option value="ok">ปกติ</option>
          </select>
        </div>
        <div class="table-toolbar-right">
          <span class="table-info" id="tableInfo" style="font-size:13px;color:var(--text-muted);">กำลังโหลด...</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th style="width:48px;">#</th>
              <th style="width:54px;">รูป</th>
              <th class="sortable" onclick="sortBy('ProductName')">ชื่อสินค้า</th>
              <th>SKU</th>
              <th>หมวดหมู่</th>
              <th class="sortable" onclick="sortBy('Quantity')">คงเหลือ</th>
              <th>ราคาทุน</th>
              <th>ราคาขาย</th>
              <th style="width:100px;">จัดการ</th>
            </tr>
          </thead>
          <tbody id="productTableBody">
            ${getSkeletonRows(7, 9)}
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="table-info" id="tableInfoBottom" style="font-size:13px;color:var(--text-muted);"></span>
        <div id="pagination"></div>
      </div>
    </div>
  `;
}

function bindSearch() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const stockFilter = document.getElementById('stockFilter');
  if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
  if (stockFilter) stockFilter.addEventListener('change', applyFilters);
}

function updateCategoryOptions() {
  const sel = document.getElementById('categoryFilter');
  const datalist = document.getElementById('categoryList');
  if (sel) {
    const current = sel.value;
    sel.innerHTML = '<option value="all">ทุกหมวดหมู่</option>' +
      [...categories].map(c => `<option value="${c}">${c}</option>`).join('');
    sel.value = current;
  }
  if (datalist) {
    datalist.innerHTML = [...categories].map(c => `<option value="${c}">`).join('');
  }
}

function applyFilters() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const category = document.getElementById('categoryFilter')?.value || 'all';
  const stock = document.getElementById('stockFilter')?.value || 'all';

  filteredProducts = allProducts.filter(p => {
    const matchSearch = !search ||
      (p.ProductName||'').toLowerCase().includes(search) ||
      (p.SKU||'').toLowerCase().includes(search) ||
      (p.Category||'').toLowerCase().includes(search) ||
      (p.Location||'').toLowerCase().includes(search);
    const matchCat = category === 'all' || p.Category === category;
    const qty = parseInt(p.Quantity);
    const min = parseInt(p.MinStock || 5);
    const matchStock = stock === 'all' ||
      (stock === 'out' && qty === 0) ||
      (stock === 'low' && qty > 0 && qty <= min) ||
      (stock === 'ok' && qty > min);
    return matchSearch && matchCat && matchStock;
  });

  currentPage = 1;
  renderTable();
}

function filterByLowStock() {
  const sel = document.getElementById('stockFilter');
  if (sel) { sel.value = 'low'; applyFilters(); }
}

let sortField = '';
let sortDir = 1;
function sortBy(field) {
  if (sortField === field) sortDir *= -1;
  else { sortField = field; sortDir = 1; }
  filteredProducts.sort((a, b) => {
    const va = a[field] || ''; const vb = b[field] || '';
    const na = parseFloat(va); const nb = parseFloat(vb);
    if (!isNaN(na) && !isNaN(nb)) return (na - nb) * sortDir;
    return va.localeCompare(vb, 'th') * sortDir;
  });
  renderTable();
}

function renderTable() {
  const paged = paginate(filteredProducts, currentPage, PAGE_SIZE);
  const tbody = document.getElementById('productTableBody');
  const infoEl = document.getElementById('tableInfo');
  const infoBotEl = document.getElementById('tableInfoBottom');

  const total = filteredProducts.length;
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);
  const infoText = total ? `แสดง ${start}–${end} จาก ${total} รายการ` : 'ไม่พบสินค้า';
  if (infoEl) infoEl.textContent = infoText;
  if (infoBotEl) infoBotEl.textContent = infoText;

  if (!paged.items.length) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.2;margin-bottom:12px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <p>ไม่พบสินค้า</p>
      </div>
    </td></tr>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  const svgEdit = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const svgDel  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

  tbody.innerHTML = paged.items.map((p, i) => {
    const img = p.ImageURL
      ? `<img src="${p.ImageURL}" class="product-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="product-img-placeholder" style="display:none;">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
         </div>`
      : `<div class="product-img-placeholder">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
         </div>`;
    return `
      <tr>
        <td style="color:var(--text-muted);font-size:12px;">${start + i}</td>
        <td><div style="display:flex;">${img}</div></td>
        <td>
          <div style="font-weight:600;color:var(--text-primary);">${p.ProductName||'-'}</div>
          ${p.Location ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${p.Location}</div>` : ''}
        </td>
        <td><code style="font-size:11px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);padding:2px 7px;border-radius:6px;color:var(--primary-light);">${p.SKU||'-'}</code></td>
        <td><span class="badge bg-secondary">${p.Category||'-'}</span></td>
        <td>${getStockBadge(p.Quantity, p.MinStock)}</td>
        <td style="font-size:13px;">${formatCurrency(p.CostPrice)}</td>
        <td style="font-size:13px;">${formatCurrency(p.SellPrice)}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-sm btn-outline-primary btn-icon" onclick="openEditModal('${p.ProductID}')" title="แก้ไข">${svgEdit}</button>
            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteProduct('${p.ProductID}','${p.ProductName}')" title="ลบ">${svgDel}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('pagination', currentPage, paged.totalPages, p => {
    currentPage = p;
    renderTable();
    window.scrollTo(0, 0);
  });
}

// ============================================================
// Modal Operations (logic unchanged)
// ============================================================
function openAddModal() {
  editMode = false;
  document.getElementById('modalTitle').textContent = 'เพิ่มสินค้าใหม่';
  clearProductForm();
  productModal.show();
}

function openEditModal(id) {
  const p = allProducts.find(x => x.ProductID === id);
  if (!p) return;
  editMode = true;
  document.getElementById('modalTitle').textContent = 'แก้ไขสินค้า';
  document.getElementById('productID').value = p.ProductID;
  document.getElementById('productName').value = p.ProductName || '';
  document.getElementById('sku').value = p.SKU || '';
  document.getElementById('category').value = p.Category || '';
  document.getElementById('unit').value = p.Unit || '';
  document.getElementById('quantity').value = p.Quantity || 0;
  document.getElementById('costPrice').value = p.CostPrice || 0;
  document.getElementById('sellPrice').value = p.SellPrice || 0;
  document.getElementById('location').value = p.Location || '';
  document.getElementById('minStock').value = p.MinStock || 5;
  document.getElementById('description').value = p.Description || '';
  document.getElementById('imageURL').value = p.ImageURL || '';
  productModal.show();
}

function clearProductForm() {
  ['productID','productName','sku','category','unit','description','imageURL','location'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('quantity').value = 0;
  document.getElementById('costPrice').value = 0;
  document.getElementById('sellPrice').value = 0;
  document.getElementById('minStock').value = 5;
  document.getElementById('unit').value = 'ชิ้น';
}

async function saveProduct() {
  const name = document.getElementById('productName').value.trim();
  if (!name) { showToast('กรุณากรอกชื่อสินค้า', 'warning'); return; }

  const data = {
    productID: document.getElementById('productID').value,
    productName: name,
    sku: document.getElementById('sku').value.trim(),
    category: document.getElementById('category').value.trim(),
    unit: document.getElementById('unit').value.trim() || 'ชิ้น',
    quantity: document.getElementById('quantity').value,
    costPrice: document.getElementById('costPrice').value,
    sellPrice: document.getElementById('sellPrice').value,
    location: document.getElementById('location').value.trim(),
    minStock: document.getElementById('minStock').value,
    description: document.getElementById('description').value.trim(),
    imageURL: document.getElementById('imageURL').value.trim(),
  };

  let result;
  if (editMode) {
    result = await apiUpdateProduct(data);
  } else {
    result = await apiAddProduct(data);
  }

  if (result.success) {
    showToast(result.message || 'บันทึกสำเร็จ', 'success');
    productModal.hide();
    loadProducts();
  } else {
    showToast(result.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

async function deleteProduct(id, name) {
  const ok = await confirmDialog('ลบสินค้า', `ต้องการลบ "${name}" ใช่หรือไม่?`, 'ลบ');
  if (!ok) return;
  const result = await apiDeleteProduct(id);
  if (result.success) {
    showToast(result.message, 'success');
    loadProducts();
  } else {
    showToast(result.message, 'error');
  }
}

// ============================================================
// Helpers
// ============================================================
function getSkeletonRows(rows, cols) {
  return Array(rows).fill(0).map(() =>
    `<tr class="skeleton-row">${Array(cols).fill(0).map(() =>
      `<td><div class="skeleton" style="height:14px;width:80%;"></div></td>`
    ).join('')}</tr>`
  ).join('');
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
