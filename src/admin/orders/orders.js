const ITEMS_PER_PAGE = 12;
let currentPage = 1;

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

  // Close button
  panel.querySelector(".close-btn").addEventListener("click", () => {
    panel.remove();
    overlay.remove();
  });

  // Done button
  panel.querySelector(".done-btn").addEventListener("click", () => {
    updateOrderStatus(order.orderId, "Done");
    panel.remove();
    overlay.remove();
  });

  // Cancel button
  panel.querySelector(".canceled-btn").addEventListener("click", () => {
    updateOrderStatus(order.orderId, "Canceled");
    panel.remove();
    overlay.remove();
  });

  // Pending button
  panel.querySelector(".pending-btn").addEventListener("click", () => {
    updateOrderStatus(order.orderId, "Pending");
    panel.remove();
    overlay.remove();
  });

}

// Helper to update localStorage
// Helper to update localStorage
function updateOrderStatus(orderId, newStatus) {
  // 1. Cập nhật allOrders
  let allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
  const index = allOrders.findIndex(o => o.orderId === orderId);
  
  if (index !== -1) {
    allOrders[index].status = newStatus;
    localStorage.setItem("allOrders", JSON.stringify(allOrders));

    // 2. Đồng bộ sang users[].orders — dùng == để tránh type mismatch (string vs number)
    const targetUserId = allOrders[index].userId;
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userIdx = users.findIndex(u => u.id == targetUserId);
    
    if (userIdx !== -1) {
      if (!Array.isArray(users[userIdx].orders)) users[userIdx].orders = [];
      const orderIdx = users[userIdx].orders.findIndex(o => o.orderId === orderId);
      if (orderIdx !== -1) {
        users[userIdx].orders[orderIdx].status = newStatus;
      }
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  renderOrders(allOrders);
}
function renderOrders(orders) {
  const tbody = document.getElementById("orders-body");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(start, end);

  paginatedOrders.forEach(o => {
    const row = document.createElement("tr");
    const dateObj = new Date(o.date);
    const formattedDate = dateObj.toLocaleDateString("en-GB");

    row.innerHTML = `
      <td>#${o.orderId}</td>
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

function renderPagination(orders) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  // Show Previous only if not on first page
  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.addEventListener("click", () => {
      currentPage--;
      renderOrders(orders);
    });
    pagination.appendChild(prevBtn);
  }

  // Page number buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.addEventListener("click", () => {
      currentPage = i;
      renderOrders(orders);
    });
    pagination.appendChild(btn);
  }

  // Show Next only if not on last page
  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.addEventListener("click", () => {
      currentPage++;
      renderOrders(orders);
    });
    pagination.appendChild(nextBtn);
  }
}


// Initial render on page load
document.addEventListener("DOMContentLoaded", () => {
  const allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
  renderOrders(allOrders);
});
