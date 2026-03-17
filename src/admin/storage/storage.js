const WARNING_RED    = 10;
const WARNING_YELLOW = 15;
const notesPerPage   = 5;

let productItems  = [];
let buyNotes      = [];
let activeSupplier = 'all';
let notesPageIndex = 1;

/* ── Supplier color map ── */
const supplierColors = {
  'Nike':        '#f0f7ff',
  'Adidas':      '#f0fff4',
  'Jordan':      '#fff7f0',
  'Puma':        '#fdf0ff',
  'New Balance': '#f0f9ff',
  'Converse':    '#fffbf0',
  'Vans':        '#f5f0ff',
  'Asics':       '#f0fffa',
  'Reebok':      '#fff0f0',
  'Salomon':     '#f5fff0',
  'Dr. Martens': '#fff0fb',
  'On':          '#f0f4ff',
  'Luxury':      '#fffff0',
  'all':         '#ffffff'
};

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  productItems = JSON.parse(localStorage.getItem('products')) || [];
  buyNotes     = JSON.parse(localStorage.getItem('buyNotes'))  || [];

  renderSummaryCards();
  renderSupplierTabs();
  renderProducts();
  renderNotes();
  calculateTotal();

  document.getElementById('buy-btn').addEventListener('click', handleBuy);
  document.getElementById('clear-btn').addEventListener('click', handleClear);
  document.getElementById('create-order-btn').addEventListener('click', openCreateOrderModal);
});

/* ── Summary Cards ── */
function renderSummaryCards() {
  const container = document.getElementById('summary-cards');
  const brands = [...new Set(productItems.map(p => p.brand))];

  const totalProducts  = productItems.length;
  const lowStock       = productItems.filter(p => p.amount < WARNING_RED).length;
  const warnStock      = productItems.filter(p => p.amount >= WARNING_RED && p.amount < WARNING_YELLOW).length;
  const totalValue     = productItems.reduce((s, p) => s + p.price * p.amount, 0);

  container.innerHTML = `
    <div class="sum-card"><div class="sum-val">${brands.length}</div><div class="sum-label">Suppliers</div></div>
    <div class="sum-card"><div class="sum-val">${totalProducts}</div><div class="sum-label">Products</div></div>
    <div class="sum-card danger"><div class="sum-val">${lowStock}</div><div class="sum-label">Low Stock</div></div>
    <div class="sum-card warning"><div class="sum-val">${warnStock}</div><div class="sum-label">Watch List</div></div>
    <div class="sum-card"><div class="sum-val">$${totalValue.toLocaleString()}</div><div class="sum-label">Total Stock Value</div></div>
  `;
}

/* ── Supplier Tabs ── */
function renderSupplierTabs() {
  const container = document.getElementById('supplier-tabs');
  const brands    = ['all', ...new Set(productItems.map(p => p.brand))];

  container.innerHTML = brands.map(b => `
    <button class="supplier-tab ${b === activeSupplier ? 'active' : ''}"
      onclick="switchSupplier('${b}')">
      ${b === 'all' ? 'All' : b}
      <span class="tab-count">${b === 'all' ? productItems.length : productItems.filter(p => p.brand === b).length}</span>
    </button>
  `).join('');
}

function switchSupplier(brand) {
  activeSupplier = brand;
  renderSupplierTabs();
  renderProducts();
  calculateTotal();
}

