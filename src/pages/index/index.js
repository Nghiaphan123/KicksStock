/* ============================================================
   KICKS - index.js
   Tích hợp: Products Data + Users Init + Auth Guard +
             Cart↔User Sync + Filter + Grid + Detail + Mini Cart
============================================================ */

/* ============================================================
   1. PRODUCT DATA
============================================================ */

/* ============================================================
   3. HELPERS DÙNG CHUNG
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

/* Products — luôn đọc từ localStorage để đồng bộ với admin */
function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || products;
}
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}
function reloadProducts() {
    const fresh = JSON.parse(localStorage.getItem('products'));
    if (fresh) {
        products.length = 0;
        fresh.forEach(p => products.push(p));
    }
}

/* ============================================================
   4. CART ↔ USER SYNC
============================================================ */

// Khi vào trang: load cart từ user đang đăng nhập vào shoppingCart
function loadCartFromUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const users = getUsers();
    const user = users.find(u => u.id === currentUser.id);
    if (user && Array.isArray(user.cart)) {
        localStorage.setItem('shoppingCart', JSON.stringify(user.cart));
    }
}

// Sau mỗi thay đổi cart: ghi ngược vào users[]
function syncCartToUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const users = getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
        users[idx].cart = cart;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

/* ============================================================
   5. TOAST NOTIFICATION
============================================================ */
function showToast(message, type = 'success', duration = 3000) {
    // Inject styles once
    if (!document.getElementById('kicks-toast-style')) {
        const style = document.createElement('style');
        style.id = 'kicks-toast-style';
        style.innerHTML = `
            #kicks-toast-container {
                position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                z-index: 99999; display: flex; flex-direction: column;
                align-items: center; gap: 10px; pointer-events: none;
            }
            .kicks-toast {
                display: flex; align-items: center; gap: 12px;
                background: #222; color: #fff;
                padding: 14px 22px; border-radius: 12px;
                font-family: 'Rubik', sans-serif; font-size: 14px; font-weight: 600;
                box-shadow: 0 8px 30px rgba(0,0,0,0.25);
                animation: toastIn 0.35s cubic-bezier(.21,1.02,.73,1) forwards;
                pointer-events: all; max-width: 380px;
                border-left: 4px solid #4f6bf5;
            }
            .kicks-toast.success { border-left-color: #4f6bf5; }
            .kicks-toast.error   { border-left-color: #e74c3c; background: #2d1010; }
            .kicks-toast.info    { border-left-color: #f39c12; }
            .kicks-toast.out     { animation: toastOut 0.3s ease forwards; }
            .kicks-toast img {
                width: 42px; height: 42px; border-radius: 6px;
                object-fit: cover; flex-shrink: 0; background: #444;
            }
            .kicks-toast-body { display: flex; flex-direction: column; gap: 2px; }
            .kicks-toast-title { font-size: 13px; opacity: 0.7; font-weight: 500; }
            .kicks-toast-msg   { font-size: 14px; font-weight: 700; }
            @keyframes toastIn  { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
            @keyframes toastOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(10px) scale(0.95); } }
        `;
        document.head.appendChild(style);
    }
    // Create container if not present
    let container = document.getElementById('kicks-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'kicks-toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `kicks-toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('out');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
}

function showCartToast(product, size, color) {
    showToast(`
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
        <div class="kicks-toast-body">
            <span class="kicks-toast-title">Added to cart ✓</span>
            <span class="kicks-toast-msg">${product.name}</span>
            <span style="font-size:12px;opacity:0.65;font-weight:500;">Size ${size} · ${color}</span>
        </div>
    `, 'success', 3000);
}

/* ============================================================
   5b. PAGE NAVIGATION (SPA)
============================================================ */
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
    if (pageId === 'page-cart') {
        renderCart();
        updateCartSummary();
        const btnCheckout = document.querySelector('.btn-checkout');
        if (btnCheckout) btnCheckout.onclick = openCheckoutSlide;
        updateCartPageHeader();
    }
    if (pageId === 'page-index') {
        updateHeaderGreeting();
        updateCartIconCount();
    }
}

/* ============================================================
   6. AUTH MODAL
============================================================ */
function openAuthModal(form) {
    document.getElementById('auth-modal').classList.add('active');
    toggleAuthForm(form || 'login');
}
function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}
function toggleAuthForm(form) {
    const login = document.getElementById('login-container');
    const reg   = document.getElementById('register-container');
    if (form === 'register') { login.classList.add('hidden'); reg.classList.remove('hidden'); }
    else                     { reg.classList.add('hidden');   login.classList.remove('hidden'); }
}

// ĐĂNG KÝ
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const inputs   = this.querySelectorAll('input:not([type="submit"])');
    const name     = inputs[0].value.trim();
    const email    = inputs[1].value.trim();
    const phone    = inputs[2].value.trim();
    const password = inputs[3].value;
    const confirm  = inputs[4].value;

    if (password !== confirm) { alert('Passwords do not match!'); return; }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
        alert('Email này đã được đăng ký. Vui lòng đăng nhập.');
        return;
    }

    const newUser = {
        id: generateUserId(), name, email, phone, password,
        role: 'customer', status: 'active',
        address: [], cart: [], orders: []
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
    this.reset();
    toggleAuthForm('login');
});

// ĐĂNG NHẬP
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const inputs   = this.querySelectorAll('input:not([type="submit"])');
    const email    = inputs[0].value.trim();
    const password = inputs[1].value;

    const users = getUsers();
    const user  = users.find(u => u.email === email);

    if (!user)                    { alert('Không tìm thấy tài khoản. Vui lòng đăng ký.'); return; }
    if (user.status === 'banned') { alert('Tài khoản của bạn đã bị khóa.'); return; }
    if (user.password !== password){ alert('Sai mật khẩu.'); return; }

    // Lưu currentUser
    localStorage.setItem('currentUser', JSON.stringify({
        id: user.id, name: user.name, email: user.email, role: user.role
    }));

    // Load cart của user vào shoppingCart
    if (Array.isArray(user.cart) && user.cart.length > 0) {
        localStorage.setItem('shoppingCart', JSON.stringify(user.cart));
    } else {
        localStorage.removeItem('shoppingCart');
    }

    closeAuthModal();
    updateHeaderGreeting();
    updateCartPageHeader();
    updateCartIconCount();
    cartBottom.renderCart();
    alert('Đăng nhập thành công! Chào mừng, ' + user.name + '!');
});

/* ============================================================
   7. PROFILE MODAL
============================================================ */
function openProfileModal() {
    const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUserInfo) { openAuthModal('login'); return; }

    const usersList  = getUsers();
    const userIndex  = usersList.findIndex(u => u.id === currentUserInfo.id);
    if (userIndex === -1) { alert('Lỗi dữ liệu tài khoản!'); return; }

    const fullUser = usersList[userIndex];
    document.getElementById('display-user-name').innerText = fullUser.name;
    document.getElementById('prof-name').value             = fullUser.name;
    document.getElementById('prof-email').value            = fullUser.email;
    document.getElementById('prof-password').value         = '';

    renderProfileAddressList(fullUser.address || []);
    renderOrdersList(fullUser.orders || []);

    // Reset tab về Account Details
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-info').classList.add('active');
    document.querySelectorAll('.profile-nav li').forEach(li => li.classList.remove('active'));
    document.querySelector('.profile-nav li').classList.add('active');

    document.getElementById('profile-modal').classList.add('active');
}

// Render danh sách địa chỉ dạng ol trong profile
function renderProfileAddressList(addresses) {
    const container = document.getElementById('prof-address-list');
    if (!container) return;

    if (!addresses || addresses.length === 0) {
        container.innerHTML = `
            <p style="color:#999;font-size:13px;margin-bottom:10px;">Chưa có địa chỉ nào được lưu.</p>`;
    } else {
        const items = addresses.map((addr, i) => `
            <li style="
                padding:12px 16px; border:2px solid ${addr.isDefault ? '#4f6bf5' : '#e0e0e0'};
                border-radius:10px; margin-bottom:8px; cursor:pointer;
                background:${addr.isDefault ? '#f0f4ff' : '#fff'};
                transition:all 0.2s;
                display:flex; justify-content:space-between; align-items:flex-start; gap:10px;
            " onclick="setDefaultAddress(${i})">
                <div style="flex:1;">
                    <div style="font-weight:700;font-size:13px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">
                        ${addr.type}
                        ${addr.isDefault ? '<span style="margin-left:8px;background:#4f6bf5;color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;">Default</span>' : ''}
                    </div>
                    <div style="font-size:14px;color:#222;">${addr.content}</div>
                </div>
                <button onclick="event.stopPropagation();deleteProfileAddress(${i})"
                    style="background:none;border:none;color:#ccc;cursor:pointer;font-size:16px;padding:0 4px;line-height:1;"
                    title="Xóa địa chỉ">✕</button>
            </li>`).join('');
        container.innerHTML = `<ol style="list-style:none;padding:0;margin-bottom:10px;">${items}</ol>`;
    }

    // Always show add-new-address form toggle
    container.innerHTML += `
        <div id="prof-new-addr-wrap" style="margin-top:4px;">
            <button type="button" onclick="toggleProfileNewAddrForm()"
                style="background:none;border:2px dashed #ccc;border-radius:10px;width:100%;
                       padding:10px;color:#888;font-weight:600;font-size:13px;cursor:pointer;
                       transition:all 0.2s;" id="btn-prof-add-addr">
                + Thêm địa chỉ mới
            </button>
            <div id="prof-new-addr-form" style="display:none;margin-top:10px;">
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                    <input id="prof-new-addr-type" type="text" placeholder="Loại (VD: Nhà riêng)"
                        style="flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
                    <input id="prof-new-addr-content" type="text" placeholder="Địa chỉ đầy đủ"
                        style="flex:2;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
                </div>
                <button type="button" onclick="saveProfileNewAddress()"
                    style="background:#4f6bf5;color:#fff;border:none;padding:10px 20px;
                           border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">
                    Lưu địa chỉ
                </button>
            </div>
        </div>`;
}

function toggleProfileNewAddrForm() {
    const form = document.getElementById('prof-new-addr-form');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveProfileNewAddress() {
    const typeInput    = document.getElementById('prof-new-addr-type');
    const contentInput = document.getElementById('prof-new-addr-content');
    const type    = typeInput?.value.trim() || 'Nhà riêng';
    const content = contentInput?.value.trim();
    if (!content) { showToast('<span>Vui lòng nhập địa chỉ!</span>', 'error'); return; }

    const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUserInfo) return;
    const users = getUsers();
    const idx   = users.findIndex(u => u.id === currentUserInfo.id);
    if (idx === -1) return;

    if (!Array.isArray(users[idx].address)) users[idx].address = [];
    const isFirst = users[idx].address.length === 0;
    users[idx].address.push({ id: 'addr_' + Date.now(), type, content, isDefault: isFirst });
    localStorage.setItem('users', JSON.stringify(users));

    showToast(`<span>Đã lưu địa chỉ mới! ✓</span>`, 'success');
    renderProfileAddressList(users[idx].address);
}

function setDefaultAddress(index) {
    const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUserInfo) return;
    const users = getUsers();
    const idx   = users.findIndex(u => u.id === currentUserInfo.id);
    if (idx === -1) return;
    users[idx].address.forEach((a, i) => a.isDefault = (i === index));
    localStorage.setItem('users', JSON.stringify(users));
    renderProfileAddressList(users[idx].address);
}

function deleteProfileAddress(index) {
    const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUserInfo) return;
    const users = getUsers();
    const idx   = users.findIndex(u => u.id === currentUserInfo.id);
    if (idx === -1) return;
    users[idx].address.splice(index, 1);
    // If deleted was default, set first as default
    if (users[idx].address.length > 0 && !users[idx].address.some(a => a.isDefault)) {
        users[idx].address[0].isDefault = true;
    }
    localStorage.setItem('users', JSON.stringify(users));
    renderProfileAddressList(users[idx].address);
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

function switchTab(e, tabId) {
    document.querySelectorAll('.profile-nav li').forEach(li => li.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');

    // Re-fetch orders mỗi lần mở tab để lấy status mới nhất từ admin
    if (tabId === 'orders') {
        const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUserInfo) {
            const users = getUsers();
            const user  = users.find(u => u.id == currentUserInfo.id);
            renderOrdersList(user?.orders || []);
        }
    }
}

function logoutUser() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('shoppingCart'); // Xóa cart tạm
        closeProfileModal();
        updateHeaderGreeting();
        updateCartPageHeader();
        updateCartIconCount();
        cartBottom.renderCart();
    }
}

// LƯU THÔNG TIN PROFILE (name + password only; address managed separately)
document.getElementById('profile-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUserInfo) return;

    const users = getUsers();
    const idx   = users.findIndex(u => u.id === currentUserInfo.id);
    if (idx === -1) return;

    const newName = document.getElementById('prof-name').value.trim();
    const newPass = document.getElementById('prof-password').value;

    users[idx].name = newName;
    if (newPass !== '') users[idx].password = newPass;

    localStorage.setItem('users', JSON.stringify(users));
    currentUserInfo.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUserInfo));

    document.getElementById('display-user-name').innerText = newName;
    document.getElementById('prof-password').value         = '';
    updateHeaderGreeting();
    showToast(`<span>Cập nhật thông tin thành công! ✓</span>`, 'success');
});

// RENDER LỊCH SỬ ĐƠN HÀNG
let _allOrdersForFilter = [];
let _activeStatusFilter = 'all';

function renderOrdersList(ordersArray) {
    _allOrdersForFilter = [...ordersArray].reverse();

    // Build filter bar if not already present
    const tab = document.getElementById('tab-orders');
    if (tab && !document.getElementById('orders-filter-bar')) {
        const bar = document.createElement('div');
        bar.id = 'orders-filter-bar';
        bar.className = 'orders-filter-bar';
        bar.innerHTML = `
            <input type="text" id="order-search-text" placeholder="🔍 Tìm tên sản phẩm..." oninput="applyOrderFilters()">
            <input type="date" id="order-search-date" onchange="applyOrderFilters()">
            <div class="status-filter-btns">
                <button class="status-filter-btn active-filter" data-status="all"    onclick="setOrderStatusFilter('all')">Tất cả</button>
                <button class="status-filter-btn"               data-status="pending" onclick="setOrderStatusFilter('pending')">🟡 Pending</button>
                <button class="status-filter-btn"               data-status="done"    onclick="setOrderStatusFilter('done')">🟢 Done</button>
                <button class="status-filter-btn"               data-status="canceled" onclick="setOrderStatusFilter('canceled')">🔴 Canceled</button>
            </div>`;
        // Insert before the orders-list-container
        const container = document.getElementById('orders-list-container');
        tab.insertBefore(bar, container);
    }

    // Reset filters on fresh load
    _activeStatusFilter = 'all';
    const textInput = document.getElementById('order-search-text');
    const dateInput = document.getElementById('order-search-date');
    if (textInput) textInput.value = '';
    if (dateInput) dateInput.value = '';
    document.querySelectorAll('.status-filter-btn').forEach(b => {
        b.classList.toggle('active-filter', b.dataset.status === 'all');
    });

    applyOrderFilters();
}

function setOrderStatusFilter(status) {
    _activeStatusFilter = status;
    document.querySelectorAll('.status-filter-btn').forEach(b => {
        b.classList.toggle('active-filter', b.dataset.status === status);
    });
    applyOrderFilters();
}

function openOrderDetail(order) {
    // Remove existing if any
    document.getElementById('order-detail-overlay')?.remove();

    const statusClass = order.status.toLowerCase();
    const dateStr = new Date(order.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const itemsHtml = order.items.map(item => `
        <div class="od-item">
            <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}">
            <div class="od-item-info">
                <div class="od-item-name">${item.name}</div>
                <div class="od-item-sub">Size: ${item.size} &nbsp;|&nbsp; Qty: ${item.quantity}</div>
            </div>
            <div class="od-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'order-detail-overlay';
    overlay.className = 'od-overlay';
    overlay.innerHTML = `
        <div class="od-modal">
            <div class="od-header">
                <div>
                    <div class="od-title">Order Details</div>
                    <div class="od-id">${order.orderId}</div>
                </div>
                <button class="od-close" onclick="document.getElementById('order-detail-overlay').remove()">✕</button>
            </div>
            <div class="od-body">
                <div class="od-info-grid">
                    <div class="od-info-item">
                        <span class="od-label">Date</span>
                        <span class="od-value">${dateStr}</span>
                    </div>
                    <div class="od-info-item">
                        <span class="od-label">Status</span>
                        <span class="o-status ${statusClass}">${order.status}</span>
                    </div>
                    <div class="od-info-item">
                        <span class="od-label">Payment</span>
                        <span class="od-value">${order.paymentMethod || 'N/A'}</span>
                    </div>
                    <div class="od-info-item">
                        <span class="od-label">Shipping Address</span>
                        <span class="od-value">${order.shippingAddress || 'N/A'}</span>
                    </div>
                </div>
                <div class="od-divider"></div>
                <div class="od-items-title">Items Ordered</div>
                <div class="od-items">${itemsHtml}</div>
                <div class="od-divider"></div>
                <div class="od-totals">
                    <div class="od-total-row"><span>Subtotal</span><span>$${order.subtotal?.toFixed(2) ?? order.totalPrice.toFixed(2)}</span></div>
                    ${order.discount > 0 ? `<div class="od-total-row" style="color:#27ae60;"><span>Discount ${order.promoCode ? '(' + order.promoCode + ')' : ''}</span><span>-$${order.discount.toFixed(2)}</span></div>` : ''}
                    <div class="od-total-row"><span>Delivery</span><span>${order.delivery === 0 ? 'Free' : '$' + order.delivery?.toFixed(2)}</span></div>
                    <div class="od-total-row od-grand-total"><span>Total</span><span>$${order.totalPrice.toFixed(2)}</span></div>
                </div>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function applyOrderFilters() {
    const searchText = (document.getElementById('order-search-text')?.value || '').toLowerCase().trim();
    const searchDate = document.getElementById('order-search-date')?.value || '';
    const container  = document.getElementById('orders-list-container');

    let filtered = _allOrdersForFilter.filter(order => {
        // Status filter
        if (_activeStatusFilter !== 'all' && order.status.toLowerCase() !== _activeStatusFilter) return false;

        // Date filter (match yyyy-mm-dd against order.date)
        if (searchDate) {
            const orderDate = new Date(order.date).toISOString().slice(0, 10);
            if (orderDate !== searchDate) return false;
        }

        // Text filter: search in product names
        if (searchText) {
            const matched = order.items.some(item => item.name.toLowerCase().includes(searchText));
            if (!matched) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="orders-empty">
                <i class="fas fa-search" style="font-size:32px;color:#ddd;margin-bottom:12px;display:block;"></i>
                Không tìm thấy đơn hàng nào.
            </div>`;
        return;
    }

    let html = '';
    filtered.forEach((order, idx) => {
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div class="order-item-mini">
                    <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}">
                    <div>
                        <div style="font-weight:700;">${item.name}</div>
                        <div style="color:#666;">Size: ${item.size} | Qty: ${item.quantity}</div>
                    </div>
                </div>`;
        });
        const dateStr     = new Date(order.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const statusClass = order.status.toLowerCase();
        html += `
            <div class="order-card" onclick="openOrderDetail(_allOrdersForFilter[${_allOrdersForFilter.indexOf(order)}])" style="cursor:pointer;">
                <div class="order-header">
                    <div>
                        <div class="o-id">${order.orderId}</div>
                        <div class="o-date">${dateStr}</div>
                    </div>
                    <div class="o-status ${statusClass}">${order.status}</div>
                </div>
                <div class="order-items">${itemsHtml}</div>
                <div class="order-footer">
                    <div class="order-total">Total: $${order.totalPrice.toFixed(2)}</div>
                    <span class="od-view-btn">View Details →</span>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

/* ============================================================
   8. HEADER GREETING
============================================================ */
function updateHeaderGreeting() {
    const greetingEl = document.getElementById('header-greeting');
    const userIcon   = document.getElementById('header-user-icon');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!greetingEl) return;
    if (currentUser) {
        greetingEl.innerHTML = `Hi, <span style="color:#4f6bf5;cursor:pointer;" onclick="openProfileModal()">${currentUser.name}</span>!`;
        if (userIcon) userIcon.onclick = openProfileModal;
    } else {
        greetingEl.innerHTML = `<a href="#" onclick="openAuthModal('login');return false;" style="text-decoration:none;color:#666;font-size:13px;">Chưa có tài khoản? <span style="color:#4f6bf5;font-weight:700;">Đăng ký ngay!</span></a>`;
        if (userIcon) userIcon.onclick = () => openAuthModal('login');
    }
}

