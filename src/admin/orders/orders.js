const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let _allOrders = [];
let _activeStatus = 'all';

/* ── Filter helpers ── */
function setStatusFilter(status) {
  _activeStatus = status;
  document.querySelectorAll('.status-btn').forEach(b =>
    b.classList.toggle('active-btn', b.dataset.status === status)
  );
  currentPage = 1;
  applyFilters();
}

function applyFilters() {
  const orderId  = document.getElementById('search-orderid')?.value.toLowerCase().trim() || '';
  const dateVal  = document.getElementById('search-date')?.value || '';
  const customer = document.getElementById('search-customer')?.value.toLowerCase().trim() || '';

  const filtered = _allOrders.filter(o => {
    if (_activeStatus !== 'all' && o.status.toLowerCase() !== _activeStatus) return false;
    if (orderId   && !o.orderId.toLowerCase().includes(orderId))       return false;
    if (customer  && !o.customerName.toLowerCase().includes(customer)) return false;
    if (dateVal) {
      const orderDate = new Date(o.date).toISOString().slice(0, 10);
      if (orderDate !== dateVal) return false;
    }
    return true;
  });

  renderOrders(filtered);
}

function clearFilters() {
  document.getElementById('search-orderid').value  = '';
  document.getElementById('search-date').value     = '';
  document.getElementById('search-customer').value = '';
  _activeStatus = 'all';
  document.querySelectorAll('.status-btn').forEach(b =>
    b.classList.toggle('active-btn', b.dataset.status === 'all')
  );
  currentPage = 1;
  renderOrders(_allOrders);
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
    <div><strong>Payment Method:</strong> ${order.paymentMethod || "N/A"}</div>
    <div><strong>Shipping Address:</strong> ${order.shippingAddress}</div>
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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#999;">No orders found.</td></tr>`;
    renderPagination(orders);
    return;
  }

  paginated.forEach(o => {
    const row = document.createElement("tr");
    const dateObj = new Date(o.date);
    const formattedDate = dateObj.toLocaleDateString("en-GB");
    const formattedTime = dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    row.innerHTML = `
      <td>#${o.orderId}</td>
      <td class="time-cell">${formattedTime}</td>
      <td>${formattedDate}</td>
      <td>${o.paymentMethod || "N/A"}</td>
      <td>${o.customerName}</td>
      <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
      <td>$${o.totalPrice.toFixed(2)}</td>
    `;
    row.addEventListener("click", () => openOrderPanel(o));
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