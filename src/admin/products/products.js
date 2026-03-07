let productItems = JSON.parse(localStorage.getItem("products")) || [];

const WARNING_AMOUNT = 15;   // Yellow
const DANGEROUS_AMOUNT = 10; // Red

// Build brand list dynamically from products
const brandSet = new Set(productItems.map(p => p.brand));
const brandList = Array.from(brandSet).map(brand => ({
	label: brand,
	key: brand
}));

// Track selected brands
const selectedBrands = new Map();
const brandButtons = new Map();
brandList.forEach(brand => selectedBrands.set(brand.key, false));

// Filter container (what’s currently displayed)
let filteredItems = productItems.slice(); // start with all products
let pageIndex = 1;
const itemsPerPage = 9;

// -----------------------------
// Item
// -----------------------------

// Render a single product card
function renderItem(item) {
	const card = document.createElement("div");
	card.className = "product-card";

	// Decide background color based on amount
	let amountClass = "";
	if (item.amount <= DANGEROUS_AMOUNT) {
		amountClass = "dangerous";
	} else if (item.amount <= WARNING_AMOUNT) {
		amountClass = "warning";
	} else {
		amountClass = "safe"; // > WARNING_AMOUNT
	}

	card.innerHTML = `
    <div class="product-header">
      <img src="${"../../../" + item.image}" alt="${item.name}" />
      <div class="info">
        <h3>${item.name}</h3>
        <div class="category">${item.brand}</div>
        <div class="price">$${item.price.toFixed(2)}</div>
      </div>
      <button class="edit-btn">Edit</button>
    </div>
    <div class="product-description">${item.description}</div>
    <div class="product-stats">
      <div class="stats-left">
        <div>Tag: ${item.tag}</div>
        <div>Colors: ${item.colors.map(c => c.name).join(", ")}</div>
        <div>Sizes: ${item.sizes.map(s => s.val).join(", ")}</div>
      </div>
      <div class="amount-display ${amountClass}">Amount: ${item.amount}</div>
    </div>
  `;

	card.querySelector(".edit-btn").addEventListener("click", () => openEditPanel(item));
	return card;
}

function openEditPanel(item) {
	// Create overlay
	const overlay = document.createElement("div");
	overlay.className = "overlay";

	const panel = document.createElement("div");
	panel.className = "edit-panel";

	// Build color inputs
	const colorInputs = item.colors.map((c, i) => `
    <label>Color ${i + 1}:
      <input type="text" value="${c.name}" class="edit-color" data-index="${i}" />
    </label>
  `).join("");

	// Build size checkboxes
	const sizeInputs = item.sizes.map((s, i) => `
    <label>
      <input type="checkbox" class="edit-size" data-index="${i}" ${s.available ? "checked" : ""} />
      Size ${s.val}
    </label>
  `).join("");

	panel.innerHTML = `
    <div class="panel-container">
      <!-- Left side: Image holder -->
      <div class="panel-left">
        <h3>Edit Image</h3>
        <div class="image-holder" id="edit-image-holder">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <input type="file" id="edit-image" accept="image/*" />
      </div>

      <!-- Right side: Product details -->
      <div class="panel-right">
        <h2>Edit Product</h2>
        <label>Name: <input type="text" value="${item.name}" id="edit-name" /></label>
        <label>Brand: <input type="text" value="${item.brand}" id="edit-brand" /></label>
        <label>Price: <input type="number" value="${item.price}" id="edit-price" /></label>
        <label>Tag: <input type="text" value="${item.tag}" id="edit-tag" /></label>
        <label>Description: <textarea id="edit-description">${item.description}</textarea></label>

        <h3>Colors</h3>
        ${colorInputs}

        <h3>Sizes</h3>
        ${sizeInputs}

        <div class="panel-actions">
          <button id="cancel-edit">Cancel</button>
          <button id="save-edit">Save</button>
        </div>
      </div>
    </div>
  `;

	overlay.appendChild(panel);
	document.body.appendChild(overlay);

	// Preview uploaded image
	document.getElementById("edit-image").addEventListener("change", (event) => {
		const file = event.target.files[0];
		if (file) {
			const preview = document.querySelector("#edit-image-holder img");
			preview.src = URL.createObjectURL(file);
		}
	});

	// Cancel button
	document.getElementById("cancel-edit").addEventListener("click", () => {
		panel.remove();
		overlay.remove();
	});

	// Save button
	document.getElementById("save-edit").addEventListener("click", () => {
		item.name = document.getElementById("edit-name").value;
		item.brand = document.getElementById("edit-brand").value;
		item.price = parseFloat(document.getElementById("edit-price").value);
		item.tag = document.getElementById("edit-tag").value;
		item.description = document.getElementById("edit-description").value;

		// Update colors
		document.querySelectorAll(".edit-color").forEach(input => {
			const idx = parseInt(input.dataset.index, 10);
			item.colors[idx].name = input.value;
		});

		// Update sizes availability
		document.querySelectorAll(".edit-size").forEach(input => {
			const idx = parseInt(input.dataset.index, 10);
			item.sizes[idx].available = input.checked;
		});

		// Update image if new file chosen
		const imageInput = document.getElementById("edit-image");
		if (imageInput.files.length > 0) {
			item.image = URL.createObjectURL(imageInput.files[0]);
		}

		// Save back to localStorage
		const index = productItems.findIndex(p => p.id === item.id);
		if (index !== -1) {
			productItems[index] = item;
			localStorage.setItem("products", JSON.stringify(productItems));
		}

		// Refresh UI
		filterItems();
		panel.remove();
		overlay.remove();
	});
}

