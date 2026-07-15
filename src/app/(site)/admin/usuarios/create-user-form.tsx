"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Shuffle } from "lucide-react";
import { createUser } from "@/app/actions/users";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const labelClass =
  "mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300";

function generatePassword() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, undefined);
  const [dismissed, setDismissed] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const showSuccess = state && "success" in state && state.success && !dismissed;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <h2 className="mb-3 text-lg font-medium text-stone-900 dark:text-stone-100">
        Cadastrar novo familiar
      </h2>

      {showSuccess ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <p className="font-medium">Usuário criado com sucesso!</p>
          <p className="mt-1">
            Email: <span className="font-mono">{state.email}</span>
          </p>
          <p className="mt-2 text-xs">
            Compartilhe a senha que você definiu com essa pessoa por um canal
            seguro. No primeiro login, ela vai precisar trocar por uma senha
            só dela.
          </p>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              setPassword("");
            }}
            className="mt-3 text-xs font-medium underline"
          >
            Cadastrar outro
          </button>
        </div>
      ) : (
        <form
          action={(formData: FormData) => {
            setDismissed(false);
            formAction(formData);
          }}
          className="space-y-3"
        >
          <div>
            <label className={labelClass} htmlFor="name">
              Nome
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="role">
              Papel
            </label>
            <select id="role" name="role" defaultValue="MEMBER" className={inputClass}>
              <option value="MEMBER">Familiar</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="password">
              Senha inicial
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + " pr-9"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPassword(generatePassword());
                  setShowPassword(true);
                }}
                title="Gerar senha aleatória"
                className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-300 px-3 text-sm text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Pelo menos 8 caracteres. A pessoa vai trocar por uma senha só
              dela no primeiro login.
            </p>
          </div>

          {state && "error" in state && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 px-3 py-2 font-medium text-white shadow-sm transition hover:from-slate-600 hover:to-slate-700 disabled:opacity-60"
          >
            {pending ? "Criando..." : "Criar usuário"}
          </button>
        </form>
      )}
    </div>
  );
}
