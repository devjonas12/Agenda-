# Agendaí Design System — regra obrigatória

Aplique este sistema em toda interface do Agendaí. Não invente uma segunda linguagem visual.
Quando houver conflito entre um padrão genérico de UI e este documento, siga este documento,
preservando acessibilidade e clareza funcional.

## Direção visual
"Darkroom product editorial": produto editorial, sóbrio e acolhedor, com superfícies escuras,
tipografia creme, contraste controlado e bastante espaço negativo. Deve parecer intencional,
minimalista e profissional, não uma dashboard SaaS genérica.

## Tokens de cor
- Warm Cream: `#ffedd7` — texto principal e elementos claros.
- Walnut Shadow: `#100904` — fundo principal.
- Bark Brown: `#382416` — superfícies elevadas e CTA preenchido.
- Cork Border: `#40372e` — bordas e divisórias.
- Driftwood: `#6c5f51` — texto secundário.
- Ember Accent: `#dc5000` — somente créditos editoriais / "Built by"; nunca CTA.
- Preto puro `#000000`: somente SVG decorativo, nunca fundo ou texto.
- Verde de imagem de referência não é token do produto.

## Tipografia
Preferência: `halyard-display-variable`; fallback: Inter, Söhne, Neue Haas Grotesk,
ui-sans-serif, system-ui, sans-serif.
- UI: caixa alta, peso 500, tracking discreto.
- Texto descritivo: caixa mista, peso 400.
- Escala de referência: 8, 10, 12, 14, 15, 18, 24, 29, 41 e 51 px.
- Use alturas de linha compactas para títulos e confortáveis para leitura.
- Não use tipografia pesada indiscriminadamente.

## Espaçamento e formas
- Escala: 6, 8, 9, 10, 12, 14, 18, 24, 31, 41, 45, 68 e 204 px.
- Cards: padding 24 px, raio 12 px, sem sombra.
- Inputs: fundo transparente, raio 0, borda inferior.
- Botão preenchido: raio 36 px; botão contornado: raio 22.5 px.
- Pill totalmente arredondada: 9999 px.
- Divisórias: linha tracejada de 1 px.
- Evite cards aninhados.

## Componentes
- CTA preenchido: Bark Brown + Warm Cream, uppercase, peso 500; no máximo um por seção.
- Botão secundário: transparente, borda de 1 px Warm Cream.
- Inputs: sem preenchimento, somente underline; foco visível.
- Navegação: simples, até quatro itens, 12 px uppercase; ativo com sublinhado tracejado.
- Cards: superfície Walnut/Bark, sem sombras e sem gradientes.
- Estados: não depender apenas de cor; usar texto, ícone e estrutura.

## Adaptações funcionais
Calendários, formulários e tabelas podem ser densos quando a tarefa exigir, sem perder legibilidade.
A interface deve ser responsiva, mobile-first e acessível por teclado. Não sacrificar foco,
contraste, rótulos ou mensagens de erro para manter estética. Não usar neon, glassmorphism,
gradientes, sombras decorativas ou laranja em botões/CTAs.
