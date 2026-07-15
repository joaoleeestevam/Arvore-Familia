"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4" key={state && "success" in state ? "done" : "form"}>
      <div>
        <label className={labelClass} htmlFor="currentPassword">
          Senha atual
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="newPassword">
          Nova senha
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="confirmPassword">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {state && "error" in state && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Senha alterada com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 font-medium text-white shadow-sm shadow-violet-500/20 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
