const productGrid = document.querySelector("#productGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");

let products = [];
let whatsappNumber = "";

function youtubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    const videoId =
      parsed.hostname.includes("youtu.be")
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get("v");

    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
}

function orderUrl(product) {
  const text = encodeURIComponent(
    `Hello Fashion, mujhe ye product chahiye: ${product.title}`
  );

  if (!whatsappNumber) return `https://wa.me/?text=${text}`;

  return `https://wa.me/${whatsappNumber}?text=${text}`;
}

function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const visible = products.filter((product) => {
    const text = `${product.title} ${product.price} ${product.category} ${product.description}`.toLowerCase();
    return (!search || text.includes(search)) && (!category || product.category === category);
  });

  productGrid.innerHTML = "";
  emptyState.style.display = visible.length ? "none" : "block";

  visible.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const embed = product.video_url ? youtubeEmbedUrl(product.video_url) : "";
    const media = embed
      ? `<iframe class="video-frame" src="${embed}" allowfullscreen></iframe>`
      : product.video_url
        ? `<video class="product-media" src="${product.video_url}" controls></video>`
        : product.image_url
          ? `<img class="product-media" src="${product.image_url}" alt="${product.title}" loading="lazy" />`
          : `<div class="product-media"></div>`;

    card.innerHTML = `
      ${media}
      <div class="product-body">
        <h2>${product.title}</h2>
        <p class="meta">${product.category || "Collection"}</p>
        ${product.price ? `<p class="price">${product.price}</p>` : ""}
        ${product.description ? `<p>${product.description}</p>` : ""}
        <a class="order-link" href="${orderUrl(product)}" target="_blank" rel="noreferrer">Order on WhatsApp</a>
      </div>
    `;

    productGrid.appendChild(card);
  });
}

function renderCategories() {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];

  categoryFilter.innerHTML = `<option value="">All categories</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

async function loadProducts() {
  const response = await fetch("/api/products");
  const data = await response.json();

  products = data.products || [];
  whatsappNumber = data.whatsapp_number || "";
  renderCategories();
  renderProducts();
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
loadProducts();
