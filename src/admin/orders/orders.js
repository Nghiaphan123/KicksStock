const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let _allOrders = [];
let _hiddenOrders = new Set(JSON.parse(sessionStorage.getItem('hiddenOrders') || '[]'));
let _showHidden = false;

function saveHiddenState() {
  sessionStorage.setItem('hiddenOrders', JSON.stringify([..._hiddenOrders]));
}

function toggleHideOrder(orderId, btn) {
  event.stopPropagation(); // không trigger openOrderPanel
  if (_hiddenOrders.has(orderId)) {
    _hiddenOrders.delete(orderId);
  } else {
    _hiddenOrders.add(orderId);
  }
  saveHiddenState();
  applyFilters();
}

function toggleShowHidden() {
  _showHidden = !_showHidden;
  const btn = document.getElementById('toggle-hidden-btn');
  if (btn) {
    btn.textContent = _showHidden ? '👁 Hide Hidden' : '👁 Show Hidden';
    btn.classList.toggle('active-hidden', _showHidden);
  }
  applyFilters();
}
let _activeStatus = 'all';

/* ── Filter helpers ── */
function applyFilters() {
  const orderId  = document.getElementById('search-orderid')?.value.toLowerCase().trim() || '';
  const dateVal  = document.getElementById('search-date')?.value || '';
  const customer = document.getElementById('search-customer')?.value.toLowerCase().trim() || '';
  const status   = document.getElementById('search-status')?.value || 'all';
  const payment  = document.getElementById('search-payment')?.value || 'all';

  const filtered = _allOrders.filter(o => {
    // Ẩn/hiện theo hidden state
    const isHidden = _hiddenOrders.has(o.orderId);
    if (isHidden && !_showHidden) return false;

    if (status  !== 'all' && o.status.toLowerCase() !== status)                    return false;
    if (payment !== 'all' && (o.paymentMethod || '').toLowerCase() !== payment)    return false;
    if (orderId   && !o.orderId.toLowerCase().includes(orderId))                   return false;
    if (customer  && !o.customerName.toLowerCase().includes(customer))             return false;
    if (dateVal) {
      const orderDate = new Date(o.date).toISOString().slice(0, 10);
      if (orderDate !== dateVal) return false;
    }
    return true;
  });

  currentPage = 1;
  renderOrders(filtered);
}

function clearFilters() {
  document.getElementById('search-orderid').value  = '';
  document.getElementById('search-date').value     = '';
  document.getElementById('search-customer').value = '';
  document.getElementById('search-status').value   = 'all';
  document.getElementById('search-payment').value  = 'all';
  currentPage = 1;
  renderOrders(_allOrders);
}

/* ── Inline field edit helpers ── */
function toggleEditField(prefix) {
  const display = document.getElementById(`${prefix}-display`);
  const input   = document.getElementById(`${prefix}-input`);
  const editBtn = document.getElementById(`${prefix}-edit-btn`);
  const saveBtn = document.getElementById(`${prefix}-save-btn`);

  const isEditing = input.style.display !== 'none';
  display.style.display = isEditing ? 'inline' : 'none';
  input.style.display   = isEditing ? 'none'   : 'inline-block';
  editBtn.style.display = isEditing ? 'inline-block' : 'none';
  saveBtn.style.display = isEditing ? 'none'   : 'inline-block';
  if (!isEditing) input.focus();
}

