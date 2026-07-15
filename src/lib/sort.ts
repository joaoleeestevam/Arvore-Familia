// SQLite ordena texto por valor de byte (ORDER BY comum), o que bagunça
// nomes com acento (ex.: "Óscar" viria depois de "Zeca"). Este collator
// entende acentuação e maiúsculas/minúsculas do jeito que uma pessoa espera.
const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

export function sortByFullName<T extends { fullName: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => collator.compare(a.fullName, b.fullName));
}
