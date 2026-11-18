import { getBusinesses } from "../api.js";
import { escapeHtml } from "../ui.js";
const list = document.getElementById("business-results");
async function render(term = "") {
  list.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  try {
    const rows = await getBusinesses(term);
    list.innerHTML = rows.length ? rows.map(b => `<article class="business-card"><p class="eyebrow">${escapeHtml(b.category || "Serviço")}</p><h3>${escapeHtml(b.name)}</h3><p>${escapeHtml(b.description || "Conheça os serviços disponíveis.")}</p><p>${escapeHtml(b.address || "")}</p><a class="card-link" href="estabelecimento.html?slug=${encodeURIComponent(b.slug)}">Ver serviços e horários</a></article>`).join("") : '<p class="muted">Nenhum estabelecimento encontrado por enquanto.</p>';
  } catch (e) { list.innerHTML = `<p class="muted">Não foi possível carregar os estabelecimentos. Confira a configuração do Supabase.</p>`; console.error(e); }
}
document.getElementById("search-form").addEventListener("submit", e => { e.preventDefault(); render(document.getElementById("search-term").value); });
render();
