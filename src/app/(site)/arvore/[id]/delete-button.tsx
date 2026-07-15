"use client";

import { useTransition } from "react";
import { deletePerson } from "@/app/actions/person";

export default function DeletePersonButton({
  personId,
}: {
  personId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Excluir esta pessoa da árvore? Essa ação não pode ser desfeita.",
          )
        ) {
          startTransition(() => deletePerson(personId));
        }
      }}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      Excluir
    </button>
  );
}