function updateCartPageHeader() {
    const greetingEl  = document.getElementById('cart-page-greeting');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!greetingEl) return;
    if (currentUser) {
        greetingEl.innerHTML = `Hi, <span style="color:#4f6bf5;cursor:pointer;" onclick="openProfileModal()">${currentUser.name}</span>!`;
    } else {
        greetingEl.innerHTML = `<a href="#" onclick="openAuthModal('login');return false;" style="color:#4f6bf5;text-decoration:none;font-size:13px;">Đăng nhập</a>`;
    }
}

/* ============================================================
   9. PRODUCT DETAIL
============================================================ */
function renderProductDetail(product, shouldScroll = false) {
    const container = document.getElementById('product-detail-section');
    if (!container) return;

    let sizesHtml = product.sizes.map(size => {
        let isDisabled = !size.available ? 'disabled' : '';
        return `<div class="size-btn ${isDisabled}">${size.val}</div>`;
    }).join('');

    let colorsHtml = product.colors.map((colorObj, i) => {
        return `<div class="color-circle ${i===0?'selected':''}" style="background-color:${colorObj.hex};"></div>`;
    }).join('');

    container.innerHTML = `
    <div class="detail-image">
        <span class="tag-badge">${product.tag}</span>
        <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="detail-info">
        <span style="color:#888;font-size:14px;font-weight:600;text-transform:uppercase;">Men's Shoes</span>
        <h1>${product.name}</h1>
        <span class="price">$${product.price.toFixed(2)}</span>
        <div style="margin:10px 0;">
            ${(() => {
                const stock = product.amount ?? 0;
                const color = stock === 0 ? '#e74c3c' : stock <= 5 ? '#f39c12' : '#27ae60';
                const label = stock === 0 ? '✕ Out of stock' : stock <= 5 ? `⚠ Only ${stock} left!` : `✓ In stock (${stock})`;
                return `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;background:${color}18;color:${color};border:1px solid ${color}44;">${label}</span>`;
            })()}
        </div>
        <div style="margin-top:20px;">
            <span class="label">Color</span>
            <div class="color-options">${colorsHtml}</div>
        </div>
        <div>
            <div style="display:flex;justify-content:space-between;">
                <span class="label">Select Size</span>
                <span class="label" style="color:var(--primary-blue);cursor:pointer;">Size Chart</span>
            </div>
            <div class="size-grid">${sizesHtml}</div>
        </div>
        <div class="btn-group">
            <div class="qty-selector">
                <button class="qty-btn" id="qty-minus">−</button>
                <span class="qty-value" id="qty-value">1</span>
                <button class="qty-btn" id="qty-plus">+</button>
            </div>
            <button id="btn-add-to-cart" class="btn btn-black" ${(product.amount ?? 0) === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>Add To Cart</button>
            <button class="btn btn-fav"><i class="far fa-heart"></i></button>
        </div>
        <button id="btn-buy-now" class="btn btn-blue" style="width:100%" ${(product.amount ?? 0) === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>Buy It Now</button>
        <div class="description">
            ${product.description}<br><br>
            This product is excluded from all promotional discounts and offers.
        </div>
    </div>`;

    handleAddToCartLogic(product);

    // Chỉ scroll khi user click, KHÔNG scroll khi init trang (F5)
    if (shouldScroll) {
        window.scrollTo({ behavior: 'smooth', top: container.offsetTop - 20 });
    }
}

/* ============================================================
   10. ADD TO CART LOGIC (Có auth guard + sync)
============================================================ */
function handleAddToCartLogic(product) {
    let selectedSize  = null;
    let selectedColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Standard';
    let selectedQty   = 1;

    // Quantity selector
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus  = document.getElementById('qty-plus');
    const qtyValue = document.getElementById('qty-value');

    function updateQtyButtons() {
        const stock = products.find(p => p.id === product.id)?.amount ?? 0;
        if (qtyMinus) qtyMinus.disabled = selectedQty <= 1;
        if (qtyPlus)  qtyPlus.disabled  = selectedQty >= stock;
        if (qtyValue) qtyValue.textContent = selectedQty;
    }

    if (qtyMinus) qtyMinus.addEventListener('click', () => {
        if (selectedQty > 1) { selectedQty--; updateQtyButtons(); }
    });
    if (qtyPlus) qtyPlus.addEventListener('click', () => {
        const stock = products.find(p => p.id === product.id)?.amount ?? 0;
        if (selectedQty < stock) { selectedQty++; updateQtyButtons(); }
    });
    updateQtyButtons();

    // Chọn size
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
        if (btn.classList.contains('disabled')) return;
        btn.addEventListener('click', function() {
            sizeBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedSize = this.innerText;
        });
    });

    // Chọn màu
    const colorCircles = document.querySelectorAll('.color-circle');
    colorCircles.forEach((circle, i) => {
        circle.addEventListener('click', function() {
            colorCircles.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedColor = product.colors[i].name;
        });
    });

    function addToCart(isBuyNow) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            if (confirm('Bạn cần đăng nhập để thêm vào giỏ hàng.\nNhấn OK để đăng nhập.')) {
                openAuthModal('login');
            }
            return;
        }

        if (!selectedSize) { alert('Vui lòng chọn size trước!'); return; }

        // ✅ KIỂM TRA TỒN KHO TRƯỚC KHI THÊM
        const pIdx = products.findIndex(p => p.id === product.id);
        if (pIdx === -1) return;
        const currentStock = products[pIdx].amount ?? 0;

        // Tính số lượng item này đang có trong cart
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const existIdx = cart.findIndex(i =>
            i.id === product.id && i.size === selectedSize && i.color === selectedColor
        );
        const qtyInCart = existIdx !== -1 ? cart[existIdx].quantity : 0;

        if (currentStock <= 0) {
            showToast('<span>❌ Sản phẩm đã hết hàng!</span>', 'error', 3000);
            return;
        }
        if (selectedQty > currentStock) {
            showToast(`<span>❌ Chỉ còn ${currentStock} sản phẩm trong kho!</span>`, 'error', 3000);
            return;
        }

        // ✅ THÊM VÀO CART
        if (existIdx !== -1) cart[existIdx].quantity += selectedQty;
        else cart.push({
            id: product.id, name: product.name, price: product.price,
            image: product.image, size: selectedSize, color: selectedColor, quantity: selectedQty
        });
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        syncCartToUser();

        // ✅ TRỪ AMOUNT NGAY KHI THÊM VÀO GIỎ
        products[pIdx].amount = currentStock - selectedQty;
        saveProducts();
        renderProductGrid();

        // ✅ RE-RENDER PRODUCT DETAIL để cập nhật stock badge + reset qty
        selectedQty = 1;
        renderProductDetail(products[pIdx], false);

        updateCartIconCount();
        cartBottom.renderCart();

        if (isBuyNow) {
            showPage('page-cart');
        } else {
            showCartToast(product, selectedSize, selectedColor);
        }
    }

    const btnAdd = document.getElementById('btn-add-to-cart');
    const btnBuy = document.getElementById('btn-buy-now');
    if (btnAdd) btnAdd.onclick = () => addToCart(false);
    if (btnBuy) btnBuy.onclick = () => addToCart(true);
}

/* ============================================================
   11. FILTER & GRID
============================================================ */
let state = {
    filters: { brands: [], sizes: [], colors: [], maxPrice: 1000, name: '' },
    currentPage: 1,
    itemsPerPage: 6
};

function toggleFilter(type, value, element) {
    if (type === 'name') {
        state.filters.name = value.toLowerCase().trim();
    } else if (type === 'brand') {
        state.filters.brands.includes(value)
            ? state.filters.brands = state.filters.brands.filter(i => i !== value)
            : state.filters.brands.push(value);
    } else if (type === 'size') {
        const alreadyActive = state.filters.sizes.includes(value);
        // Toggle active class trên đúng button
        document.querySelectorAll('.filter-size-btn').forEach(btn => {
            if (parseInt(btn.innerText) === value) {
                btn.classList.toggle('active', !alreadyActive);
            }
        });
        state.filters.sizes = alreadyActive
            ? state.filters.sizes.filter(i => i !== value)
            : [...state.filters.sizes, value];
    } else if (type === 'color') {
        if (element) element.classList.toggle('active');
        state.filters.colors.includes(value)
            ? state.filters.colors = state.filters.colors.filter(i => i !== value)
            : state.filters.colors.push(value);
    }
    state.currentPage = 1;
    renderProductGrid();
}

function updatePrice(value) {
    document.getElementById('priceValue').innerText = `$${value}`;
    state.filters.maxPrice = parseInt(value);
    state.currentPage = 1;
    renderProductGrid();
}

function getFilteredProducts() {
    return products.filter(p => {
        const nameMatch  = !state.filters.name || p.name.toLowerCase().includes(state.filters.name);
        const brandMatch = state.filters.brands.length === 0 || state.filters.brands.includes(p.brand);
        const priceMatch = p.price <= state.filters.maxPrice;
        const sizeMatch  = state.filters.sizes.length === 0 ||
            state.filters.sizes.some(s => p.sizes.map(sz => sz.val).includes(s));
        const colorMatch = state.filters.colors.length === 0 ||
            state.filters.colors.some(fc =>
                p.colors.some(co => co.hex.toLowerCase() === fc.toLowerCase())
            );
        return nameMatch && brandMatch && priceMatch && sizeMatch && colorMatch;
    });
}

function renderProductGrid() {
    reloadProducts(); // ✅ Sync với localStorage mới nhất từ admin
    const grid       = document.getElementById('grid-container');
    const pagination = document.getElementById('pagination');
    const countLabel = document.getElementById('product-count');
    if (!grid || !pagination) return;

    grid.innerHTML = '';
    pagination.innerHTML = '';

    const filteredData = getFilteredProducts();
    if (countLabel) countLabel.innerText = `(${filteredData.length} items)`;

    if (filteredData.length === 0) {
        grid.innerHTML = '<div style="width:100%;text-align:center;grid-column:1/-1;padding:40px;">No products found.</div>';
        return;
    }

    const totalPages  = Math.ceil(filteredData.length / state.itemsPerPage);
    const startIndex  = (state.currentPage - 1) * state.itemsPerPage;
    const pageProducts = filteredData.slice(startIndex, startIndex + state.itemsPerPage);

    pageProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick   = () => renderProductDetail(product, true);

        const stock      = product.amount ?? 0;
        const stockColor = stock === 0 ? '#e74c3c' : stock <= 5 ? '#f39c12' : '#27ae60';
        const stockLabel = stock === 0 ? 'Out of stock' : `In stock: ${stock}`;

        card.innerHTML = `
            <div class="card-img">
                <span class="card-badge">${product.tag}</span>
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="card-info">
                <div class="card-title">${product.name}</div>
                <div class="card-price">$${product.price.toFixed(2)}</div>
                <div style="display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:20px;
                            font-size:12px;font-weight:700;background:${stockColor}22;
                            color:${stockColor};border:1px solid ${stockColor}44;">
                    ${stockLabel}
                </div>
                <button class="btn-view" ${stock === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>View Product</button>
            </div>`;
        grid.appendChild(card);
    });

    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.innerText  = i;
            btn.className  = `page-btn ${i === state.currentPage ? 'active' : ''}`;
            btn.onclick    = () => {
                state.currentPage = i;
                renderProductGrid();
                document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
            };
            pagination.appendChild(btn);
        }
    }
}

/* ============================================================
   12. NEW DROPS
============================================================ */
function renderNewDrops() {
    reloadProducts(); // ✅ Sync với localStorage mới nhất từ admin
    const container = document.getElementById('new-drops-grid');
    if (!container) return;
    container.innerHTML = '';

    products.slice(0, 4).forEach(item => {
        const card = document.createElement('div');
        card.className = 'drop-card';
        card.innerHTML = `
            <div class="drop-image-wrap">
                <span class="drop-tag">New</span>
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="drop-title">${item.name}</div>
            <button class="btn-drop-view">VIEW PRODUCT - <span>$${item.price}</span></button>`;

        const goToDetail = () => {
            renderProductDetail(item, true); // scroll khi click
        };
        card.querySelector('.btn-drop-view').addEventListener('click', goToDetail);
        card.querySelector('.drop-image-wrap').addEventListener('click', goToDetail);
        container.appendChild(card);
    });
}

/* ============================================================
   13. CART ICON COUNT
============================================================ */
function updateCartIconCount() {
    const cart  = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const total = cart.reduce((s, item) => s + item.quantity, 0);

    // Badge header
    const elCount = document.getElementById('main-cart-count');
    if (elCount) { elCount.innerText = total; elCount.style.display = total > 0 ? 'inline-block' : 'none'; }

    // Badge floating button
    const badge = document.getElementById('cartBadge');
    if (badge) { badge.textContent = total; badge.style.display = total > 0 ? 'flex' : 'none'; }
}

/* ============================================================
   14. MINI CART (FLOATING PANEL)
============================================================ */
class CartBottom {
    constructor() { this.cartKey = 'shoppingCart'; this.init(); }

    getCartData() {
        try { const c = localStorage.getItem(this.cartKey); return c ? JSON.parse(c) : []; }
        catch(e) { return []; }
    }
    getTotalPrice() { return this.getCartData().reduce((s,i) => s + parseFloat(i.price) * (i.quantity||1), 0); }
    getTotalItems() { return this.getCartData().reduce((s,i) => s + (i.quantity||1), 0); }

    toggleCart() {
        const p = document.getElementById('cartPanel');
        if (p) { p.classList.toggle('show'); if (p.classList.contains('show')) this.renderCart(); }
    }
    hideCart() {
        const p = document.getElementById('cartPanel');
        if (p) p.classList.remove('show');
    }

    renderCart() {
        const container = document.getElementById('cartItemsList');
        const totalEl   = document.getElementById('cartTotal');
        const badge     = document.getElementById('cartBadge');
        const cartData  = this.getCartData();
        const totalItems = this.getTotalItems();

        if (badge) { badge.textContent = totalItems; badge.style.display = totalItems > 0 ? 'flex' : 'none'; }
        if (!container) return;

        if (cartData.length === 0) {
            container.innerHTML = '<div class="empty-cart"><p>Giỏ hàng trống</p></div>';
            if (totalEl) totalEl.textContent = '$0.00';
            return;
        }

        container.innerHTML = cartData.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name || 'Sản phẩm'}</h4>
                    <div class="price">$${parseFloat(item.price).toFixed(2)}</div>
                </div>
                <span class="cart-item-quantity">x${item.quantity || 1}</span>
            </div>`).join('');

        if (totalEl) totalEl.textContent = `$${this.getTotalPrice().toFixed(2)}`;
    }

    init() {
        window.addEventListener('storage', e => { if (e.key === this.cartKey) this.renderCart(); });
        document.addEventListener('click', e => {
            const p = document.getElementById('cartPanel');
            const t = document.querySelector('.cart-toggle-btn');
            if (p && p.classList.contains('show') && !p.contains(e.target) && t && !t.contains(e.target)) {
                this.hideCart();
            }
        });
    }
}

