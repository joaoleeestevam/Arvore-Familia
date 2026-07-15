"use client";

import { useTransition } from "react";
import { approvePerson, rejectPerson } from "@/app/actions/person";

export default function ApprovalButtons({ personId }: { personId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => approvePerson(personId))}
        className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
      >
        Aprovar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Rejeitar e remover este cadastro?")) {
            startTransition(() => rejectPerson(personId));
          }
        }}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        Rejeitar
      </button>
    </div>
  );
}
