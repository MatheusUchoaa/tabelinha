// Seleções, grupos e jogos da fase de grupos.
// Dados reais FIFA (sorteio 05/12/2025 + repescagens mar/2026).
//
// T: código -> [nome em PT, código de bandeira ISO p/ emoji].
// As bandeiras viram emoji via regional indicators (ver helper flag()).

// Converte um código ISO 3166-1 alfa-2 (ou subdivisão gb-xxx, tratada à parte)
// na sequência de regional indicators que o navegador renderiza como bandeira.
const flag = (cc) =>
  cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

export const T = {
  MEX: ["México", "mx"], RSA: ["África do Sul", "za"], KOR: ["Coreia do Sul", "kr"], CZE: ["Rep. Tcheca", "cz"],
  CAN: ["Canadá", "ca"], QAT: ["Catar", "qa"], SUI: ["Suíça", "ch"], BIH: ["Bósnia", "ba"],
  BRA: ["Brasil", "br"], MAR: ["Marrocos", "ma"], HAI: ["Haiti", "ht"], SCO: ["Escócia", "gb-sct"],
  USA: ["Estados Unidos", "us"], PAR: ["Paraguai", "py"], AUS: ["Austrália", "au"], TUR: ["Turquia", "tr"],
  GER: ["Alemanha", "de"], CUW: ["Curaçao", "cw"], CIV: ["Costa do Marfim", "ci"], ECU: ["Equador", "ec"],
  NED: ["Holanda", "nl"], JPN: ["Japão", "jp"], TUN: ["Tunísia", "tn"], SWE: ["Suécia", "se"],
  BEL: ["Bélgica", "be"], EGY: ["Egito", "eg"], IRN: ["Irã", "ir"], NZL: ["Nova Zelândia", "nz"],
  ESP: ["Espanha", "es"], CPV: ["Cabo Verde", "cv"], KSA: ["Arábia Saudita", "sa"], URU: ["Uruguai", "uy"],
  FRA: ["França", "fr"], SEN: ["Senegal", "sn"], NOR: ["Noruega", "no"], IRQ: ["Iraque", "iq"],
  ARG: ["Argentina", "ar"], ALG: ["Argélia", "dz"], AUT: ["Áustria", "at"], JOR: ["Jordânia", "jo"],
  POR: ["Portugal", "pt"], UZB: ["Uzbequistão", "uz"], COL: ["Colômbia", "co"], COD: ["RD Congo", "cd"],
  ENG: ["Inglaterra", "gb-eng"], CRO: ["Croácia", "hr"], GHA: ["Gana", "gh"], PAN: ["Panamá", "pa"],
};

export const GROUPS = {
  A: ["MEX", "RSA", "KOR", "CZE"], B: ["CAN", "QAT", "SUI", "BIH"],
  C: ["BRA", "MAR", "HAI", "SCO"], D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"], F: ["NED", "JPN", "TUN", "SWE"],
  G: ["BEL", "EGY", "IRN", "NZL"], H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "NOR", "IRQ"], J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "UZB", "COL", "COD"], L: ["ENG", "CRO", "GHA", "PAN"],
};

// Round-robin de 4 seleções: 6 jogos por grupo.
const RR = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];
const buildMatches = () => {
  const m = [];
  Object.entries(GROUPS).forEach(([g, teams]) => {
    RR.forEach(([a, b], i) => m.push({ id: `${g}${i}`, group: g, home: teams[a], away: teams[b] }));
  });
  return m;
};
export const ALL_MATCHES = buildMatches();

// Helpers de exibição.
export const name = (c) => T[c][0];
export const fl = (c) => flag(T[c][1]);
