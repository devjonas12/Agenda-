import { requireUser, logout } from "../auth.js";
import { getClientAppointments, cancelAppointment } from "../api.js";
import { dateLabel, escapeHtml, message } from "../ui.js";
const user = await requireUser("../login.html");
document.getElementById("logout").addEventListener("click", logout);
const root = document.getElementById("appointments-list");
async function load() {
  try {
    const rows = await getClientAppointments(user.id);
    root.innerHTML = rows.length ? rows.map(a=>`<article class="appointment-row"><div><h3>${escapeHtml(a.businesses?.name || "Estabelecimento")} — ${escapeHtml(a.services?.name || "Serviço")}</h3><p>${dateLabel(a.start_at)} · ${escapeHtml(a.status)}</p><p>${escapeHtml(a.businesses?.address || "")}</p></div>${a.status === "scheduled" ? `<button class="button button-outline" data-cancel="${a.id}">Cancelar</button>` : ""}</article>`).join("") : "<p class='muted'>Você ainda não tem agendamentos.</p>";
    root.querySelectorAll("[data-cancel]").forEach(btn=>btn.addEventListener("click", async()=>{try{await cancelAppointment(btn.dataset.cancel);await load();}catch(e){alert(e.message);}}));
  } catch(e) { root.innerHTML = "<p class='muted'>Não foi possível carregar seus agendamentos.</p>"; console.error(e); }
}
load();
