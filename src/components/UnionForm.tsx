"use client";

import { useActionState } from "react";
import type { UnionFormState } from "@/app/actions/union";
import { sortByFullName } from "@/lib/sort";

type PersonOption = { id: string; fullName: string };

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

export default function UnionForm({
  action,
  people,
}: {
  action: (
    state: UnionFormState,
    formData: FormData,
  ) => Promise<UnionFormState>;
  people: PersonOption[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const sortedPeople = sortByFullName(people);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="partnerId">
          Cônjuge / parceiro(a) *
        </label>
        <select id="partnerId" name="partnerId" required className={inputClass}>
          <option value="">-- Selecione --</option>
          {sortedPeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="startDate">
            Início (casamento/união)
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="endDate">
            Fim (se já separados)
          </label>
          <input id="endDate" name="endDate" type="date" className={inputClass} />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 font-medium text-white shadow-sm shadow-violet-500/20 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Adicionar vínculo"}
      </button>
    </form>
  );
}
