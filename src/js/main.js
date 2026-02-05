import { createProduct, fetchProducts, updateProduct } from "./api.js";
import { exportToCsv } from "./utils.js";

const tbody = document.getElementById("products-tbody");
const searchInput = document.getElementById("search-input");
const pageSizeSelect = document.getElementById("page-size");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const paginationInfo = document.getElementById("pagination-info");
const sortButtons = document.querySelectorAll(".sort-btn");
const exportBtn = document.getElementById("btn-export-csv");
const productModalBody = document.getElementById("product-modal-body");
const editBtn = document.getElementById("btn-edit-product");
const openCreateBtn = document.getElementById("btn-open-create");
const createForm = document.getElementById("create-form");

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortField = "";
let sortDir = "asc";
let selectedItem = null;

const productModal = new bootstrap.Modal(document.getElementById("product-modal"));
const createModal = new bootstrap.Modal(document.getElementById("create-modal"));

init();

async function init() {
  try {
    allProducts = await fetchProducts();
    filteredProducts = [...allProducts];
    bindEvents();
    render();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Loi tai du lieu: ${escapeHtml(error.message)}</td></tr>`;
  }
}

function bindEvents() {
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim().toLowerCase();
    filteredProducts = allProducts.filter((item) =>
      String(item.title || "").toLowerCase().includes(keyword)
    );
    applySort();
    currentPage = 1;
    render();
  });

  pageSizeSelect.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value);
    currentPage = 1;
    render();
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) currentPage--;
    render();
  });

  nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    if (currentPage < totalPages) currentPage++;
    render();
  });

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.field;
      if (sortField === field) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortField = field;
        sortDir = "asc";
      }
      applySort();
      currentPage = 1;
      render();
    });
  });

  exportBtn.addEventListener("click", () => {
    exportToCsv("products-current-view.csv", getCurrentPageRows());
  });

  editBtn.addEventListener("click", async () => {
    if (!selectedItem) return;
    const title = document.getElementById("edit-title")?.value?.trim();
    const price = Number(document.getElementById("edit-price")?.value);
    const description = document.getElementById("edit-description")?.value?.trim();
    const categoryId = Number(document.getElementById("edit-category-id")?.value);
    const image = document.getElementById("edit-image")?.value?.trim();

    if (!title || !price || price < 1 || !description || !categoryId || !image) {
      return alert("Vui long nhap day du thong tin hop le.");
    }

    await updateProduct(selectedItem.id, {
      title,
      price,
      description,
      categoryId,
      images: [image],
    });

    allProducts = await fetchProducts();
    const keyword = searchInput.value.trim().toLowerCase();
    filteredProducts = allProducts.filter((item) =>
      String(item.title || "").toLowerCase().includes(keyword)
    );
    applySort();
    render();
    productModal.hide();
  });

  openCreateBtn.addEventListener("click", () => createModal.show());

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(createForm);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      price: Number(formData.get("price")),
      description: String(formData.get("description") || "").trim(),
      categoryId: Number(formData.get("categoryId")),
      images: [String(formData.get("image") || "").trim()],
    };

    if (!payload.title || !payload.price || payload.price < 1 || !payload.description || !payload.categoryId || !payload.images[0]) {
      return alert("Vui long nhap day du thong tin hop le.");
    }

    await createProduct(payload);
    createForm.reset();
    createModal.hide();

    allProducts = await fetchProducts();
    const keyword = searchInput.value.trim().toLowerCase();
    filteredProducts = allProducts.filter((item) =>
      String(item.title || "").toLowerCase().includes(keyword)
    );
    applySort();
    currentPage = 1;
    render();
  });
}

function render() {
  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const pageRows = getCurrentPageRows();
  if (!pageRows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Khong co du lieu</td></tr>`;
  } else {
    tbody.innerHTML = pageRows
      .map(
        (item) => `
      <tr title="${escapeHtml(item.description || "Khong co mo ta")}">
        <td>${item.id}</td>
        <td>${escapeHtml(item.title)}</td>
        <td>$${item.price}</td>
        <td>${escapeHtml(item.category?.name || "")}</td>
        <td>${renderImages(item.images || [])}</td>
      </tr>
    `
      )
      .join("");
  }

  tbody.querySelectorAll("tr").forEach((tr, idx) => {
    tr.addEventListener("click", () => {
      selectedItem = pageRows[idx];
      if (selectedItem) showDetail(selectedItem);
    });
  });

  paginationInfo.textContent = `Trang ${currentPage}/${totalPages} - Tong ${total} item`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

function getCurrentPageRows() {
  const start = (currentPage - 1) * pageSize;
  return filteredProducts.slice(start, start + pageSize);
}

function applySort() {
  if (!sortField) return;
  const dir = sortDir === "asc" ? 1 : -1;
  filteredProducts.sort((a, b) => {
    if (sortField === "price") return (Number(a.price) - Number(b.price)) * dir;
    return String(a.title || "").localeCompare(String(b.title || "")) * dir;
  });
}

function showDetail(item) {
  productModalBody.innerHTML = `
    <p><strong>ID:</strong> ${item.id}</p>
    <div class="mb-2">
      <label class="form-label">Title</label>
      <input id="edit-title" class="form-control" value="${escapeHtml(item.title)}">
    </div>
    <div class="mb-2">
      <label class="form-label">Price</label>
      <input id="edit-price" type="number" min="1" class="form-control" value="${item.price}">
    </div>
    <div class="mb-2">
      <label class="form-label">Description</label>
      <textarea id="edit-description" class="form-control" rows="3">${escapeHtml(item.description || "")}</textarea>
    </div>
    <div class="mb-2">
      <label class="form-label">Category ID</label>
      <input id="edit-category-id" type="number" min="1" class="form-control" value="${item.category?.id || 1}">
    </div>
    <div class="mb-2">
      <label class="form-label">Image URL</label>
      <input id="edit-image" class="form-control" value="${escapeHtml((item.images || [])[0] || "")}">
    </div>
  `;
  productModal.show();
}

function renderImages(images) {
  if (!images.length) return "";
  return `<img src="${escapeHtml(images[0])}" class="thumb" alt="product image">`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
