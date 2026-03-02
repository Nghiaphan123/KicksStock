const ITEMS_PER_PAGE = 12;
let currentPage = 1;

function renderUsers(users) {
  const tbody = document.getElementById("users-body");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedUsers = users.slice(start, end);

  paginatedUsers.forEach(u => {
    const row = document.createElement("tr");

    // If role is admin, force status text to "Unchangeable"
    const statusText = u.role === "admin" ? "unchangeable" : u.status;

    row.innerHTML = `
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>${u.role}</td>
      <td>
        <span class="status ${statusText.toLowerCase()}">${statusText}</span>
      </td>
    `;

    const statusEl = row.querySelector(".status");

    // Toggle only if role is customer
    if (u.role === "customer") {
      statusEl.style.cursor = "pointer";
      statusEl.addEventListener("click", () => {
        u.status = u.status === "active" ? "banned" : "active";
        updateUserStatus(u.id, u.status);
      });
    }

    tbody.appendChild(row);
  });

  renderPagination(users);
}

function updateUserStatus(userId, newStatus) {
  let allUsers = JSON.parse(localStorage.getItem("users")) || [];

  const index = allUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    allUsers[index].status = newStatus;
    localStorage.setItem("users", JSON.stringify(allUsers));
  }

  renderUsers(allUsers); // refresh table
}

function renderPagination(users) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.addEventListener("click", () => {
      currentPage--;
      renderUsers(users);
    });
    pagination.appendChild(prevBtn);
  }

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.addEventListener("click", () => {
      currentPage = i;
      renderUsers(users);
    });
    pagination.appendChild(btn);
  }

  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.addEventListener("click", () => {
      currentPage++;
      renderUsers(users);
    });
    pagination.appendChild(nextBtn);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const allUsers = JSON.parse(localStorage.getItem("users")) || [];
  renderUsers(allUsers);
});