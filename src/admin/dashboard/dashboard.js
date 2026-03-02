document.addEventListener("DOMContentLoaded", () => {
  const allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
  const allProducts = JSON.parse(localStorage.getItem("products")) || [];
  const allUsers = JSON.parse(localStorage.getItem("users")) || [];

  const profit = allOrders
    .filter(order => order.status === "Done")
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  document.getElementById("profit-count").textContent = `$${profit.toFixed(2)}`;
  document.getElementById("products-count").textContent = allProducts.length;
  document.getElementById("users-count").textContent = allUsers.length;

  document.getElementById("profit-desc").textContent = "Total revenue from completed orders.";
  document.getElementById("products-desc").textContent = "Total products currently available.";
  document.getElementById("users-desc").textContent = "Total registered users in the system.";

  // Line graph (unchanged)
  const months = ["Nov", "Dec", "Jan", "Feb"];
  const profitData = [1200, 1800, 2400, profit];

  const profitCtx = document.getElementById("profitLineChart").getContext("2d");
  new Chart(profitCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Profit ($)",
        data: profitData,
        borderColor: "rgba(40, 167, 69, 1)",
        backgroundColor: "rgba(40, 167, 69, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Profit Over Last 4 Months"
        }
      }
    }
  });

  // Pie graph (50% smaller)
  const doneCount = allOrders.filter(order => order.status === "Done").length;
  const canceledCount = allOrders.filter(order => order.status === "Canceled").length;

  const ordersCtx = document.getElementById("ordersPieChart").getContext("2d");
  new Chart(ordersCtx, {
    type: "pie",
    data: {
      labels: ["Done Orders", "Canceled Orders"],
      datasets: [{
        data: [doneCount, canceledCount],
        backgroundColor: [
          "rgba(40, 167, 69, 0.7)", // green
          "rgba(220, 53, 69, 0.7)"  // red
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // allow resizing
      plugins: {
        title: {
          display: true,
          text: "Orders Status Distribution"
        }
      }
    }
  });
});