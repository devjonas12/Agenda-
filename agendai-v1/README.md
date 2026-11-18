# Agendaí — versão 1.0 (base reconstruída)

Plataforma de agendamento para pequenos negócios e profissionais independentes.
Esta versão consolida uma base funcional em HTML, CSS e JavaScript ES Modules,
com Supabase Auth, PostgreSQL, RLS e RPC para criação transacional de agendamentos.

## Escopo incluído
- Cadastro e login por e-mail/senha.
- Perfil de cliente e perfil de estabelecimento.
- Busca pública de estabelecimentos.
- Página pública do estabelecimento e catálogo de serviços.
- Consulta de horários e solicitação de agendamento.
- Área do cliente para consultar e cancelar agendamentos.
- Painel do estabelecimento para visualizar agenda e gerenciar serviços.
- SQL de estrutura, políticas RLS e funções transacionais.
- Páginas de Termos e Privacidade como modelos editáveis.

## Não incluído nesta versão
Pagamentos, integração com WhatsApp, avaliações, múltiplos profissionais por estabelecimento,
aplicativo nativo e automações externas.

## Requisitos
- Projeto Supabase.
- Navegador moderno.
- Servidor estático local (não abra os HTMLs diretamente com `file://`).

## Configuração
1. Crie um projeto no Supabase.
2. Abra o SQL Editor e execute `supabase/schema.sql` integralmente.
3. Em Authentication > URL Configuration, configure a URL local e a URL de produção.
4. Edite `js/config.js` e informe a URL do projeto e a chave pública `anon`.
5. Sirva a pasta com um servidor local. Exemplo:
   - VS Code: extensão Live Server; ou
   - `npx serve .`
6. Abra `index.html`, cadastre um usuário e complete o perfil.
7. Para criar um estabelecimento, acesse `painel/index.html` e use o formulário de configuração inicial.

## Importante sobre segurança
- Nunca coloque `service_role` no navegador.
- A aplicação usa a chave pública `anon`; as permissões são controladas por RLS.
- A função `create_appointment` valida disponibilidade no banco e evita conflito por
  sobreposição de horários na mesma transação.
- Configure e teste as políticas no seu próprio projeto antes de publicar.

## Fuso horário
Os horários de funcionamento são interpretados no fuso `America/Porto_Velho`.
Os instantes dos agendamentos são armazenados como `timestamptz` (UTC internamente).
Se o negócio operar em outro fuso, altere `TIME_ZONE` em `js/config.js` e revise
a função SQL de disponibilidade.

## Estrutura
```text
agendai-v1/
├── index.html
├── login.html
├── cadastro.html
├── estabelecimento.html
├── termos.html
├── privacidade.html
├── cliente/index.html
├── painel/index.html
├── painel/agenda.html
├── painel/servicos.html
├── assets/css/tokens.css
├── assets/css/app.css
├── js/
│   ├── config.js
│   ├── supabase.js
│   ├── auth.js
│   ├── api.js
│   ├── ui.js
│   └── pages/
└── supabase/schema.sql
```

## Checklist de validação antes de produção
- [ ] Executar o SQL em um projeto Supabase de teste.
- [ ] Testar cadastro, confirmação de e-mail e login.
- [ ] Testar criação e edição de estabelecimento.
- [ ] Testar serviços e horários de funcionamento.
- [ ] Testar agendamento em dois navegadores simultaneamente.
- [ ] Testar cancelamento e permissões de cliente/proprietário.
- [ ] Testar RLS com usuário anônimo, cliente e proprietário.
- [ ] Validar textos legais com orientação jurídica.
- [ ] Publicar sob HTTPS e configurar URLs autorizadas no Supabase.

## Estado da entrega
Esta é uma reconstrução consolidada do MVP com base nas decisões e no escopo já definidos.
O código ainda precisa ser executado e validado em um projeto Supabase real; não é correto
considerá-lo homologado ou pronto para produção sem essa etapa.
