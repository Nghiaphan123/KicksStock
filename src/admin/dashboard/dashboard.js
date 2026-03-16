document.addEventListener("DOMContentLoaded", () => {
  const allOrders   = JSON.parse(localStorage.getItem("allOrders"))  || [];
  const allProducts = JSON.parse(localStorage.getItem("products"))   || [];
  const allUsers    = JSON.parse(localStorage.getItem("users"))      || [];

  // ── Panels ──
  const now          = new Date();
  const curMonth     = now.getMonth() + 1;
  const curYear      = now.getFullYear();
  const MONTH_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const profit = allOrders
    .filter(o => {
      const d = new Date(o.date);
      return o.status === "Done"
        && d.getFullYear() === curYear
        && d.getMonth() + 1 === curMonth;
    })
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  document.getElementById("profit-count").textContent   = `$${profit.toFixed(2)}`;
  document.getElementById("products-count").textContent = allProducts.length;
  document.getElementById("users-count").textContent    = allUsers.length;
  document.getElementById("profit-desc").textContent    = `Revenue in ${MONTH_NAMES[curMonth-1]} ${curYear}.`;
  document.getElementById("products-desc").textContent  = "Total products currently available.";
  document.getElementById("users-desc").textContent     = "Total registered users in the system.";

  // ── Build year list from real orders ──

  const years = [...new Set(allOrders.map(o => new Date(o.date).getFullYear()))].sort();
  if (!years.length) years.push(new Date().getFullYear());

  const yearSel      = document.getElementById("filter-year");
  const monthFromSel = document.getElementById("filter-month-from");
  const monthToSel   = document.getElementById("filter-month-to");

  // Populate year dropdown
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y; opt.textContent = y;
    if (y === new Date().getFullYear()) opt.selected = true;
    yearSel.appendChild(opt);
  });

  // Populate month dropdowns (1–12)
  MONTH_NAMES.forEach((name, i) => {
    const m = i + 1;
    const o1 = document.createElement("option");
    o1.value = m; o1.textContent = name;
    if (m === 1) o1.selected = true;
    monthFromSel.appendChild(o1);

    const o2 = document.createElement("option");
    o2.value = m; o2.textContent = name;
    if (m === 12) o2.selected = true;
    monthToSel.appendChild(o2);
  });

  // ── Charts ──
  let lineChart = null;
  let pieChart  = null;

  function buildCharts() {
    const year      = parseInt(yearSel.value);
    const monthFrom = parseInt(monthFromSel.value);
    const monthTo   = parseInt(monthToSel.value);

    if (monthFrom > monthTo) {
      alert("Tháng bắt đầu phải nhỏ hơn hoặc bằng tháng kết thúc!");
      return;
    }

    // Luôn hiển thị theo từng ngày trong khoảng đã chọn
    const labels = [];
    const profitPerMonth = [];

    const isSingleMonth = monthFrom === monthTo;

    // Tính ngày bắt đầu và kết thúc
    const startDate = new Date(year, monthFrom - 1, 1);
    const endDate   = new Date(year, monthTo, 0); // ngày cuối của monthTo

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dd = d.getDate();
      const mm = d.getMonth() + 1;
      labels.push(`${String(dd).padStart(2,'0')}/${String(mm).padStart(2,'0')}`);

      const dayProfit = allOrders
        .filter(o => {
          const dt = new Date(o.date);
          return o.status === 'Done'
            && dt.getFullYear() === year
            && dt.getMonth() + 1 === mm
            && dt.getDate() === dd;
        })
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      profitPerMonth.push(dayProfit);
    }

    // Destroy old charts if exist
    if (lineChart) lineChart.destroy();
    if (pieChart)  pieChart.destroy();

    // Line chart
    const profitCtx = document.getElementById("profitLineChart").getContext("2d");
    lineChart = new Chart(profitCtx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Profit ($)",
          data: profitPerMonth,
          borderColor: "rgba(40, 167, 69, 1)",
          backgroundColor: "rgba(40, 167, 69, 0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "rgba(40,167,69,1)"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: isSingleMonth
              ? `Profit theo ngày — ${MONTH_NAMES[monthFrom-1]} ${year}`
              : `Profit theo ngày — ${MONTH_NAMES[monthFrom-1]} đến ${MONTH_NAMES[monthTo-1]} ${year}`,
            font: { size: 16, weight: "bold" }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` $${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => `$${v}` }
          },
          x: {
            ticks: {
              maxTicksLimit: 31,
              autoSkip: true,
              maxRotation: 45
            }
          }
        }
      }
    });

    // Pie chart — filter by same year & month range
    const doneCount = allOrders.filter(o => {
      const d = new Date(o.date);
      const m = d.getMonth() + 1;
      return o.status === "Done" && d.getFullYear() === year && m >= monthFrom && m <= monthTo;
    }).length;

    const canceledCount = allOrders.filter(o => {
      const d = new Date(o.date);
      const m = d.getMonth() + 1;
      return o.status === "Canceled" && d.getFullYear() === year && m >= monthFrom && m <= monthTo;
    }).length;

    const pendingCount = allOrders.filter(o => {
      const d = new Date(o.date);
      const m = d.getMonth() + 1;
      return o.status === "Pending" && d.getFullYear() === year && m >= monthFrom && m <= monthTo;
    }).length;

    const ordersCtx = document.getElementById("ordersPieChart").getContext("2d");
    pieChart = new Chart(ordersCtx, {
      type: "pie",
      data: {
        labels: ["Done", "Canceled", "Pending"],
        datasets: [{
          data: [doneCount, canceledCount, pendingCount],
          backgroundColor: [
            "rgba(40, 167, 69, 0.75)",
            "rgba(220, 53, 69, 0.75)",
            "rgba(255, 193, 7, 0.75)"
          ],
          borderWidth: 2,
          borderColor: "#fff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: isSingleMonth
              ? `Orders Status — ${MONTH_NAMES[monthFrom-1]} ${year}`
              : `Orders Status — ${MONTH_NAMES[monthFrom-1]} to ${MONTH_NAMES[monthTo-1]} ${year}`,
            font: { size: 16, weight: "bold" }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} orders`
            }
          }
        }
      }
    });
  }

  // Initial render
  buildCharts();

  // Apply filter button
  document.getElementById("apply-filter").addEventListener("click", buildCharts);
});