function openAddPanel() {
	const overlay = document.createElement("div");
	overlay.className = "overlay";

	const panel = document.createElement("div");
	panel.className = "edit-panel";

	panel.innerHTML = `
    <div class="panel-container">
      <!-- Left side: Image upload -->
      <div class="panel-left">
		<h3>Upload Image</h3>
		<div class="image-holder" id="image-holder">
			<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPSIjZGRkZGRkIi8+" 
				alt="Default placeholder" />
		</div>
		<input type="file" id="new-image" accept="image/*" />
	</div>

      <!-- Right side: Product details -->
      <div class="panel-right">
        <h2>Add New Product</h2>
        <label>Name: <input type="text" id="new-name" /></label>
        <label>Brand: <input type="text" id="new-brand" /></label>
        <label>Price: <input type="number" id="new-price" /></label>
        <label>Tag: <input type="text" id="new-tag" /></label>
        <label>Description: <textarea id="new-description"></textarea></label>

        <h3>Colors</h3>
        <label>Color Name: <input type="text" id="new-color-name" /></label>

        <h3>Sizes</h3>
        <label>Size 1: <input type="number" id="new-size1" /></label>
        <label>Size 2: <input type="number" id="new-size2" /></label>

        <div class="panel-actions">
          <button id="cancel-add">Cancel</button>
          <button id="save-add">Save</button>
        </div>
      </div>
    </div>
  `;

	overlay.appendChild(panel);
	document.body.appendChild(overlay);

	document.getElementById("new-image").addEventListener("change", (event) => {
		const file = event.target.files[0];
		if (file) {
			const preview = document.querySelector("#image-holder img");
			preview.src = URL.createObjectURL(file);
		}
	});

	// Cancel button
	document.getElementById("cancel-add").addEventListener("click", () => {
		overlay.remove();
		panel.remove();
	});

	// Save button
	document.getElementById("save-add").addEventListener("click", () => {
		productItems = JSON.parse(localStorage.getItem("products")) || [];

		const maxId = productItems.length > 0
			? Math.max(...productItems.map(p => p.id))
			: 0;

		// Get uploaded image file
		const imageInput = document.getElementById("new-image");
		let imagePath = "";
		if (imageInput.files.length > 0) {
			imagePath = URL.createObjectURL(imageInput.files[0]); // temporary preview path
		}

		const newProduct = {
			id: maxId + 1,
			name: document.getElementById("new-name").value,
			brand: document.getElementById("new-brand").value,
			price: parseFloat(document.getElementById("new-price").value),
			tag: document.getElementById("new-tag").value,
			image: imagePath,
			description: document.getElementById("new-description").value,
			amount: 0, // always start at 0
			colors: [{
				name: document.getElementById("new-color-name").value,
				selected: true
			}],
			sizes: [
				{ val: parseInt(document.getElementById("new-size1").value, 10), available: true },
				{ val: parseInt(document.getElementById("new-size2").value, 10), available: true }
			]
		};

		productItems.push(newProduct);
		localStorage.setItem("products", JSON.stringify(productItems));

		filterItems();
		refreshBrandCounts();
		panel.remove();
	});
}


// -----------------------------
// Filter
// -----------------------------

