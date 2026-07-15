"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordWithToken } from "@/app/actions/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordWithToken,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label
          htmlFor="newPassword"
          className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Nova senha
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
        />
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
        />
      </div>

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
        {pending ? "Salvando..." : "Redefinir senha"}
      </button>

      <Link
        href="/login"
        className="block text-center text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
