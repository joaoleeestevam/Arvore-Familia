"use client";

import { useActionState } from "react";
import { updateFamilySettings } from "@/app/actions/settings";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

export default function SettingsForm({
  initialValues,
}: {
  initialValues: { familyName: string; description: string };
}) {
  const [state, formAction, pending] = useActionState(
    updateFamilySettings,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="familyName">
          Nome da família
        </label>
        <input
          id="familyName"
          name="familyName"
          required
          defaultValue={initialValues.familyName}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Um texto curto para identificar a família (ex.: origem, cidade, algo marcante)."
          defaultValue={initialValues.description}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="backgroundPhoto">
          Foto de fundo do sistema
        </label>
        <input
          id="backgroundPhoto"
          name="backgroundPhoto"
          type="file"
          accept="image/*"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Aparece como banner na página inicial, para quem já está logado.
          Por privacidade, não é exibida na tela de login pública.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Configurações salvas.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 px-3 py-2 font-medium text-white shadow-sm transition hover:from-slate-600 hover:to-slate-700 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
