import { requireUser, logout } from "../auth.js";
import { getMyBusiness, saveBusiness } from "../api.js";
import { message } from "../ui.js";
const user = await requireUser("../login.html");
document.getElementById("logout").addEventListener("click", logout);
const form = document.getElementById("business-form");
try {
 const b = await getMyBusiness(user.id);
 if (b) for (const [k,v] of Object.entries(b)) if (form.elements[k]) form.elements[k].value = v ?? "";
} catch(e) { console.error(e); }
form.addEventListener("submit", async e=>{
 e.preventDefault(); const f = new FormData(form);
 const payload = Object.fromEntries(["name","category","description","address","phone","slug"].map(k=>[k, f.get(k)?.toString().trim() || null]));
 try { await saveBusiness(user.id,payload); message("form-message","Estabelecimento salvo."); }
 catch(err) { message("form-message",err.message,true); }
});