// Filter items based on categories
function filterItems() {
	const activeBrands = Array.from(selectedBrands.entries())
		.filter(([_, isSelected]) => isSelected)
		.map(([brand]) => brand);

	let filtered;

	if (activeBrands.length === 0) {
		filtered = productItems.slice(); // all products
	} else {
		filtered = productItems.filter(item => activeBrands.includes(item.brand));
	}

	filteredItems = filtered;
	const pageSlice = filteredItems.slice((pageIndex - 1) * itemsPerPage, pageIndex * itemsPerPage);
	renderItems(pageSlice);

	const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
	renderPaginationBar(totalPages);
}

function renderItems(items) {
	const grid = document.getElementById("product-grid");
	grid.innerHTML = "";

	items.forEach(item => {
		grid.appendChild(renderItem(item));
	});
}

// Go to a specific page
function goToPage(page) {
	const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
	if (page < 1 || page > totalPages) return;

	pageIndex = page;

	const start = (pageIndex - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	const pageSlice = filteredItems.slice(start, end);
	renderItems(pageSlice);
	renderPaginationBar(totalPages);
}

// Render pagination bar
function renderPaginationBar(totalPages) {
	const pagination = document.getElementById("pagination");
	pagination.innerHTML = "";

	// Previous button
	if (pageIndex > 1) {
		const prevBtn = document.createElement("button");
		prevBtn.className = "page-btn";
		prevBtn.textContent = "Previous";
		prevBtn.addEventListener("click", () => goToPage(pageIndex - 1));
		pagination.appendChild(prevBtn);
	}

	// Page number buttons
	for (let i = 1; i <= totalPages; i++) {
		const btn = document.createElement("button");
		btn.className = "page-btn";
		if (i === pageIndex) btn.classList.add("active");
		btn.textContent = i;
		btn.addEventListener("click", () => goToPage(i));
		pagination.appendChild(btn);
	}

	// Next button
	if (pageIndex < totalPages) {
		const nextBtn = document.createElement("button");
		nextBtn.className = "page-btn";
		nextBtn.textContent = "Next";
		nextBtn.addEventListener("click", () => goToPage(pageIndex + 1));
		pagination.appendChild(nextBtn);
	}
}

// -----------------------------
// Category on sidebar
// -----------------------------

function updateBrandCounts(items) {
	brandList.forEach(({ key }) => {
		const btn = document.querySelector(`.brand-count[data-brand="${key}"]`);
		if (btn) btn.textContent = "0";
	});

	items.forEach(item => {
		const btn = document.querySelector(`.brand-count[data-brand="${item.brand}"]`);
		if (btn) {
			const currentCount = parseInt(btn.textContent, 10) || 0;
			btn.textContent = currentCount + 1;
		}
	});
}

function refreshBrandCounts() {
	updateBrandCounts(productItems);
}

function createBrandButton({ label, key }) {
	const container = document.createElement("div");
	container.className = "brand-button";
	container.setAttribute("data-brand", key);

	const nameSpan = document.createElement("span");
	nameSpan.textContent = label;

	const countBtn = document.createElement("button");
	countBtn.className = "brand-count";
	countBtn.textContent = "0";
	countBtn.setAttribute("data-brand", key);

	// Entire container is clickable
	container.addEventListener("click", () => {
		const current = selectedBrands.get(key);
		selectedBrands.set(key, !current);

		// Remove all highlights
		document.querySelectorAll(".brand-count").forEach(btn => {
			btn.classList.remove("active");
		});

		// Highlight selected ones
		selectedBrands.forEach((isSelected, brand) => {
			const btn = document.querySelector(`.brand-count[data-brand="${brand}"]`);
			if (btn && isSelected) {
				btn.classList.add("active");
			}
		});

		// Filter and update pagination
		filterItems();
	});

	container.appendChild(nameSpan);
	container.appendChild(countBtn);
	return container;
}

function renderBrandBar() {
	const sidebar = document.querySelector(".sidebar");
	const section = document.createElement("div");
	section.className = "brand-section";

	const title = document.createElement("h2");
	title.textContent = "Brands";
	section.appendChild(title);

	brandList.forEach(brand => {
		section.appendChild(createBrandButton(brand));
	});

	sidebar.appendChild(section);

	// Update counts after buttons are created
	updateBrandCounts(productItems);
}


// -----------------------------
// Initialize
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
	productItems = JSON.parse(localStorage.getItem("products")) || [];
	renderBrandBar();
	refreshBrandCounts();
	filterItems(); // ensures all items are shown by default
	renderPaginationBar(Math.ceil(productItems.length / itemsPerPage));

	// Attach event to ADD NEW PRODUCT button
	const addBtn = document.querySelector(".add-product-btn");
	if (addBtn) {
		addBtn.addEventListener("click", openAddPanel);
	}
});