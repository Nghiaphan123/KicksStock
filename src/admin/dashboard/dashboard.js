document.addEventListener("DOMContentLoaded", () => {
  // Get data from localStorage
  const allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
  const allProducts = JSON.parse(localStorage.getItem("products")) || [];
  const allUsers = JSON.parse(localStorage.getItem("users")) || [];

  // Calculate profit: sum of totalPrice for orders with status "Done"
  const profit = allOrders
    .filter(order => order.status === "Done")
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  // Update counts
  document.getElementById("profit-count").textContent = `$${profit.toFixed(2)}`;
  document.getElementById("products-count").textContent = allProducts.length;
  document.getElementById("users-count").textContent = allUsers.length;

  // Update descriptions
  document.getElementById("profit-desc").textContent = "Total revenue from completed orders.";
  document.getElementById("products-desc").textContent = "Total products currently available.";
  document.getElementById("users-desc").textContent = "Total registered users in the system.";
});