/* ── Product Rows ── */
function renderProducts() {
  const list    = document.getElementById('storage-list');
  const filtered = activeSupplier === 'all'
    ? productItems
    : productItems.filter(p => p.brand === activeSupplier);

  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:#999;">No products found.</div>`;
    return;
  }

  list.innerHTML = filtered.map(item => {
    let rowClass = '';
    if (item.amount < WARNING_RED)    rowClass = 'low-stock-red';
    else if (item.amount < WARNING_YELLOW) rowClass = 'low-stock-yellow';

    return `
      <div class="product-card-row ${rowClass}">
        <div>${item.id}</div>
        <div class="prod-name-cell">
          <span class="brand-badge" style="background:${supplierColors[item.brand] || '#f5f5f5'}">${item.brand}</span>
          ${item.name}
        </div>
        <div class="amount-cell ${item.amount < WARNING_RED ? 'text-danger' : item.amount < WARNING_YELLOW ? 'text-warning' : ''}">
          ${item.amount}
        </div>
        <div>$${(item.price * 0.75).toFixed(2)}</div>
        <div>
          <input type="number" class="add-amount" data-id="${item.id}"
            placeholder="Quantity" min="0" />
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('.add-amount').forEach(input => {
    input.addEventListener('input', calculateTotal);
  });
}

/* ── Total ── */
function calculateTotal() {
  let total = 0;
  document.querySelectorAll('.add-amount').forEach(input => {
    const id     = parseInt(input.dataset.id);
    const addVal = parseInt(input.value) || 0;
    const prod   = productItems.find(p => p.id === id);
    if (prod && addVal > 0) total += (prod.price * 0.75) * addVal;
  });
  document.getElementById('total-price').textContent = `Total: $${total.toFixed(2)}`;
  return total;
}

/* ── Handle Buy ── */
function handleBuy() {
  const inputs = document.querySelectorAll('.add-amount');
  const productsBought = [];
  let total = 0;

  inputs.forEach(input => {
    const id     = parseInt(input.dataset.id);
    const addVal = parseInt(input.value) || 0;
    const prod   = productItems.find(p => p.id === id);
    if (prod && addVal > 0) {
      const unitPrice = prod.price * 0.75;
      const lineTotal = unitPrice * addVal;
      productsBought.push({ id: prod.id, name: prod.name, brand: prod.brand, amount: addVal, price: unitPrice, total: lineTotal });
      total += lineTotal;
      prod.amount += addVal;
    }
  });

  if (productsBought.length === 0) {
    alert('Please enter a quantity to restock!');
    return;
  }

  // Get supplier list
  const suppliers = [...new Set(productsBought.map(p => p.brand))].join(', ');

  const note = {
    id:        buyNotes.length > 0 ? Math.max(...buyNotes.map(n => n.id)) + 1 : 1,
    supplier:  suppliers,
    total,
    date:      new Date().toLocaleString('vi-VN'),
    products:  productsBought
  };

  buyNotes.push(note);
  localStorage.setItem('buyNotes',  JSON.stringify(buyNotes));
  localStorage.setItem('products',  JSON.stringify(productItems));

  renderSummaryCards();
  renderProducts();
  renderNotes();
  calculateTotal();

  showToast(`✓ Stock updated successfully! Total: $${total.toFixed(2)}`);
}

function handleClear() {
  document.querySelectorAll('.add-amount').forEach(i => i.value = '');
  calculateTotal();
}

/* ── Create Order Modal ── */
function openCreateOrderModal() {
  const brands = [...new Set(productItems.map(p => p.brand))].sort();

  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const modal = document.createElement('div');
  modal.className = 'create-order-modal';

  modal.innerHTML = `
    <div class="modal-header">
      <h2>Create Purchase Order</h2>
      <button class="modal-close-x" id="close-order-modal">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-left">
        <h3>Select Supplier</h3>
        <div class="supplier-list" id="modal-supplier-list">
          ${brands.map(b => `
            <div class="supplier-item" data-brand="${b}" onclick="selectModalSupplier('${b}', this)">
              <div class="supplier-dot" style="background:${getSupplierColor(b)}"></div>
              <span>${b}</span>
              <span class="supplier-item-count">${productItems.filter(p => p.brand === b).length} sản phẩm</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-right">
        <h3 id="modal-prod-title">← Select Supplier</h3>
        <div id="modal-prod-list" class="modal-prod-list">
          <div style="color:#aaa;font-size:13px;padding:20px;">Select Supplier để xem sản phẩm.</div>
        </div>
        <div class="modal-footer">
          <span id="modal-total" class="modal-total-label">Total: $0.00</span>
          <button id="modal-confirm-btn" class="btn-buy" onclick="confirmModalOrder()">Confirm Purchase</button>
        </div>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('close-order-modal').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function getSupplierColor(brand) {
  const colors = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#BA7517','#D4537E','#639922','#E24B4A','#888780'];
  const brands  = [...new Set(productItems.map(p => p.brand))].sort();
  return colors[brands.indexOf(brand) % colors.length];
}

function selectModalSupplier(brand, el) {
  document.querySelectorAll('.supplier-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');

  const prods = productItems.filter(p => p.brand === brand);
  document.getElementById('modal-prod-title').textContent = `${brand} — ${prods.length} sản phẩm`;

  document.getElementById('modal-prod-list').innerHTML = `
    <div class="modal-prod-header">
      <span>Products</span>
      <span>Stock</span>
      <span>Unit Cost</span>
      <span>Quantity</span>
    </div>
    ${prods.map(p => `
      <div class="modal-prod-row ${p.amount < WARNING_RED ? 'low-stock-red' : p.amount < WARNING_YELLOW ? 'low-stock-yellow' : ''}">
        <span class="modal-prod-name">${p.name}</span>
        <span class="${p.amount < WARNING_RED ? 'text-danger' : p.amount < WARNING_YELLOW ? 'text-warning' : ''}">${p.amount}</span>
        <span>$${(p.price * 0.75).toFixed(2)}</span>
        <span><input type="number" class="modal-qty" data-id="${p.id}" min="0" placeholder="0"
          oninput="calcModalTotal()" /></span>
      </div>
    `).join('')}
  `;
}

function calcModalTotal() {
  let total = 0;
  document.querySelectorAll('.modal-qty').forEach(input => {
    const id  = parseInt(input.dataset.id);
    const qty = parseInt(input.value) || 0;
    const p   = productItems.find(x => x.id === id);
    if (p && qty > 0) total += (p.price * 0.75) * qty;
  });
  const el = document.getElementById('modal-total');
  if (el) el.textContent = `Total: $${total.toFixed(2)}`;
}

function confirmModalOrder() {
  const productsBought = [];
  let total = 0;

  document.querySelectorAll('.modal-qty').forEach(input => {
    const id  = parseInt(input.dataset.id);
    const qty = parseInt(input.value) || 0;
    const p   = productItems.find(x => x.id === id);
    if (p && qty > 0) {
      const unitPrice = p.price * 0.75;
      productsBought.push({ id: p.id, name: p.name, brand: p.brand, amount: qty, price: unitPrice, total: unitPrice * qty });
      total += unitPrice * qty;
      p.amount += qty;
    }
  });

  if (productsBought.length === 0) { alert('Please enter quantities!'); return; }

  const supplier = [...new Set(productsBought.map(x => x.brand))].join(', ');
  const note = {
    id:       buyNotes.length > 0 ? Math.max(...buyNotes.map(n => n.id)) + 1 : 1,
    supplier, total,
    date:     new Date().toLocaleString('vi-VN'),
    products: productsBought
  };

  buyNotes.push(note);
  localStorage.setItem('buyNotes', JSON.stringify(buyNotes));
  localStorage.setItem('products', JSON.stringify(productItems));

  document.querySelector('.overlay')?.remove();
  renderSummaryCards();
  renderProducts();
  renderNotes();
  showToast(`✓ Purchase Order #${note.id} has been created! Total: $${total.toFixed(2)}`);
}

/* ── Notes ── */
function renderNotes() {
  buyNotes = JSON.parse(localStorage.getItem('buyNotes')) || [];
  const list = document.getElementById('notes-list');
  const reversed = [...buyNotes].reverse();
  const page = reversed.slice((notesPageIndex - 1) * notesPerPage, notesPageIndex * notesPerPage);

  if (page.length === 0) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:#999;">No purchase orders yet.</div>`;
    renderNotesPagination();
    return;
  }

  list.innerHTML = page.map(note => `
    <div class="note-card clickable" onclick="showNoteDetail(${JSON.stringify(note).replace(/"/g, '&quot;')})">
      <div>#${note.id}</div>
      <div>${note.supplier || 'N/A'}</div>
      <div>$${note.total.toFixed(2)}</div>
      <div>${note.date}</div>
    </div>
  `).join('');

  renderNotesPagination();
}

function renderNotesPagination() {
  const pagination = document.getElementById('notes-pagination');
  const totalPages = Math.ceil(buyNotes.length / notesPerPage);
  pagination.innerHTML = '';

  if (notesPageIndex > 1) {
    const b = document.createElement('button');
    b.className = 'page-btn'; b.textContent = 'Previous';
    b.onclick = () => { notesPageIndex--; renderNotes(); };
    pagination.appendChild(b);
  }
  for (let i = 1; i <= totalPages; i++) {
    const b = document.createElement('button');
    b.className = `page-btn ${i === notesPageIndex ? 'active' : ''}`;
    b.textContent = i;
    b.onclick = () => { notesPageIndex = i; renderNotes(); };
    pagination.appendChild(b);
  }
  if (notesPageIndex < totalPages) {
    const b = document.createElement('button');
    b.className = 'page-btn'; b.textContent = 'Next';
    b.onclick = () => { notesPageIndex++; renderNotes(); };
    pagination.appendChild(b);
  }
}

function showNoteDetail(note) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const panel = document.createElement('div');
  panel.className = 'note-detail-panel';

  panel.innerHTML = `
    <div class="detail-container">
      <h2>Purchase Order #${note.id}</h2>
      <p style="color:#666;font-size:13px;">Suppliers: <strong>${note.supplier || 'N/A'}</strong> &nbsp;|&nbsp; Date: ${note.date} &nbsp;|&nbsp; Total: <strong>$${note.total.toFixed(2)}</strong></p>
      <div class="detail-row header">
        <div>ID</div><div>Products</div><div>Supplier</div><div>Qty</div><div>Unit Price</div><div>Amount</div>
      </div>
      <div class="detail-list">
        ${note.products.map(p => `
          <div class="detail-row">
            <div>${p.id}</div>
            <div>${p.name}</div>
            <div>${p.brand || ''}</div>
            <div>${p.amount}</div>
            <div>$${p.price.toFixed(2)}</div>
            <div>$${p.total.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      <div class="detail-actions">
        <button onclick="this.closest('.overlay').remove()" style="background:#6c757d;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;">Close</button>
      </div>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.25);';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}