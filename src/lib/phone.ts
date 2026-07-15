// Formata números de telefone brasileiros para exibição.
// Não altera o valor salvo — é só uma formatação visual best-effort.
export function formatPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  let country = "";
  let rest = digits;

  if (rest.length === 12 || rest.length === 13) {
    if (rest.startsWith("55")) {
      country = "55";
      rest = rest.slice(2);
    }
  }

  if (rest.length === 11) {
    const ddd = rest.slice(0, 2);
    const part1 = rest.slice(2, 7);
    const part2 = rest.slice(7);
    return `${country ? `+${country} ` : ""}(${ddd}) ${part1}-${part2}`;
  }

  if (rest.length === 10) {
    const ddd = rest.slice(0, 2);
    const part1 = rest.slice(2, 6);
    const part2 = rest.slice(6);
    return `${country ? `+${country} ` : ""}(${ddd}) ${part1}-${part2}`;
  }

  return raw;
}
