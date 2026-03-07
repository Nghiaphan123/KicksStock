document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active from all
      navItems.forEach(i => i.classList.remove('active'));
      // Add active to clicked
      item.classList.add('active');

      // Get target URL directly from data-url
      const targetUrl = item.getAttribute('data-url');
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
  });

  // Highlight the current page automatically
  const currentPath = window.location.pathname.split('/').pop();
  navItems.forEach(item => {
    const targetUrl = item.getAttribute('data-url');
    if (targetUrl.endsWith(currentPath)) {
      item.classList.add('active');
    }
  });

  // Dynamically create Admin Logout button
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'admin-logout-btn';
  logoutBtn.textContent = 'Logout';
  document.body.appendChild(logoutBtn);

  // Redirect on click
  logoutBtn.addEventListener('click', () => {
    window.location.href = '../auth/login-7381408-4194819-admin-login.html';
  });
});