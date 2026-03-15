const ITEMS_PER_PAGE = 12;
let currentPage = 1;

function getFilteredUsers() {
  let allUsers = JSON.parse(localStorage.getItem("users")) || [];

  const idFilter = document.getElementById("filter-id").value.toLowerCase();
  const nameFilter = document.getElementById("filter-name").value.toLowerCase();
  const emailFilter = document.getElementById("filter-email").value.toLowerCase();
  const phoneFilter = document.getElementById("filter-phone").value.toLowerCase();
  const roleFilter = document.getElementById("filter-role").value;
  const statusFilter = document.getElementById("filter-status").value;

  return allUsers.filter(u => {
    return (
      (!idFilter || u.id.toString().toLowerCase().includes(idFilter)) &&
      (!nameFilter || u.name.toLowerCase().includes(nameFilter)) &&
      (!emailFilter || u.email.toLowerCase().includes(emailFilter)) &&
      (!phoneFilter || (u.phone || "").toLowerCase().includes(phoneFilter)) &&
      (!roleFilter || u.role === roleFilter) &&
      (!statusFilter || u.status === statusFilter || (u.role === "admin" && statusFilter === "unchangeable"))
    );
  });
}

function renderUsers(users) {
  const tbody = document.getElementById("users-body");
  tbody.innerHTML = "";

  const filteredUsers = getFilteredUsers();

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(start, end);

  paginatedUsers.forEach(u => {
    const row = document.createElement("tr");
    const statusText = u.role === "admin" ? "unchangeable" : u.status;

    row.innerHTML = `
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>${u.role}</td>
      <td><span class="status ${statusText.toLowerCase()}">${statusText}</span></td>
    `;

    const statusEl = row.querySelector(".status");
    if (u.role === "customer") {
      statusEl.style.cursor = "pointer";
      statusEl.addEventListener("click", () => {
        u.status = u.status === "active" ? "banned" : "active";
        updateUserStatus(u.id, u.status);
      });
    }

    tbody.appendChild(row);
  });

  renderPagination(filteredUsers);
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

  document.querySelectorAll(".users-filters input, .users-filters select")
    .forEach(el => el.addEventListener("input", () => renderUsers(allUsers)));
});

document.getElementById("clear-filters").addEventListener("click", () => {
  document.querySelectorAll(".users-filters input, .users-filters select")
    .forEach(el => el.value = "");
  const allUsers = JSON.parse(localStorage.getItem("users")) || [];
  renderUsers(allUsers);
});