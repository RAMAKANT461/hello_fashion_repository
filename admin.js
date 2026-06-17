const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const loginForm = document.querySelector("#loginForm");
const productForm = document.querySelector("#productForm");
const adminProducts = document.querySelector("#adminProducts");
const logoutButton = document.querySelector("#logoutButton");
const resetButton = document.querySelector("#resetButton");

const fields = {
  id: document.querySelector("#productId"),
  title: document.querySelector("#titleInput"),
  price: document.querySelector("#priceInput"),
  category: document.querySelector("#categoryInput"),
  image_url: document.querySelector("#imageInput"),
  video_url: document.querySelector("#videoInput"),
  sort_order: document.querySelector("#sortInput"),
  description: document.querySelector("#descriptionInput"),
  is_active: document.querySelector("#activeInput"),
};

let products = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function showAdmin() {
  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
}

function showLogin() {
  loginPanel.classList.remove("hidden");
  adminPanel.classList.add("hidden");
}

function resetForm() {
  productForm.reset();
  fields.id.value = "";
  fields.sort_order.value = "0";
  fields.is_active.checked = true;
}

function productPayload() {
  return {
    title: fields.title.value.trim(),
    price: fields.price.value.trim(),
    category: fields.category.value.trim(),
    image_url: fields.image_url.value.trim(),
    video_url: fields.video_url.value.trim(),
    sort_order: Number(fields.sort_order.value || 0),
    description: fields.description.value.trim(),
    is_active: fields.is_active.checked,
  };
}

function editProduct(product) {
  fields.id.value = product.id;
  fields.title.value = product.title || "";
  fields.price.value = product.price || "";
  fields.category.value = product.category || "";
  fields.image_url.value = product.image_url || "";
  fields.video_url.value = product.video_url || "";
  fields.sort_order.value = product.sort_order || 0;
  fields.description.value = product.description || "";
  fields.is_active.checked = product.is_active !== false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProducts() {
  adminProducts.innerHTML = "";

  products.forEach((product) => {
    const item = document.createElement("article");
    item.className = "admin-item";
    item.innerHTML = `
      ${product.image_url ? `<img class="admin-thumb" src="${product.image_url}" alt="" />` : `<div class="admin-thumb"></div>`}
      <div>
        <strong>${product.title}</strong>
        <p class="meta">${product.category || "No category"} ${product.price ? `- ${product.price}` : ""}</p>
        <p class="meta">${product.is_active ? "Visible" : "Hidden"}</p>
      </div>
      <div class="admin-actions">
        <button type="button" class="secondary" data-action="edit" data-id="${product.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${product.id}">Delete</button>
      </div>
    `;
    adminProducts.appendChild(item);
  });
}

async function loadAdminProducts() {
  try {
    const data = await api("/api/admin/products");
    products = data.products || [];
    showAdmin();
    renderProducts();
  } catch {
    showLogin();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: document.querySelector("#passwordInput").value }),
    });
    await loadAdminProducts();
  } catch (error) {
    alert(error.message);
  }
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = fields.id.value;
  const payload = productPayload();

  try {
    await api(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetForm();
    await loadAdminProducts();
  } catch (error) {
    alert(error.message);
  }
});

adminProducts.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const product = products.find((item) => String(item.id) === button.dataset.id);
  if (!product) return;

  if (button.dataset.action === "edit") {
    editProduct(product);
    return;
  }

  if (button.dataset.action === "delete" && confirm("Delete this product?")) {
    await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
    await loadAdminProducts();
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  showLogin();
});

resetButton.addEventListener("click", resetForm);
loadAdminProducts();
