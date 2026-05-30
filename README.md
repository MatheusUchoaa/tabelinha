# Tabelinha — Bolão da Copa 2026

Bolão retrô da Copa do Mundo 2026. Palpite os placares dos grupos, veja a
classificação se reorganizar (com arrastar e soltar), descubra os 8 melhores
terceiros colocados e monte o mata-mata completo até a taça — tudo com a
estética de pôster esportivo dos anos 70/80.

Feito em React + Vite, sem back-end: os palpites de cada pessoa ficam salvos no
próprio navegador (`localStorage`).

## O que tem

- 12 grupos (A a L) com seleções reais, bandeiras e os jogos da fase de grupos.
- Dois modos por grupo:
  - Resultados: digite os placares e a classificação se ordena sozinha (ou arraste para reordenar).
  - Quem passa: toque nas seleções na ordem de classificação, sem precisar de placares.
- Aba "3ºs lugares": ranqueia os 12 terceiros colocados e marca os 8 que se classificam.
- Mata-mata oficial da FIFA: 16 avos, oitavas, quartas, semis e final.
  - Decida cada confronto digitando o placar (com pênaltis se empatar) ou clicando na seleção vencedora.
  - Os vencedores avançam sozinhos e o chaveamento se ajusta para caber na tela.
- Gerador de pôster: exporta um PNG no estilo cartaz antigo com seus palpites principais (campeão, vice e semifinalistas) e a imagem da taça.
- Login simples por nome — cada nome guarda uma tabelinha própria.

## Rodar localmente

Precisa do [Node.js](https://nodejs.org/) 18+ instalado.

```bash
npm install     # instala as dependências
npm run dev     # inicia o servidor de desenvolvimento
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

Para gerar a versão de produção:

```bash
npm run build   # gera a pasta dist/
npm run preview # testa o build localmente
```

## Publicar no GitHub Pages

O projeto já vem com deploy automático configurado (`.github/workflows/deploy.yml`)
e com `base: "./"` no Vite, para funcionar em subpasta.

1. Suba o código para o repositório:

   ```bash
   git add .
   git commit -m "primeira versão da Tabelinha"
   git branch -M main
   git push -u origin main
   ```

2. No GitHub, vá em Settings, Pages e, em Build and deployment, Source,
   escolha "GitHub Actions".

3. A cada push na branch `main`, o site é reconstruído e publicado.

## Estrutura

```
tabelinha/
├─ index.html
├─ package.json
├─ vite.config.js
├─ .github/workflows/deploy.yml
├─ public/
│  ├─ favicon.svg
│  └─ taca.png            # imagem do pôster da taça
└─ src/
   ├─ main.jsx            # ponto de entrada
   ├─ App.jsx             # componentes, estado, lógica e gerador de pôster
   ├─ styles.css          # todo o visual (tema retrô)
   └─ data/
      ├─ teams.js         # seleções, grupos e jogos
      ├─ knockout.js      # estrutura oficial do mata-mata
      ├─ palette.js       # paleta de cores
      ├─ storage.js       # persistência (localStorage)
      └─ taca.js          # reservado (a taça é servida de public/)
```

## Notas

- Confira os grupos. Os dados em `src/data/teams.js` são uma reconstrução do
  sorteio de 05/12/2025 mais as repescagens de março/2026 e podem ter
  imprecisões. Estão isolados e fáceis de editar.
- O chaveamento (`src/data/knockout.js`) segue o formato oficial: 1º e 2º de cada
  grupo mais os 8 melhores terceiros nos 16 avos. A alocação dos terceiros usa
  ranking simples (a FIFA tem uma matriz de combinações para casos de borda).
- Marca, troféu e arte são originais ou estilizados para fins de bolão.
```
