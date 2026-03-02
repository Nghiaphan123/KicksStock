document.addEventListener("DOMContentLoaded", () => {
  const allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
  const tbody = document.getElementById("orders-body");

  allOrders.forEach(order => {
    const row = document.createElement("tr");

    const dateObj = new Date(order.date);
    const formattedDate = dateObj.toLocaleDateString("en-GB");

    row.innerHTML = `
      <td>#${order.orderId}</td>
      <td>${formattedDate}</td>
      <td>${order.paymentMethod || "N/A"}</td>
      <td>${order.customerName}</td>
      <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
      <td>$${order.totalPrice.toFixed(2)}</td>
    `;

    // Add click event to show panel
    row.addEventListener("click", () => openOrderPanel(order));

    tbody.appendChild(row);
  });
});

function openOrderPanel(order) {
  const panel = document.createElement("div");
  panel.className = "order-panel";

  // Build items list
  const itemsList = order.items.map(item => `
    <div class="order-item">
      <strong>${item.name}</strong> — Qty: ${item.amount || 1}
    </div>
  `).join("");

  panel.innerHTML = `
    <h2>Order Details</h2>
    <div><strong>Order ID:</strong> #${order.orderId}</div>
    <div><strong>Date:</strong> ${new Date(order.date).toLocaleDateString("en-GB")}</div>
    <div><strong>Customer:</strong> ${order.customerName}</div>
    <div><strong>Status:</strong> ${order.status}</div>
    <div><strong>Total Price:</strong> $${order.totalPrice.toFixed(2)}</div>
    <div><strong>Payment Method:</strong> ${order.paymentMethod || "N/A"}</div>
    <div><strong>Shipping Address:</strong> ${order.shippingAddress}</div>
    <h3>Items</h3>
    ${itemsList}
    <div class="panel-actions">
      <button id="close-panel">Close</button>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("close-panel").addEventListener("click", () => {
    panel.remove();
  });
}