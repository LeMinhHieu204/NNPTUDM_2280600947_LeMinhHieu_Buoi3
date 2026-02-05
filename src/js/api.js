const BASE_URL = "https://api.escuelajs.co/api/v1/products";

export async function fetchProducts() {
  // API nay co the tra ve it ban ghi neu khong truyen paging
  const res = await fetch(`${BASE_URL}?offset=0&limit=200`);
  if (!res.ok) throw new Error("Không tải được danh sách sản phẩm.");
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function updateProduct(id, payload) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Cập nhật thất bại.");
  return res.json();
}

export async function createProduct(payload) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Tạo sản phẩm thất bại.");
  return res.json();
}
