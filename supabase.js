import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

if (SUPABASE_URL.includes("SEU-PROJETO") || SUPABASE_ANON_KEY.includes("SUA_CHAVE")) {
  console.warn("Configure js/config.js com os dados públicos do seu projeto Supabase.");
}
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
