document.addEventListener("DOMContentLoaded", () => {
  let promoCodes = JSON.parse(localStorage.getItem("promoCodes")) || [];
  const promoList = document.getElementById("promo-list");
  const addBtn = document.getElementById("add-promo-btn");

  function renderPromoCodes() {
    promoList.innerHTML = "";
    promoCodes.forEach((promo, index) => {
      const formattedValue = promo.type === "percent" 
        ? `${promo.value}%` 
        : `$${promo.value}`;
      const valueClass = promo.type === "percent" ? "promo-value percent" : "promo-value fixed";

      const card = document.createElement("div");
      card.className = "promo-card";
      card.innerHTML = `
        <div class="promo-row">
          <div class="editable code" data-index="${index}" data-field="code">${promo.code}</div>
          <div class="editable ${valueClass}" data-index="${index}" data-field="value">${formattedValue}</div>
          <div><button class="delete-btn" data-index="${index}">x</button></div>
        </div>
        <div class="promo-desc editable" data-index="${index}" data-field="desc">${promo.desc}</div>
      `;
      promoList.appendChild(card);
    });

    // Bind delete buttons
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.dataset.index;
        showDeleteConfirm(idx);
      });
    });

    // Bind editable fields
    document.querySelectorAll(".editable").forEach(el => {
      el.addEventListener("click", () => makeEditable(el));
    });
  }

  function makeEditable(el) {
    const index = el.dataset.index;
    const field = el.dataset.field;
    const oldValue = el.textContent;

    const input = document.createElement("input");
    input.type = "text";
    input.value = oldValue;
    input.className = "editable-input";

    el.replaceWith(input);
    input.focus();

    input.addEventListener("blur", () => {
      let newValue = input.value.trim();
      if (field === "value") {
        // detect type by suffix
        if (newValue.endsWith("%")) {
          promoCodes[index].type = "percent";
          promoCodes[index].value = parseFloat(newValue.replace("%", "")) || 0;
        } else if (newValue.startsWith("$")) {
          promoCodes[index].type = "fixed";
          promoCodes[index].value = parseFloat(newValue.replace("$", "")) || 0;
        }
      } else {
        promoCodes[index][field] = newValue;
      }
      localStorage.setItem("promoCodes", JSON.stringify(promoCodes));
      renderPromoCodes();
    });
  }

  function showDeleteConfirm(index) {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";

    const panel = document.createElement("div");
    panel.className = "confirm-panel";
    panel.innerHTML = `
      <p>Are you sure you want to delete this promo code?</p>
      <button class="confirm-yes">Yes</button>
      <button class="confirm-no">No</button>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    panel.querySelector(".confirm-yes").addEventListener("click", () => {
      promoCodes.splice(index, 1);
      localStorage.setItem("promoCodes", JSON.stringify(promoCodes));
      renderPromoCodes();
      overlay.remove();
    });

    panel.querySelector(".confirm-no").addEventListener("click", () => {
      overlay.remove();
    });
  }

  // Add promo code at the top
  addBtn.addEventListener("click", () => {
    const newPromo = {
      code: "NEWCODE",
      type: "percent",
      value: 5,
      desc: "5% off your order"
    };
    promoCodes.unshift(newPromo); // insert at index 0
    localStorage.setItem("promoCodes", JSON.stringify(promoCodes));
    renderPromoCodes();
  });

  // Initial render
  renderPromoCodes();
});