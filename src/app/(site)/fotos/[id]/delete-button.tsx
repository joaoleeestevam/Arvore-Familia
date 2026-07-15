"use client";

import { useTransition } from "react";
import { deletePhoto } from "@/app/actions/photo";

export default function DeletePhotoButton({ photoId }: { photoId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir esta foto? Essa ação não pode ser desfeita.")) {
          startTransition(() => deletePhoto(photoId));
        }
      }}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      Excluir
    </button>
  );
}
