import { getBusinessBySlug, getServices, createAppointment } from "../api.js";
import { currentUser } from "../auth.js";
import { money, escapeHtml, message, localDateString } from "../ui.js";
const root = document.getElementById("business-detail");
const slug = new URLSearchParams(location.search).get("slug");
let business, services = [];
if (!slug) root.innerHTML = "<p>Estabelecimento não informado.</p>";
else try {
  business = await getBusinessBySlug(slug); services = await getServices(business.id);
  root.innerHTML = `<p class="eyebrow">${escapeHtml(business.category || "Estabelecimento")}</p><h1>${escapeHtml(business.name)}</h1><p class="lead">${escapeHtml(business.description || "")}</p><p class="muted">${escapeHtml(business.address || "")} ${business.phone ? " · " + escapeHtml(business.phone) : ""}</p><section class="section"><h2>Escolha um serviço</h2><div id="service-options">${services.map(s=>`<label class="service-choice"><span><input type="radio" name="service" value="${s.id}" ${services[0]?.id===s.id?"checked":""}><strong>${escapeHtml(s.name)}</strong><p>${s.duration_minutes} min · ${money(s.price)}</p></span></label>`).join("") || "<p class='muted'>Este estabelecimento ainda não cadastrou serviços.</p>"}</div></section><section class="booking-panel surface"><h2>Solicitar agendamento</h2><form id="booking-form" class="stack"><label>Data<input name="date" type="date" min="${localDateString()}" required></label><label>Horário<input name="time" type="time" step="900" required></label><label>Observações<textarea name="notes" rows="2"></textarea></label><button class="button" type="submit">Confirmar agendamento</button><p id="booking-message" class="form-message" role="status"></p></form></section>`;
  document.getElementById("booking-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const user = await currentUser(); if (!user) { location.href = "login.html"; return; }
      const f = new FormData(e.currentTarget), selected = document.querySelector('input[name="service"]:checked');
      if (!selected) throw new Error("Selecione um serviço.");
      const startAt = new Date(`${f.get("date")}T${f.get("time")}:00-04:00`).toISOString();
      await createAppointment({ businessId:business.id, serviceId:selected.value, startAt, notes:f.get("notes") });
      message("booking-message", "Agendamento criado com sucesso. Consulte seus horários na área do cliente.");
    } catch(err) { message("booking-message", err.message || "Não foi possível agendar.", true); }
  });
} catch(e) { root.innerHTML = "<p class='muted'>Não foi possível localizar este estabelecimento.</p>"; console.error(e); }
