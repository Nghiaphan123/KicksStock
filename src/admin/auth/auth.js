/* ============================================================
   auth.js — trang Admin Login
   Dùng chung localStorage: 'users' + 'currentUser'
============================================================ */

function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

/* ID tự tăng: lấy max id hiện có + 1 — đồng bộ với initilization.js (id: 1,2,3...) */
function generateUserId() {
    const users = getUsers();
    if (users.length === 0) return 1;
    return Math.max(...users.map(u => Number(u.id) || 0)) + 1;
}

function toggleForm(form) {
    const loginEl    = document.getElementById('login-container');
    const registerEl = document.getElementById('register-container');
    if (form === 'register') {
        loginEl.classList.add('hidden');
        registerEl.classList.remove('hidden');
    } else {
        registerEl.classList.add('hidden');
        loginEl.classList.remove('hidden');
    }
}

/* ============================================================
   ĐĂNG KÝ
   inputs: [0] name  [1] email  [2] phone  [3] pass  [4] confirm
   select: #register-role → 'admin' | 'customer'
============================================================ */
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const inputs   = this.querySelectorAll('input:not([type="submit"])');
    const name     = inputs[0].value.trim();
    const email    = inputs[1].value.trim();
    const phone    = inputs[2].value.trim();
    const password = inputs[3].value;
    const confirm  = inputs[4].value;
    const role     = document.getElementById('register-role').value;

    if (!role) {
        alert('Vui lòng chọn Role.');
        return;
    }
    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
        alert('Email này đã được đăng ký.');
        return;
    }

    const newUser = {
        id: generateUserId(), name, email, phone, password,
        role, status: 'active',
        address: [], cart: [], orders: []
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    if (role === 'admin') {
        // Tự đăng nhập và vào dashboard luôn
        localStorage.setItem('currentUser', JSON.stringify({
            id: newUser.id, name: newUser.name,
            email: newUser.email, role: newUser.role
        }));
        localStorage.removeItem('shoppingCart');
        alert('Tạo tài khoản Admin thành công!');
        window.location.href = '../dashboard/dashboard.html';
    } else {
        alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
        this.reset();
        toggleForm('login');
    }
});

/* ============================================================
   ĐĂNG NHẬP — chỉ admin mới được vào dashboard
============================================================ */
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const inputs   = this.querySelectorAll('input:not([type="submit"])');
    const email    = inputs[0].value.trim();
    const password = inputs[1].value;

    const users = getUsers();
    const user  = users.find(u => u.email === email);

    if (!user) {
        alert('Không tìm thấy tài khoản.');
        return;
    }
    if (user.status === 'banned') {
        alert('Tài khoản đã bị khóa.');
        return;
    }
    if (user.password !== password) {
        alert('Sai mật khẩu.');
        return;
    }
    if (user.role !== 'admin') {
        alert('⛔ Bạn không có quyền truy cập trang quản trị.');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify({
        id: user.id, name: user.name,
        email: user.email, role: user.role
    }));
    localStorage.removeItem('shoppingCart');

    window.location.href = '../dashboard/dashboard.html';
});