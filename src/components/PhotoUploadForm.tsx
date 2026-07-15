"use client";

import { useActionState, useState } from "react";
import type { PhotoFormState } from "@/app/actions/photo";
import { compressImageFile } from "@/lib/image-compress";
import PeopleCombobox from "@/components/PeopleCombobox";

type PersonOption = { id: string; fullName: string };
type MediaType = "IMAGE" | "VIDEO_FILE" | "VIDEO_LINK";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

export default function PhotoUploadForm({
  action,
  people,
  fixedPersonIds = [],
  submitLabel = "Enviar foto",
  initialValues,
}: {
  action: (
    state: PhotoFormState,
    formData: FormData,
  ) => Promise<PhotoFormState>;
  people: PersonOption[];
  fixedPersonIds?: string[];
  submitLabel?: string;
  initialValues?: {
    takenDate?: string;
    caption?: string;
    description?: string;
    personIds?: string[];
    otherPeopleNames?: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [compressing, setCompressing] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("IMAGE");

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      if (compressed !== file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressed);
        input.files = dataTransfer.files;
      }
    } finally {
      setCompressing(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {fixedPersonIds.map((id) => (
        <input key={id} type="hidden" name="personIds" value={id} />
      ))}

      {!initialValues && (
        <>
          <div>
            <label className={labelClass} htmlFor="mediaType">
              Tipo
            </label>
            <select
              id="mediaType"
              name="mediaType"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as MediaType)}
              className={inputClass}
            >
              <option value="IMAGE">Foto</option>
              <option value="VIDEO_FILE">Vídeo (enviar arquivo)</option>
              <option value="VIDEO_LINK">Vídeo (link do YouTube etc.)</option>
            </select>
          </div>

          {mediaType === "IMAGE" && (
            <div>
              <label className={labelClass} htmlFor="photo">
                Foto *
              </label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                required
                onChange={handlePhotoChange}
                className={inputClass}
              />
              {compressing && (
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Preparando imagem...
                </p>
              )}
            </div>
          )}

          {mediaType === "VIDEO_FILE" && (
            <div>
              <label className={labelClass} htmlFor="video">
                Vídeo *
              </label>
              <input
                id="video"
                name="video"
                type="file"
                accept="video/*"
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Até 300MB. Vídeos grandes podem demorar para enviar.
              </p>
            </div>
          )}

          {mediaType === "VIDEO_LINK" && (
            <div>
              <label className={labelClass} htmlFor="externalUrl">
                Link do vídeo *
              </label>
              <input
                id="externalUrl"
                name="externalUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className={inputClass}
              />
            </div>
          )}
        </>
      )}

      <div>
        <label className={labelClass} htmlFor="takenDate">
          Data
        </label>
        <input
          id="takenDate"
          name="takenDate"
          type="date"
          defaultValue={initialValues?.takenDate}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="caption">
          Identificação
        </label>
        <input
          id="caption"
          name="caption"
          placeholder="Ex.: Almoço de domingo em família"
          defaultValue={initialValues?.caption}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Texto explicativo
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialValues?.description}
          className={inputClass}
        />
      </div>

      <PeopleCombobox
        people={people}
        excludeIds={fixedPersonIds}
        initialPersonIds={initialValues?.personIds}
        initialOtherNames={initialValues?.otherPeopleNames}
        label="Quem está na foto/vídeo"
      />

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-orange-500 px-3 py-2 font-medium text-white shadow-sm shadow-rose-500/20 transition hover:from-rose-500 hover:to-orange-400 disabled:opacity-60"
      >
        {pending ? "Enviando..." : submitLabel}
      </button>
    </form>
  );
}
