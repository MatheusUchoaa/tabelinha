// Persistência simples no localStorage. Cada usuário (por nome) guarda a
// própria tabelinha. Não há back-end: tudo vive no navegador.

const PREFIX = "tabelinha:2026:";
const USER_KEY = "tabelinha:2026:lastUser";

const keyFor = (user) => PREFIX + slug(user);

function slug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Estrutura de uma tabelinha vazia.
export function emptyPicks() {
  return {
    groupScores: {}, // matchId -> { h: number|"", a: number|"" }
    groupOrder: {}, // group -> [teamId, ...] (reordenação manual)
    thirdsOrder: null, // [teamId, ...] (reordenação manual dos 3ºs)
    knockout: {}, // nodeId -> { home, away, penHome, penAway } (placares do mata-mata)
  };
}

export function loadPicks(user) {
  if (!user) return emptyPicks();
  try {
    const raw = localStorage.getItem(keyFor(user));
    if (!raw) return emptyPicks();
    return { ...emptyPicks(), ...JSON.parse(raw) };
  } catch {
    return emptyPicks();
  }
}

export function savePicks(user, picks) {
  if (!user) return;
  try {
    localStorage.setItem(keyFor(user), JSON.stringify(picks));
  } catch {
    /* quota cheia ou modo privado: ignora silenciosamente */
  }
}

export function loadLastUser() {
  try {
    return localStorage.getItem(USER_KEY) || "";
  } catch {
    return "";
  }
}

export function saveLastUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, user);
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignora */
  }
}

// Lista os nomes que já têm tabelinha salva neste navegador.
export function listUsers() {
  const names = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k !== USER_KEY) {
        try {
          const data = JSON.parse(localStorage.getItem(k));
          if (data && data.displayName) names.push(data.displayName);
        } catch {
          /* ignora entradas corrompidas */
        }
      }
    }
  } catch {
    /* ignora */
  }
  return names;
}
