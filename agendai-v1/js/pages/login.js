import { supabase } from "../supabase.js";
import { message } from "../ui.js";
document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault(); const f = new FormData(e.currentTarget);
  message("form-message", "Entrando...");
  const { error } = await supabase.auth.signInWithPassword({ email:f.get("email"), password:f.get("password") });
  if (error) return message("form-message", error.message, true);
  location.href = "cliente/index.html";
});
