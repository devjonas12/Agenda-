import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

async function testarConexao() {
  console.log("Testando conexão com Supabase...");

  try {
    const resposta = await fetch(
      `${SUPABASE_URL}/auth/v1/health`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY
        }
      }
    );

    if (resposta.ok) {
      console.log("✅ CONEXÃO COM SUPABASE ESTABELECIDA!");
      console.log("Status:", resposta.status);
    } else {
      console.error("❌ Erro na conexão:", resposta.status);
      console.log(await resposta.text());
    }
  } catch (erro) {
    console.error("❌ Falha ao conectar:", erro);
  }
}

testarConexao();
