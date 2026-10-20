// Escapa caracteres especiales de HTML para interpolar datos variables en diálogos (SweetAlert `html:`).
const MAPA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/[&<>"']/g, (c) => MAPA[c]);
}

export default escapeHtml;
