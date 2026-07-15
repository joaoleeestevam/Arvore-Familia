"use client";

import { useTransition } from "react";
import { endUnion, deleteUnion } from "@/app/actions/union";

export default function UnionActions({
  unionId,
  active,
  canRemove,
}: {
  unionId: string;
  active: boolean;
  canRemove: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {active && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Marcar esta união como encerrada (separação)?")) {
              startTransition(() => endUnion(unionId));
            }
          }}
          className="text-xs text-stone-500 underline hover:text-stone-800 disabled:opacity-60 dark:text-stone-400 dark:hover:text-stone-100"
        >
          Marcar separação
        </button>
      )}
      {canRemove && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Remover este vínculo? Essa ação não pode ser desfeita.")) {
              startTransition(() => deleteUnion(unionId));
            }
          }}
          className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
        >
          Remover
        </button>
      )}
    </div>
  );
}