function saveFieldEdit(prefix, orderId, field) {
  const input   = document.getElementById(`${prefix}-input`);
  const display = document.getElementById(`${prefix}-display`);
  const newVal  = input.value.trim();

  // Update allOrders
  const idx = _allOrders.findIndex(o => o.orderId === orderId);
  if (idx !== -1) {
    _allOrders[idx][field] = newVal;
    localStorage.setItem('allOrders', JSON.stringify(_allOrders));

    // Sync to users[].orders
    const userId = _allOrders[idx].userId;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const uIdx = users.findIndex(u => u.id == userId);
    if (uIdx !== -1 && Array.isArray(users[uIdx].orders)) {
      const oIdx = users[uIdx].orders.findIndex(o => o.orderId === orderId);
      if (oIdx !== -1) users[uIdx].orders[oIdx][field] = newVal;
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  display.textContent = newVal || 'N/A';
  toggleEditField(prefix); // switch back to display mode
}

/* ── Order panel ── */
function openOrderPanel(order) {
  const panel = document.createElement("div");
  panel.className = "order-panel";

  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const itemsList = order.items.map(item => `
    <div class="order-item-card">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-qty">Qty: ${item.quantity || 1}</div>
      </div>
    </div>
  `).join("");

  panel.innerHTML = `
    <button class="close-btn">×</button>
    <h2>Order Details</h2>
    <div><strong>Order ID:</strong> #${order.orderId}</div>
    <div><strong>Date:</strong> ${new Date(order.date).toLocaleDateString("en-GB")}</div>
    <div><strong>Time:</strong> ${new Date(order.date).toLocaleTimeString("en-GB", {hour:'2-digit', minute:'2-digit'})}</div>
    <div><strong>Customer:</strong> ${order.customerName}</div>
    <div><strong>Status:</strong> ${order.status}</div>
    <div><strong>Total Price:</strong> $${order.totalPrice.toFixed(2)}</div>

    <!-- Payment Method editable -->
    <div class="editable-field">
      <strong>Payment Method:</strong>
      <span id="pm-display">${order.paymentMethod || "N/A"}</span>
      <select id="pm-input" style="display:none;">
        <option value="cod"  ${order.paymentMethod === 'cod'  ? 'selected' : ''}>COD</option>
        <option value="momo" ${order.paymentMethod === 'momo' ? 'selected' : ''}>Momo</option>
        <option value="card" ${order.paymentMethod === 'card' ? 'selected' : ''}>Card</option>
        <option value="N/A"  ${!order.paymentMethod || order.paymentMethod === 'N/A' ? 'selected' : ''}>N/A</option>
      </select>
      <button class="edit-field-btn" id="pm-edit-btn" onclick="toggleEditField('pm')">Edit</button>
      <button class="save-field-btn" id="pm-save-btn" style="display:none;" onclick="saveFieldEdit('pm', '${order.orderId}', 'paymentMethod')">Save</button>
    </div>

    <!-- Shipping Address editable -->
    <div class="editable-field">
      <strong>Shipping Address:</strong>
      <span id="sa-display">${order.shippingAddress || "N/A"}</span>
      <input id="sa-input" type="text" value="${order.shippingAddress || ""}" style="display:none;">
      <button class="edit-field-btn" id="sa-edit-btn" onclick="toggleEditField('sa')">Edit</button>
      <button class="save-field-btn" id="sa-save-btn" style="display:none;" onclick="saveFieldEdit('sa', '${order.orderId}', 'shippingAddress')">Save</button>
    </div>

    <h3>Items</h3>
    <div class="items-container">
      ${itemsList}
    </div>
    <div class="panel-actions">
      <button class="done-btn">Done</button>
      <button class="canceled-btn">Canceled</button>
      <button class="pending-btn">Pending</button>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  panel.querySelector(".close-btn").addEventListener("click", () => { panel.remove(); overlay.remove(); });
  panel.querySelector(".done-btn").addEventListener("click", () => { updateOrderStatus(order.orderId, "Done"); panel.remove(); overlay.remove(); });
  panel.querySelector(".canceled-btn").addEventListener("click", () => { updateOrderStatus(order.orderId, "Canceled"); panel.remove(); overlay.remove(); });
  panel.querySelector(".pending-btn").addEventListener("click", () => { updateOrderStatus(order.orderId, "Pending"); panel.remove(); overlay.remove(); });
}

/* ── Update status ── */
function updateOrderStatus(orderId, newStatus) {
  let allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
  const index = allOrders.findIndex(o => o.orderId === orderId);

  if (index !== -1) {
    allOrders[index].status = newStatus;
    localStorage.setItem("allOrders", JSON.stringify(allOrders));

    // Sync to users[].orders
    const targetUserId = allOrders[index].userId;
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userIdx = users.findIndex(u => u.id == targetUserId);
    if (userIdx !== -1) {
      if (!Array.isArray(users[userIdx].orders)) users[userIdx].orders = [];
      const orderIdx = users[userIdx].orders.findIndex(o => o.orderId === orderId);
      if (orderIdx !== -1) users[userIdx].orders[orderIdx].status = newStatus;
      localStorage.setItem("users", JSON.stringify(users));
    }

    _allOrders = allOrders;
  }

  applyFilters();
}

/* ── Render table ── */
function renderOrders(orders) {
  const tbody = document.getElementById("orders-body");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = orders.slice(start, start + ITEMS_PER_PAGE);

  if (paginated.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#999;">No orders found.</td></tr>`;
    renderPagination(orders);
    return;
  }

  paginated.forEach(o => {
    const row = document.createElement("tr");
    const dateObj = new Date(o.date);
    const formattedTime  = dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const day   = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year  = dateObj.getFullYear();
    const isHidden = _hiddenOrders.has(o.orderId);

    if (isHidden) row.classList.add('row-hidden');

    row.innerHTML = `
      <td>#${o.orderId}</td>
      <td class="time-cell">${formattedTime}</td>
      <td class="date-cell">${day}</td>
      <td class="date-cell">${month}</td>
      <td class="date-cell">${year}</td>
      <td>${o.paymentMethod || "N/A"}</td>
      <td>${o.customerName}</td>
      <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
      <td>$${o.totalPrice.toFixed(2)}</td>
      <td>
        <button class="hide-row-btn ${isHidden ? 'unhide' : ''}" 
          onclick="toggleHideOrder('${o.orderId}', this)" 
          title="${isHidden ? 'Show' : 'Hide'}">
          ${isHidden ? '👁 Show' : '👁 Hide'}
        </button>
      </td>
    `;
    row.querySelector('td:not(:last-child)')?.addEventListener('click', () => openOrderPanel(o));
    // Make all cells except last clickable
    row.querySelectorAll('td:not(:last-child)').forEach(td => {
      td.style.cursor = 'pointer';
      td.addEventListener('click', () => openOrderPanel(o));
    });
    tbody.appendChild(row);
  });

  renderPagination(orders);
}

/* ── Pagination ── */
function renderPagination(orders) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  if (currentPage > 1) {
    const prev = document.createElement("button");
    prev.textContent = "Previous";
    prev.addEventListener("click", () => { currentPage--; applyFilters(); });
    pagination.appendChild(prev);
  }

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.addEventListener("click", () => { currentPage = i; applyFilters(); });
    pagination.appendChild(btn);
  }

  if (currentPage < totalPages) {
    const next = document.createElement("button");
    next.textContent = "Next";
    next.addEventListener("click", () => { currentPage++; applyFilters(); });
    pagination.appendChild(next);
  }
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  _allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
  renderOrders(_allOrders);
});