// ============================================================
// MATA-MATA — estrutura OFICIAL da FIFA (Copa 2026)
// Jogos 73–88 (fase de 32), 89–96 (oitavas), 97–100 (quartas),
// 101–102 (semis), 104 (final). Cruzamentos conforme o sorteio
// de 05/12/2025. "1A"=vencedor do grupo A, "2A"=vice,
// "3:ABC..."=melhor 3º entre os grupos listados.
// ============================================================

// Os 16 confrontos da fase de 32, na ordem oficial (73..88).
export const R32 = [
  { n: 73, a: "2A", b: "2B" },
  { n: 74, a: "1E", b: "3:ABCDF" },
  { n: 75, a: "1F", b: "2C" },
  { n: 76, a: "1C", b: "2F" },
  { n: 77, a: "1I", b: "3:CDFGH" },
  { n: 78, a: "2E", b: "2I" },
  { n: 79, a: "1A", b: "3:CEFHI" },
  { n: 80, a: "1L", b: "3:EHIJK" },
  { n: 81, a: "1D", b: "3:BEFIJ" },
  { n: 82, a: "1G", b: "3:AEHIJ" },
  { n: 83, a: "2K", b: "2L" },
  { n: 84, a: "1H", b: "2J" },
  { n: 85, a: "1B", b: "3:EFGIJ" },
  { n: 86, a: "1J", b: "2H" },
  { n: 87, a: "1K", b: "3:DEIJL" },
  { n: 88, a: "2D", b: "2G" },
];

// Oitavas (89..96): vencedores que se enfrentam.
export const R16 = [
  { n: 89, a: 74, b: 77 }, { n: 90, a: 73, b: 75 },
  { n: 91, a: 76, b: 78 }, { n: 92, a: 79, b: 80 },
  { n: 93, a: 83, b: 84 }, { n: 94, a: 81, b: 82 },
  { n: 95, a: 86, b: 88 }, { n: 96, a: 85, b: 87 },
];
// Quartas (97..100)
export const QF = [
  { n: 97, a: 89, b: 90 }, { n: 98, a: 93, b: 94 },
  { n: 99, a: 91, b: 92 }, { n: 100, a: 95, b: 96 },
];
// Semis (101..102)
export const SF = [
  { n: 101, a: 97, b: 98 }, { n: 102, a: 99, b: 100 },
];
// Final
export const FINAL = { n: 104, a: 101, b: 102 };

// Distribuição em dois lados convergindo para a taça.
export const LEFT_R32 = [74, 77, 73, 75, 83, 84, 81, 82];
export const RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87];
export const LEFT_R16 = [89, 90, 93, 94];
export const RIGHT_R16 = [91, 92, 95, 96];
export const LEFT_QF = [97, 98];
export const RIGHT_QF = [99, 100];
export const LEFT_SF = 101;
export const RIGHT_SF = 102;
