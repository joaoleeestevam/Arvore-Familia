"use client";

import { useMemo, useRef, useState } from "react";
import { sortByFullName } from "@/lib/sort";

type PersonOption = { id: string; fullName: string };

export default function PeopleCombobox({
  people,
  personIdsFieldName = "personIds",
  otherNamesFieldName = "otherPeopleNames",
  initialPersonIds = [],
  initialOtherNames = "",
  excludeIds = [],
  label = "Quem está na foto",
}: {
  people: PersonOption[];
  personIdsFieldName?: string;
  otherNamesFieldName?: string;
  initialPersonIds?: string[];
  initialOtherNames?: string;
  excludeIds?: string[];
  label?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialPersonIds);
  const [otherNames, setOtherNames] = useState<string[]>(
    initialOtherNames
      ? initialOtherNames
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean)
      : [],
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const availablePeople = useMemo(
    () => sortByFullName(people.filter((p) => !excludeIds.includes(p.id))),
    [people, excludeIds],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return availablePeople
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => p.fullName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [availablePeople, selectedIds, query]);

  const hasExactMatch = availablePeople.some(
    (p) => p.fullName.toLowerCase() === query.trim().toLowerCase(),
  );

  function addPerson(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removePerson(id: string) {
    setSelectedIds((prev) => prev.filter((p) => p !== id));
  }

  function addOtherName() {
    const name = query.trim();
    if (!name) return;
    setOtherNames((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeOtherName(name: string) {
    setOtherNames((prev) => prev.filter((n) => n !== name));
  }

  const selectedPeople = selectedIds
    .map((id) => availablePeople.find((p) => p.id === id))
    .filter((p): p is PersonOption => Boolean(p));

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </label>

      {(selectedPeople.length > 0 || otherNames.length > 0) && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedPeople.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
            >
              {p.fullName}
              <button
                type="button"
                onClick={() => removePerson(p.id)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-100"
                aria-label={`Remover ${p.fullName}`}
              >
                ×
              </button>
            </span>
          ))}
          {otherNames.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-xs text-stone-600 dark:border-stone-600 dark:text-stone-400"
              title="Pessoa sem cadastro na família"
            >
              {name} <span className="text-stone-400">(sem cadastro)</span>
              <button
                type="button"
                onClick={() => removeOtherName(name)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-100"
                aria-label={`Remover ${name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // pequeno atraso para permitir o clique nas opções antes de fechar
            setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions.length > 0) {
                addPerson(suggestions[0].id);
              } else if (query.trim() && !hasExactMatch) {
                addOtherName();
              }
            }
          }}
          placeholder="Digite um nome..."
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
        />

        {open && query.trim() && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-stone-300 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800">
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addPerson(p.id)}
                className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                {p.fullName}
              </button>
            ))}
            {!hasExactMatch && (
              <button
                type="button"
                onClick={addOtherName}
                className="block w-full border-t border-stone-200 px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-700"
              >
                Adicionar &quot;{query.trim()}&quot; (pessoa sem cadastro)
              </button>
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        Pessoas cadastradas na árvore aparecem na busca. Para quem não é
        cadastrado na família, digite o nome e escolha a opção de adicionar
        sem cadastro.
      </p>

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={personIdsFieldName} value={id} />
      ))}
      <input
        type="hidden"
        name={otherNamesFieldName}
        value={otherNames.join(", ")}
      />
    </div>
  );
}
