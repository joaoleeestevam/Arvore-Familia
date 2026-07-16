"use client";

import { useActionState, useState } from "react";
import type { StoryFormState } from "@/app/actions/story";
import { compressFileList } from "@/lib/image-compress";
import PeopleCombobox from "@/components/PeopleCombobox";
import RichTextEditor from "@/components/RichTextEditor";

type PersonOption = { id: string; fullName: string };

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

export default function StoryForm({
  action,
  people = [],
  initialValues,
  submitLabel = "Publicar",
}: {
  action: (
    state: StoryFormState,
    formData: FormData,
  ) => Promise<StoryFormState>;
  people?: PersonOption[];
  initialValues?: {
    title?: string;
    content?: string;
    personIds?: string[];
    otherPeopleNames?: string;
  };
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [compressing, setCompressing] = useState(false);

  async function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    if (!input.files || input.files.length === 0) return;
    setCompressing(true);
    try {
      input.files = await compressFileList(input.files);
    } finally {
      setCompressing(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="title">
          Título *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initialValues?.title}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>História *</label>
        <RichTextEditor name="content" defaultValue={initialValues?.content} />
      </div>

      <PeopleCombobox
        people={people}
        initialPersonIds={initialValues?.personIds}
        initialOtherNames={initialValues?.otherPeopleNames}
        label="Quem participou da história"
      />

      <div>
        <label className={labelClass} htmlFor="photos">
          Fotos da história
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotosChange}
          className={inputClass}
        />
        {compressing && (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Preparando imagens...
          </p>
        )}
        {initialValues && (
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            As fotos já anexadas continuam; aqui você só pode adicionar novas.
          </p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 font-medium text-white shadow-sm shadow-amber-500/20 transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-60"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
