"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { setUserActive, resetPassword, updateUser } from "@/app/actions/users";

type UserRowProps = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
  isSelf: boolean;
};

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-xs font-medium text-stone-700 dark:text-stone-300";

export default function UserRow({
  id,
  name,
  email,
  role,
  isActive,
  isSelf,
}: UserRowProps) {
  const [pending, startTransition] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [state, formAction, updating] = useActionState(
    updateUser.bind(null, id),
    undefined,
  );

  if (state && "success" in state && state.success && editing) {
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      {editing ? (
        <form action={formAction} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor={`name-${id}`}>
              Nome
            </label>
            <input
              id={`name-${id}`}
              name="name"
              defaultValue={name}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`email-${id}`}>
              Email
            </label>
            <input
              id={`email-${id}`}
              name="email"
              type="email"
              defaultValue={email}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`role-${id}`}>
              Papel
            </label>
            <select
              id={`role-${id}`}
              name="role"
              defaultValue={role}
              className={inputClass}
            >
              <option value="MEMBER">Familiar</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {state && "error" in state && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updating}
              className="rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:from-slate-600 hover:to-slate-700 disabled:opacity-60"
            >
              {updating ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-100">
              {name}{" "}
              {role === "ADMIN" && (
                <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  admin
                </span>
              )}
              {!isActive && (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
                  inativo
                </span>
              )}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{email}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Editar usuário"
              className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await resetPassword(id);
                  if (result && "success" in result) {
                    setTempPassword(result.tempPassword);
                  }
                })
              }
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Redefinir senha
            </button>
            {!isSelf && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() => setUserActive(id, !isActive))
                }
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {isActive ? "Desativar" : "Ativar"}
              </button>
            )}
          </div>
        </div>
      )}

      {tempPassword && (
        <div className="mt-3 rounded-lg border border-green-300 bg-green-50 p-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          Nova senha provisória: <span className="font-mono">{tempPassword}</span>
        </div>
      )}
    </div>
  );
}
