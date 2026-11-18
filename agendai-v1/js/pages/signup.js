import { supabase } from "../supabase.js";
import { message } from "../ui.js";
document.getElementById("signup-form").addEventListener("submit", async e => {
  e.preventDefault(); const f = new FormData(e.currentTarget);
  message("form-message", "Criando conta...");
  const { data, error } = await supabase.auth.signUp({ email:f.get("email"), password:f.get("password"), options:{ data:{ full_name:f.get("full_name") } } });
  if (error) return message("form-message", error.message, true);
  if (data.session) location.href = "cliente/index.html";
  else message("form-message", "Conta criada. Verifique seu e-mail para confirmar o cadastro.");
});
