const productItems = JSON.parse(localStorage.getItem("products")) || [];
const storageList = document.getElementById("storage-list");
const totalPriceEl = document.getElementById("total-price");
let buyNotes = JSON.parse(localStorage.getItem("buyNotes")) || [];
const notesList = document.getElementById("notes-list");
const notesPagination = document.getElementById("notes-pagination");

const PRODUCERS = ["AAA", "BBB", "CCC", "DDD"]; // Global producer list

let notesPageIndex = 1;
const notesPerPage = 5; // show 5 notes per page
// Global warning thresholds
const WARNING_RED = 10;
const WARNING_YELLOW = 15;

// Render product rows
function renderProducts() {
    storageList.innerHTML = "";
    const sortedProducts = [...productItems].sort((a, b) => a.amount - b.amount);

    sortedProducts.forEach(item => {
        const row = document.createElement("div");
        row.className = "product-card-row";

        // Apply warning colors
        if (item.amount < WARNING_RED) {
            row.classList.add("low-stock-red");
        } else if (item.amount < WARNING_YELLOW) {
            row.classList.add("low-stock-yellow");
        }

        row.innerHTML = `
          <div>${item.id}</div>
          <div>${item.name}</div>
          <div>${item.amount}</div>
          <div>$${(item.price * 0.75).toFixed(2)}</div>
          <div><input type="number" class="add-amount" data-id="${item.id}" placeholder="Add amount" /></div>
        `;
        storageList.appendChild(row);
    });

    // Bind input events for live total
    document.querySelectorAll(".add-amount").forEach(input => {
        input.addEventListener("input", calculateTotal);
    });
}

// Render product rows
function renderNotes() {
    notesList.innerHTML = "";
    const start = (notesPageIndex - 1) * notesPerPage;
    const end = start + notesPerPage;
    const reversedNotes = [...buyNotes].reverse();
    const pageNotes = reversedNotes.slice(start, end);

    pageNotes.forEach(note => {
        const card = document.createElement("div");
        card.className = "note-card";
        card.innerHTML = `
            <div>${note.id}</div>
            <div>${note.producer || "N/A"}</div> 
            <div>$${note.total.toFixed(2)}</div>
            <div>${note.date}</div>
        `;
        card.addEventListener("click", () => showNoteDetail(note));
        notesList.appendChild(card);
    });
    renderNotesPagination();
}

function renderNotesPagination() {
    notesPagination.innerHTML = "";
    const totalPages = Math.ceil(buyNotes.length / notesPerPage);

    // Previous button
    if (notesPageIndex > 1) {
        const prevBtn = document.createElement("button");
        prevBtn.className = "page-btn";
        prevBtn.textContent = "Previous";
        prevBtn.addEventListener("click", () => {
            notesPageIndex -= 1;
            renderNotes();
        });
        notesPagination.appendChild(prevBtn);
    }

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = "page-btn";
        if (i === notesPageIndex) btn.classList.add("active");
        btn.textContent = i;
        btn.addEventListener("click", () => {
            notesPageIndex = i;
            renderNotes();
        });
        notesPagination.appendChild(btn);
    }

    // Next button
    if (notesPageIndex < totalPages) {
        const nextBtn = document.createElement("button");
        nextBtn.className = "page-btn";
        nextBtn.textContent = "Next";
        nextBtn.addEventListener("click", () => {
            notesPageIndex += 1;
            renderNotes();
        });
        notesPagination.appendChild(nextBtn);
    }
}

// Calculate total price based on add amount only
function calculateTotal() {
    let total = 0;
    document.querySelectorAll(".add-amount").forEach(input => {
        const id = parseInt(input.dataset.id, 10);
        const addVal = parseInt(input.value, 10) || 0;
        const product = productItems.find(p => p.id === id);
        if (product && addVal > 0) {
            total += (product.price * 0.75) * addVal;
        }
    });
    totalPriceEl.textContent = `Total Price: $${total.toFixed(2)}`;
    return total;
}

function showNoteDetail(note) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  // Create panel
  const panel = document.createElement("div");
  panel.className = "note-detail-panel";

  // Header
    const header = `
        <h2>Note #${note.id}</h2>
        <p>
            <strong>Producer:</strong> 
            <span class="producer-badge">${note.producer || "N/A"}</span>
        </p>
        <p>
            <strong>Total:</strong> 
            <span class="total-badge">$${note.total.toFixed(2)}</span>
        </p>
        <p><strong>Date:</strong> ${note.date}</p>
    `;

  // Product list header
  const listHeader = `
    <div class="detail-row header">
      <div>ID</div>
      <div>Name</div>
      <div>Amount</div>
      <div>Price</div>
      <div>Total</div>
    </div>
  `;

  // Product rows
  const productRows = note.products.map(p => `
    <div class="detail-row">
      <div>${p.id}</div>
      <div>${p.name}</div>
      <div>${p.amount}</div>
      <div>$${p.price.toFixed(2)}</div>
      <div>$${p.total.toFixed(2)}</div>
    </div>
  `).join("");

  panel.innerHTML = `
    <div class="detail-container">
      ${header}
      ${listHeader}
      <div class="detail-list">   
        ${productRows}
      </div>
      <div class="detail-actions">
        <button id="close-detail">Close</button>
      </div>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Close event
  document.getElementById("close-detail").addEventListener("click", () => {
    overlay.remove();
  });
}

// Buy button
// Buy button
document.getElementById("buy-btn").addEventListener("click", () => {
    let total = calculateTotal();
    let boughtIds = [];

    document.querySelectorAll(".add-amount").forEach(input => {
        const id = parseInt(input.dataset.id, 10);
        const addVal = parseInt(input.value, 10) || 0;
        const product = productItems.find(p => p.id === id);
        if (product && addVal > 0) {
            product.amount += addVal;
            boughtIds.push(id);
        }
    });

    if (boughtIds.length > 0) {
        const nextId = buyNotes.length > 0
            ? Math.max(...buyNotes.map(n => parseInt(n.id, 10))) + 1
            : 1;

        // Pick a producer (randomly for this example, or from a selection)
        const randomProducer = PRODUCERS[Math.floor(Math.random() * PRODUCERS.length)];

        // Collect product details
        const productsBought = [];
        document.querySelectorAll(".add-amount").forEach(input => {
            const id = parseInt(input.dataset.id, 10);
            const addVal = parseInt(input.value, 10) || 0;
            const product = productItems.find(p => p.id === id);
            if (product && addVal > 0) {
                productsBought.push({
                    id: product.id,
                    name: product.name,
                    amount: addVal,
                    price: (product.price * 0.75),
                    total: (product.price * 0.75) * addVal
                });
            }
        });

        const note = {
            id: nextId,
            producer: randomProducer,
            total: total,
            date: new Date().toLocaleString(),
            products: productsBought   // save product details
        };

        buyNotes.push(note);
        localStorage.setItem("buyNotes", JSON.stringify(buyNotes));
    }

    localStorage.setItem("products", JSON.stringify(productItems));
    renderProducts();
    calculateTotal();
    renderNotes();
});

// Clear button
document.getElementById("clear-btn").addEventListener("click", () => {
    document.querySelectorAll(".add-amount").forEach(input => {
        input.value = "";
    });
    calculateTotal();
});

document.addEventListener("DOMContentLoaded", () => {
    // Initial render
    renderProducts();
    renderNotes();
    calculateTotal();
});