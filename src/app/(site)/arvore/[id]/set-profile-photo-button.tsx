"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProfilePhoto } from "@/app/actions/person";

export default function SetProfilePhotoButton({
  personId,
  photoId,
}: {
  personId: string;
  photoId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setProfilePhoto(personId, photoId);
          router.refresh();
        })
      }
      className="w-full rounded-md border border-stone-300 px-1.5 py-1 text-[11px] text-stone-600 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
    >
      Definir como atual
    </button>
  );
}
