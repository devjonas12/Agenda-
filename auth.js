import { supabase } from "./supabase.js";
export async function currentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
export async function requireUser(loginPath = "../login.html") {
  const user = await currentUser();
  if (!user) { location.href = loginPath; throw new Error("Faça login para continuar."); }
  return user;
}
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  location.href = location.pathname.includes("/painel/") || location.pathname.includes("/cliente/") ? "../index.html" : "index.html";
}
