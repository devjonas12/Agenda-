import { requireUser, logout } from "../auth.js";
import { getMyBusiness, getServices, addService } from "../api.js";
import { money, escapeHtml, message } from "../ui.js";
const user = await requireUser("../login.html"); document.getElementById("logout").addEventListener("click",logout);
const business = await getMyBusiness(user.id), form = document.getElementById("service-form"), root = document.getElementById("services-list");
if (!business) { root.innerHTML = "<p>Cadastre primeiro seu estabelecimento.</p>"; form.hidden = true; }
async function load() {
 const rows = await getServices(business.id,false);
 root.innerHTML = rows.map(s=>`<div class="service-row"><div><h3>${escapeHtml(s.name)}</h3><p>${s.duration_minutes} min · ${money(s.price)} · ${s.is_active?"Ativo":"Inativo"}</p></div></div>`).join("") || "<p class='muted'>Nenhum serviço cadastrado.</p>";
}
form.addEventListener("submit",async e=>{
 e.preventDefault(); const f=new FormData(form);
 try { await addService(business.id,{name:f.get("name"),duration_minutes:Number(f.get("duration_minutes")),price:Number(f.get("price")),description:f.get("description"),is_active:true}); form.reset(); message("form-message","Serviço adicionado."); await load(); }
 catch(err){message("form-message",err.message,true);}
});
if (business) load();
