type PersonLike = {
  id: string;
  fatherId: string | null;
  motherId: string | null;
};

type UnionLike = {
  partnerAId: string;
  partnerBId: string;
};

/**
 * Nível geracional de cada pessoa. Quem não tem pai/mãe cadastrados começa no
 * nível 0; os demais ficam um nível abaixo do pai/mãe mais "profundo".
 * Cônjuges (unions) são nivelados entre si, para que um casal sempre apareça
 * lado a lado na árvore mesmo que só um dos dois tenha ascendência registrada.
 * Feito por relaxamento iterativo (em vez de recursão) para não ter problema
 * com ciclos em dados malformados.
 */
export function computeGenerations<T extends PersonLike>(
  people: T[],
  unions: UnionLike[] = [],
): Map<string, number> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const generation = new Map<string, number>(people.map((p) => [p.id, 0]));

  const spousesOf = new Map<string, string[]>();
  for (const union of unions) {
    if (!byId.has(union.partnerAId) || !byId.has(union.partnerBId)) continue;
    if (!spousesOf.has(union.partnerAId)) spousesOf.set(union.partnerAId, []);
    if (!spousesOf.has(union.partnerBId)) spousesOf.set(union.partnerBId, []);
    spousesOf.get(union.partnerAId)!.push(union.partnerBId);
    spousesOf.get(union.partnerBId)!.push(union.partnerAId);
  }

  const maxIterations = people.length + 5;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let changed = false;

    for (const person of people) {
      let gen = generation.get(person.id)!;

      if (person.fatherId && byId.has(person.fatherId)) {
        gen = Math.max(gen, generation.get(person.fatherId)! + 1);
      }
      if (person.motherId && byId.has(person.motherId)) {
        gen = Math.max(gen, generation.get(person.motherId)! + 1);
      }
      for (const spouseId of spousesOf.get(person.id) ?? []) {
        gen = Math.max(gen, generation.get(spouseId)!);
      }

      if (gen !== generation.get(person.id)) {
        generation.set(person.id, gen);
        changed = true;
      }
    }

    if (!changed) break;
  }

  return generation;
}
