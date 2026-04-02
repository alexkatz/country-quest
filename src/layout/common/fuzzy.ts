const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const fuzzyMatch = (name: string, t: string) => {
  const n = normalize(name);
  const q = normalize(t);
  let qi = 0;
  for (let i = 0; i < n.length && qi < q.length; i++) {
    if (n[i] === q[qi]) qi++;
  }
  return qi === q.length;
};

const matchScore = (name: string, t: string) => {
  const n = normalize(name);
  const q = normalize(t);
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  return 2;
};

export const fuzzy = {
  match: fuzzyMatch,
  score: matchScore,
};
