import { requireUser, logout } from "../auth.js";
import { getMyBusiness, getAppointmentsForBusiness, getHours, saveHours } from "../api.js";
import { dateLabel, escapeHtml, localDateString, message } from "../ui.js";
const user=await requireUser("../login.html");document.getElementById("logout").addEventListener("click",logout);
const business=await getMyBusiness(user.id), dateInput=document.getElementById("agenda-date"), root=document.getElementById("agenda-list");
dateInput.value=localDateString();
async function loadAppointments(){
 if(!business){root.innerHTML="<p>Cadastre seu estabelecimento primeiro.</p>";return;}
 try{const rows=await getAppointmentsForBusiness(business.id,dateInput.value);
 root.innerHTML=rows.length?rows.map(a=>`<article class="appointment-row"><div><h3>${dateLabel(a.start_at)} — ${escapeHtml(a.services?.name||"Serviço")}</h3><p>${escapeHtml(a.profiles?.full_name||a.profiles?.email||"Cliente")} · ${escapeHtml(a.status)}</p></div></article>`).join(""):"<p class='muted'>Nenhum agendamento para este dia.</p>";
 }catch(e){root.innerHTML="<p class='muted'>Erro ao carregar agenda.</p>";console.error(e);}
}
document.getElementById("refresh").addEventListener("click",loadAppointments);dateInput.addEventListener("change",loadAppointments);
const names=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
async function setupHours(){
 const form=document.getElementById("hours-form");if(!business){form.innerHTML="<p>Cadastre o estabelecimento primeiro.</p>";return;}
 const rows=await getHours(business.id), byDay=Object.fromEntries(rows.map(r=>[r.weekday,r]));
 form.innerHTML=names.map((n,i)=>{const r=byDay[i]||{};return `<div class="hours-day"><strong>${n}</strong><label>Abre<input type="time" name="open_${i}" value="${r.open_time||""}"></label><label>Fecha<input type="time" name="close_${i}" value="${r.close_time||""}"></label></div>`}).join("")+`<div class="full"><button class="button" type="submit">Salvar horários</button></div>`;
 form.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(form);try{const data=names.map((_,i)=>({weekday:i,open_time:f.get("open_"+i)||null,close_time:f.get("close_"+i)||null,is_closed:!f.get("open_"+i)||!f.get("close_"+i)}));await saveHours(business.id,data);message("hours-message","Horários atualizados.");}catch(err){message("hours-message",err.message,true);}});
}
await setupHours();await loadAppointments();
