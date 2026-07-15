"use client";

import { useActionState, useState } from "react";
import type { PersonFormState } from "@/app/actions/person";
import { compressImageFile } from "@/lib/image-compress";
import { sortByFullName } from "@/lib/sort";

type PersonOption = { id: string; fullName: string };

type PersonFormProps = {
  action: (
    state: PersonFormState,
    formData: FormData,
  ) => Promise<PersonFormState>;
  people: PersonOption[];
  currentPersonId?: string;
  allowPhotoUpload?: boolean;
  initialValues?: {
    fullName?: string;
    gender?: string;
    birthDate?: string;
    deathDate?: string;
    bio?: string;
    phone?: string;
    email?: string;
    address?: string;
    fatherId?: string;
    motherId?: string;
  };
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

export default function PersonForm({
  action,
  people,
  currentPersonId,
  allowPhotoUpload = false,
  initialValues,
  submitLabel = "Salvar",
}: PersonFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const selectablePeople = sortByFullName(
    people.filter((p) => p.id !== currentPersonId),
  );
  const [compressing, setCompressing] = useState(false);

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
      <div>
        <label className={labelClass} htmlFor="fullName">
          Nome completo *
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          defaultValue={initialValues?.fullName}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="gender">
          Sexo
        </label>
        <select
          id="gender"
          name="gender"
          defaultValue={initialValues?.gender ?? ""}
          className={inputClass}
        >
          <option value="">-- Não informado --</option>
          <option value="MALE">Masculino</option>
          <option value="FEMALE">Feminino</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="birthDate">
            Data de nascimento
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={initialValues?.birthDate}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="deathDate">
            Data de falecimento
          </label>
          <input
            id="deathDate"
            name="deathDate"
            type="date"
            defaultValue={initialValues?.deathDate}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="fatherId">
            Pai
          </label>
          <select
            id="fatherId"
            name="fatherId"
            defaultValue={initialValues?.fatherId ?? ""}
            className={inputClass}
          >
            <option value="">-- Não informado --</option>
            {selectablePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="motherId">
            Mãe
          </label>
          <select
            id="motherId"
            name="motherId"
            defaultValue={initialValues?.motherId ?? ""}
            className={inputClass}
          >
            <option value="">-- Não informado --</option>
            {selectablePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="bio">
          Sobre
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={initialValues?.bio}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="phone">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={initialValues?.phone}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={initialValues?.email}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="address">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          defaultValue={initialValues?.address}
          className={inputClass}
        />
      </div>

      {allowPhotoUpload && (
        <div>
          <label className={labelClass} htmlFor="photo">
            Foto atual
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
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
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