const cartBottom = new CartBottom();
function toggleCart() { cartBottom.toggleCart(); }

/* ============================================================
   15. CART PAGE LOGIC
============================================================ */
function renderCart() {
    const cart      = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const container = document.querySelector('.cart-items-container');
    if (!container) return;
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <h3>Your bag is empty</h3>
                <a href="#" onclick="showPage('page-index');return false;"
                   style="color:#4f6bf5;text-decoration:underline;font-weight:bold;">Go Shopping</a>
            </div>`;
        return;
    }

    cart.forEach((item, index) => {
        const imgSrc = item.image || 'https://via.placeholder.com/150';
        container.innerHTML += `
        <div class="cart-item-full">
            <div class="cart-item-img"><img src="${imgSrc}" alt="${item.name}"></div>
            <div class="cart-item-info-full">
                <div class="item-top-row">
                    <span class="item-title">${item.name}</span>
                    <span class="item-price">$${item.price.toFixed(2)}</span>
                </div>
                <span class="item-subtitle">Size: ${item.size}</span>
                <span class="item-subtitle">Color: ${item.color || 'Standard'}</span>
                <div class="item-controls">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <label>Qty:</label>
                        <select class="cart-select" onchange="updateQuantity(${index}, this.value)">
                            ${renderQtyOptions(item.quantity)}
                        </select>
                    </div>
                </div>
                <div class="item-actions-full">
                    <i class="fa-regular fa-trash-can action-icon" onclick="removeItem(${index})" title="Remove"></i>
                </div>
            </div>
        </div>`;
    });
}

function renderQtyOptions(selected) {
    let opts = '';
    for (let i = 1; i <= 10; i++) opts += `<option value="${i}" ${i == selected ? 'selected' : ''}>${i}</option>`;
    return opts;
}

function updateQuantity(index, newQty) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const item    = cart[index];
    const oldQty  = item.quantity;
    const diff    = parseInt(newQty) - oldQty; // dương = thêm, âm = bớt

    // Kiểm tra stock nếu tăng qty
    if (diff > 0) {
        const pIdx = products.findIndex(p => p.id === item.id);
        if (pIdx !== -1 && (products[pIdx].amount ?? 0) < diff) {
            showToast(`<span>❌ Chỉ còn ${products[pIdx].amount ?? 0} sản phẩm trong kho!</span>`, 'error', 3000);
            renderCart(); // reset select về cũ
            return;
        }
        // Trừ thêm amount
        if (pIdx !== -1) {
            products[pIdx].amount = Math.max(0, (products[pIdx].amount ?? 0) - diff);
            saveProducts();
        }
    } else if (diff < 0) {
        // Hoàn trả amount
        const pIdx = products.findIndex(p => p.id === item.id);
        if (pIdx !== -1) {
            products[pIdx].amount = (products[pIdx].amount ?? 0) + Math.abs(diff);
            saveProducts();
        }
    }

    cart[index].quantity = parseInt(newQty);
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    syncCartToUser();
    renderCart();
    updateCartSummary();
    renderProductGrid();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const item = cart[index];

    // ✅ HOÀN TRẢ AMOUNT
    const pIdx = products.findIndex(p => p.id === item.id);
    if (pIdx !== -1) {
        products[pIdx].amount = (products[pIdx].amount ?? 0) + item.quantity;
        saveProducts();
    }

    cart.splice(index, 1);
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    syncCartToUser();
    renderCart();
    updateCartSummary();
    renderProductGrid();
}

function updateCartSummary() {
    const cart       = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const totalItems = cart.reduce((s,i) => s + i.quantity, 0);
    const subtotal   = cart.reduce((s,i) => s + (i.price * i.quantity), 0);
    const shipping   = cart.length > 0 ? 6.99 : 0;
    const total      = subtotal + shipping;

    const elItems    = document.getElementById('summary-total-items');
    const elPrice    = document.getElementById('summary-total-price');
    const elTotal    = document.getElementById('summary-final-total');
    const elCount    = document.getElementById('cart-page-count');

    if (elItems) elItems.innerText = `${totalItems} ITEMS`;
    if (elPrice) elPrice.innerText = `$${subtotal.toFixed(2)}`;
    if (elTotal) elTotal.innerText = `$${total.toFixed(2)}`;
    if (elCount) elCount.innerText = totalItems;
}

/* ============================================================
   16. CHECKOUT SLIDE
============================================================ */
let checkoutSelectedAddressIndex = -1;
let checkoutDeliveryMode  = 'standard';
let checkoutAppliedPromo  = null;
let checkoutPaymentMethod = 'card'; // 'card' | 'cod' | 'momo' | 'zalopay' | 'bank'

const PAYMENT_METHODS = ['card', 'cod', 'momo', 'zalopay', 'bank'];

/* ---- Payment Method ---- */
function selectPaymentMethod(method) {
    checkoutPaymentMethod = method;
    PAYMENT_METHODS.forEach(m => {
        const btn = document.getElementById(`pay-${m}`);
        const frm = document.getElementById(`pf-${m}`);
        if (btn) btn.classList.toggle('selected', m === method);
        if (frm) frm.style.display = m === method ? 'block' : 'none';
    });
}

/* ---- Card number format: 1234 5678 9012 3456 ---- */
function fmtCard(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 16);
    el.value = v.replace(/(.{4})/g, '$1 ').trim();
}

/* ---- Expiry format: MM/YY ---- */
function fmtExpiry(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
    el.value = v;
}

function openCheckoutSlide() {
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }

    checkoutSelectedAddressIndex = -1;
    checkoutDeliveryMode = 'standard';
    checkoutAppliedPromo = null;
    checkoutPaymentMethod = 'card';

    renderCheckoutMiniItems(cart);
    renderCheckoutAddressSection();

    document.getElementById('checkout-panel').classList.add('active');
    document.body.style.overflow = 'hidden';

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const emailField = document.getElementById('checkout-email');
        if (emailField) emailField.value = currentUser.email || '';
    }
}

function renderCheckoutAddressSection() {
    const container = document.getElementById('checkout-address-section');
    if (!container) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) { container.innerHTML = ''; return; }

    const users     = getUsers();
    const userObj   = users.find(u => u.id === currentUser.id);
    const addresses = userObj?.address || [];

    // Chỉ set selectedIndex khi lần đầu render (chưa có lựa chọn nào)
    // KHÔNG override nếu user đã chọn thủ công
    if (checkoutSelectedAddressIndex === -1 || checkoutSelectedAddressIndex >= addresses.length) {
        const defaultIdx = addresses.findIndex(a => a.isDefault);
        checkoutSelectedAddressIndex = defaultIdx !== -1 ? defaultIdx : (addresses.length > 0 ? 0 : -1);
    }

    if (addresses.length === 0) {
        container.innerHTML = buildNewAddressForm(true);
        return;
    }

    const items = addresses.map((addr, i) => `
        <li id="co-addr-item-${i}" onclick="selectCheckoutAddress(${i})"
            style="padding:12px 16px;border:2px solid ${i === checkoutSelectedAddressIndex ? '#4f6bf5' : '#e0e0e0'};
                   border-radius:10px;margin-bottom:8px;cursor:pointer;
                   background:${i === checkoutSelectedAddressIndex ? '#f0f4ff' : '#fff'};
                   transition:all 0.2s;display:flex;align-items:flex-start;gap:10px;">
            <span style="margin-top:2px;font-size:18px;">${i === checkoutSelectedAddressIndex ? '🔵' : '⚪'}</span>
            <div>
                <div style="font-weight:700;font-size:12px;color:#888;text-transform:uppercase;margin-bottom:3px;">
                    ${addr.type}${addr.isDefault ? ' <span style="background:#4f6bf5;color:#fff;padding:1px 7px;border-radius:20px;font-size:11px;margin-left:4px;">Default</span>' : ''}
                </div>
                <div style="font-size:14px;color:#222;">${addr.content}</div>
            </div>
        </li>`).join('');

    container.innerHTML = `
        <h4 style="font-weight:700;margin-bottom:12px;">Shipping Address</h4>
        <ol style="list-style:none;padding:0;margin-bottom:10px;">${items}</ol>
        <button type="button" onclick="toggleCheckoutNewAddrForm()"
            id="btn-co-new-addr"
            style="background:none;border:2px dashed #ccc;border-radius:10px;width:100%;
                   padding:10px;color:#888;font-weight:600;font-size:13px;cursor:pointer;margin-bottom:4px;">
            + New address?
        </button>
        <div id="co-new-addr-form" style="display:none;margin-top:8px;">
            ${buildNewAddressForm(false)}
        </div>`;
}

function updateCheckoutAddressHighlight() {
    // Chỉ update CSS highlight — KHÔNG re-render toàn bộ
    document.querySelectorAll('[id^="co-addr-item-"]').forEach(li => {
        const i = parseInt(li.id.replace('co-addr-item-', ''));
        const selected = i === checkoutSelectedAddressIndex;
        li.style.border      = `2px solid ${selected ? '#4f6bf5' : '#e0e0e0'}`;
        li.style.background  = selected ? '#f0f4ff' : '#fff';
        li.querySelector('span').textContent = selected ? '🔵' : '⚪';
    });
}

function buildNewAddressForm(standalone) {
    return `
        <div style="${standalone ? '' : ''}">
            ${standalone ? '<h4 style="font-weight:700;margin-bottom:12px;">Add a Shipping Address</h4>' : ''}
            <div style="display:flex;gap:8px;margin-bottom:8px;">
                <input id="co-new-addr-type" type="text" placeholder="Type (e.g. Home)"
                    style="flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;outline:none;">
                <input id="co-new-addr-content" type="text" placeholder="Full delivery address*"
                    style="flex:2;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;outline:none;">
            </div>
            <button type="button" onclick="saveAndUseNewCheckoutAddress()"
                style="background:#222;color:#fff;border:none;padding:10px 20px;
                       border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;width:100%;">
                Use this address & Save
            </button>
        </div>`;
}

function selectCheckoutAddress(index) {
    checkoutSelectedAddressIndex = index;
    // Chỉ update highlight DOM — không re-render toàn bộ để tránh reset state
    updateCheckoutAddressHighlight();
    // Ẩn form new address nếu đang mở
    const form = document.getElementById('co-new-addr-form');
    if (form) form.style.display = 'none';
}

function toggleCheckoutNewAddrForm() {
    const form = document.getElementById('co-new-addr-form');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveAndUseNewCheckoutAddress() {
    const typeInput    = document.getElementById('co-new-addr-type');
    const contentInput = document.getElementById('co-new-addr-content');
    const type    = typeInput?.value.trim() || 'Home';
    const content = contentInput?.value.trim();
    if (!content) { showToast('<span>Please enter a delivery address!</span>', 'error'); return; }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const users = getUsers();
    const idx   = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) return;

    if (!Array.isArray(users[idx].address)) users[idx].address = [];

    // Set all existing as non-default, new one as default
    users[idx].address.forEach(a => a.isDefault = false);
    const newAddr = { id: 'addr_' + Date.now(), type, content, isDefault: true };
    users[idx].address.push(newAddr);
    localStorage.setItem('users', JSON.stringify(users));

    checkoutSelectedAddressIndex = users[idx].address.length - 1;
    showToast('<span>Address saved & selected! ✓</span>', 'success');
    renderCheckoutAddressSection();
}

function closeCheckout() {
    document.getElementById('checkout-panel').classList.remove('active');
    document.body.style.overflow = 'auto';
}

/* ---- Delivery Option Selection ---- */
function selectDelivery(mode) {
    checkoutDeliveryMode = mode;
    document.getElementById('delivery-standard').classList.toggle('selected', mode === 'standard');
    document.getElementById('delivery-collect').classList.toggle('selected', mode === 'collect');
    updateCheckoutTotals();
}

/* ---- Promo Code ---- */
function applyPromoCode() {
    const input    = document.getElementById('promo-input');
    const feedback = document.getElementById('promo-feedback');
    const code     = input?.value.trim().toUpperCase();

    if (!code) { feedback.innerHTML = '<span style="color:#e74c3c;">Vui lòng nhập mã.</span>'; return; }

    const promoCodes = JSON.parse(localStorage.getItem('promoCodes')) || [];
    const promo = promoCodes.find(p => p.code === code);

    if (!promo) {
        feedback.innerHTML = '<span style="color:#e74c3c;">❌ Mã không hợp lệ.</span>';
        checkoutAppliedPromo = null;
        updateCheckoutTotals();
        return;
    }

    checkoutAppliedPromo = promo;
    feedback.innerHTML = `<span style="color:#27ae60;">✓ ${promo.desc}
        <span onclick="removePromoCode()" style="margin-left:8px;color:#e74c3c;cursor:pointer;font-weight:700;">[✕ Remove]</span>
    </span>`;
    updateCheckoutTotals();
    showToast(`<div class="kicks-toast-body"><span class="kicks-toast-title">🎉 Promo applied!</span><span class="kicks-toast-msg">${promo.desc}</span></div>`, 'success', 3000);
}

function removePromoCode() {
    checkoutAppliedPromo = null;
    const input    = document.getElementById('promo-input');
    const feedback = document.getElementById('promo-feedback');
    if (input)    input.value = '';
    if (feedback) feedback.innerHTML = '';
    updateCheckoutTotals();
}

function updateCheckoutTotals() {
    const cart     = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const delivery = checkoutDeliveryMode === 'collect' ? 0 : 6.00;

    let discount = 0;
    if (checkoutAppliedPromo) {
        discount = checkoutAppliedPromo.type === 'percent'
            ? subtotal * (checkoutAppliedPromo.value / 100)
            : checkoutAppliedPromo.value;
        discount = Math.min(discount, subtotal);
    }

    const elDelivery     = document.getElementById('co-delivery-cost');
    const elPromoRow     = document.getElementById('co-promo-row');
    const elPromoLabel   = document.getElementById('co-promo-label');
    const elPromoDiscount = document.getElementById('co-promo-discount');
    const elTotal        = document.getElementById('co-final-total');

    if (elDelivery)      elDelivery.innerText = delivery === 0 ? 'Free' : `$${delivery.toFixed(2)}`;
    if (elPromoRow)      elPromoRow.style.display = checkoutAppliedPromo ? 'flex' : 'none';
    if (elPromoLabel && checkoutAppliedPromo) elPromoLabel.innerText = checkoutAppliedPromo.code;
    if (elPromoDiscount) elPromoDiscount.innerText = `-$${discount.toFixed(2)}`;
    if (elTotal)         elTotal.innerText = `$${Math.max(0, subtotal + delivery - discount).toFixed(2)}`;
}

function renderCheckoutMiniItems(cart) {
    const container = document.getElementById('checkout-items-list');
    if (!container) return;
    let subtotal = 0, html = '';

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const imgSrc = item.image || 'https://via.placeholder.com/150';
        html += `
            <div class="co-item">
                <div class="co-img"><img src="${imgSrc}" alt="${item.name}"></div>
                <div class="co-info">
                    <div class="co-name">${item.name}</div>
                    <span class="co-sub">Size: ${item.size} | Qty: ${item.quantity}</span>
                    <span class="co-price">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            </div>`;
    });

    container.innerHTML = html;
    const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
    document.getElementById('co-total-items').innerText = `${itemCount} ITEM${itemCount !== 1 ? 'S' : ''}`;
    document.getElementById('co-subtotal').innerText    = `$${subtotal.toFixed(2)}`;
    updateCheckoutTotals();
}

function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function processPayment() {
    // ✅ KIỂM TRA ĐĂNG NHẬP
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Bạn cần đăng nhập trước khi thanh toán!');
        closeCheckout();
        openAuthModal('login');
        return;
    }

    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }

    // ✅ VALIDATE PAYMENT METHOD
    if (checkoutPaymentMethod === 'card') {
        const num  = document.getElementById('card-number')?.value.replace(/\s/g,'') || '';
        const exp  = document.getElementById('card-expiry')?.value || '';
        const cvv  = document.getElementById('card-cvv')?.value || '';
        const name = document.getElementById('card-name')?.value.trim() || '';
        if (num.length < 16)          { showToast('<span>❌ Số thẻ không hợp lệ!</span>', 'error'); return; }
        if (!/^\d{2}\/\d{2}$/.test(exp)) { showToast('<span>❌ Ngày hết hạn không hợp lệ!</span>', 'error'); return; }
        if (cvv.length < 3)           { showToast('<span>❌ CVV không hợp lệ!</span>', 'error'); return; }
        if (!name)                    { showToast('<span>❌ Vui lòng nhập tên chủ thẻ!</span>', 'error'); return; }
    }

    // ✅ RESOLVE SHIPPING ADDRESS
    const users   = getUsers();
    const userIdx = users.findIndex(u => u.id === currentUser.id);
    const addresses = userIdx !== -1 ? (users[userIdx].address || []) : [];

    let shippingAddress = '';
    if (checkoutSelectedAddressIndex >= 0 && addresses[checkoutSelectedAddressIndex]) {
        shippingAddress = addresses[checkoutSelectedAddressIndex].content;
        // Make selected address the new default
        addresses.forEach((a, i) => a.isDefault = (i === checkoutSelectedAddressIndex));
        if (userIdx !== -1) {
            users[userIdx].address = addresses;
        }
    } else {
        // Fallback: try new address form
        const newContent = document.getElementById('co-new-addr-content')?.value.trim();
        if (!newContent) {
            showToast('<span>Please select or add a delivery address!</span>', 'error', 3500);
            return;
        }
        const newType = document.getElementById('co-new-addr-type')?.value.trim() || 'Home';
        // Save and set as default
        addresses.forEach(a => a.isDefault = false);
        const saved = { id: 'addr_' + Date.now(), type: newType, content: newContent, isDefault: true };
        addresses.push(saved);
        shippingAddress = newContent;
        if (userIdx !== -1) users[userIdx].address = addresses;
    }

    const subtotal = cart.reduce((s,i) => s + (i.price * i.quantity), 0);
    const delivery = checkoutDeliveryMode === 'collect' ? 0 : 6.00;
    let   discount = 0;
    if (checkoutAppliedPromo) {
        discount = checkoutAppliedPromo.type === 'percent'
            ? subtotal * (checkoutAppliedPromo.value / 100)
            : checkoutAppliedPromo.value;
        discount = Math.min(discount, subtotal);
    }
    const total = Math.max(0, subtotal + delivery - discount);

    const newOrder = {
        orderId:         generateOrderId(),
        userId:          currentUser.id,
        customerName:    currentUser.name,
        email:           document.getElementById('checkout-email')?.value || currentUser.email || 'No Email',
        date:            new Date().toISOString(),
        items:           cart,
        subtotal,
        delivery,
        discount,
        promoCode:       checkoutAppliedPromo?.code || null,
        totalPrice:      total,
        status:          'Pending',
        deliveryMode:    checkoutDeliveryMode,
        paymentMethod:   checkoutPaymentMethod,
        shippingAddress
    };

    // Lưu vào allOrders (Admin dùng)
    const allOrders = JSON.parse(localStorage.getItem('allOrders')) || [];
    allOrders.push(newOrder);
    localStorage.setItem('allOrders', JSON.stringify(allOrders));

    // Lưu order vào users[] + xóa cart + cập nhật address default
    if (userIdx !== -1) {
        if (!users[userIdx].orders) users[userIdx].orders = [];
        users[userIdx].orders.push(newOrder);
        users[userIdx].cart = [];
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Amount đã được trừ khi addToCart — không trừ lại ở đây

    localStorage.removeItem('shoppingCart');

    closeCheckout();
    renderCart();
    updateCartSummary();
    cartBottom.renderCart();
    updateCartIconCount();
    renderProductGrid(); // Cập nhật stock badge

    showToast(`
        <div class="kicks-toast-body">
            <span class="kicks-toast-title">🎉 Payment Successful!</span>
            <span class="kicks-toast-msg">${newOrder.orderId}</span>
            <span style="font-size:12px;opacity:0.65;font-weight:500;">Total: $${total.toFixed(2)}</span>
        </div>
    `, 'success', 5000);
}

/* ============================================================
   17. MODAL: ESC + CLICK-OUTSIDE
============================================================ */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeProfileModal();
        closeAuthModal();
        closeCheckout();
    }
});
document.getElementById('profile-modal').addEventListener('click', function(e) {
    if (e.target === this) closeProfileModal();
});
document.getElementById('auth-modal').addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
});

/* ============================================================
   18. INIT
============================================================ */
/* ============================================================
   BANNER SLIDESHOW
============================================================ */
(function() {
    let currentSlide = 0;
    let slideshowTimer = null;
    const INTERVAL = 1000;

    function goToSlide(index) {
        const slides = document.querySelectorAll('.banner-slide');
        const dots   = document.querySelectorAll('.banner-dot');
        const thumbs = document.querySelectorAll('.thumb-item');
        if (!slides.length) return;

        slides[currentSlide].classList.remove('active');
        dots[currentSlide]?.classList.remove('active');
        thumbs[currentSlide]?.classList.remove('active-thumb');

        currentSlide = (index + slides.length) % slides.length;

        slides[currentSlide].classList.add('active');
        dots[currentSlide]?.classList.add('active');
        thumbs[currentSlide]?.classList.add('active-thumb');

        // Reset autoplay timer
        clearInterval(slideshowTimer);
        slideshowTimer = setInterval(() => goToSlide(currentSlide + 1), INTERVAL);
    }

    // Expose globally for onclick
    window.goToSlide = goToSlide;

    document.addEventListener('DOMContentLoaded', () => {
        slideshowTimer = setInterval(() => goToSlide(currentSlide + 1), INTERVAL);
    });
})();

// Scroll to New Drops section
function scrollToNewDrops() {
    const el = document.querySelector('.new-drops-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Scroll to Filter/Search section
function scrollToFilter() {
    const el = document.querySelector('.shop-container');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus vào sidebar search sau khi scroll
        setTimeout(() => {
            const searchInput = document.getElementById('sidebar-search');
            if (searchInput) searchInput.focus();
        }, 600);
    }
}

// Back to Top button — hiện khi scroll xuống 400px
(function () {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
})();
(function () {
    const header = document.querySelector('header');
    if (!header) return;
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
            header.classList.add('nav-hidden');
        } else {
            header.classList.remove('nav-hidden');
        }
        header.classList.toggle('nav-scrolled', currentScrollY > 10);
        lastScrollY = currentScrollY;
    }, { passive: true });
})();
// ✅ Lắng nghe khi admin thay đổi localStorage từ tab khác → tự cập nhật client
window.addEventListener('storage', (e) => {
    if (e.key === 'products') {
        reloadProducts();
        renderProductGrid();
        renderNewDrops();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadCartFromUser();      // Load cart của user đang đăng nhập
    updateHeaderGreeting();
    updateCartIconCount();
    cartBottom.renderCart();
    renderProductGrid();     // Render grid sản phẩm
    renderNewDrops();        // Render new drops
    // Không gọi renderProductDetail ở đây → tránh scroll khi F5
});