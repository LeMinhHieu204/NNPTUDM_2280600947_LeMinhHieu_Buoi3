export function exportToCsv(filename, rows) {
  const headers = ["id", "title", "price", "category", "images"];
  const csvRows = [headers.join(",")];

  rows.forEach((item) => {
    const row = [
      item.id,
      escapeCsv(item.title),
      item.price,
      escapeCsv(item.category?.name || ""),
      escapeCsv((item.images || []).join(" | ")),
    ];
    csvRows.push(row.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const v = String(value ?? "");
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
