import { getCurrentUser } from "@/lib/dal";
import ChangePasswordForm from "./change-password-form";

export default async function PerfilPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
          Meu perfil
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {user.name} · {user.email}
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h2 className="mb-3 text-lg font-medium text-stone-900 dark:text-stone-100">
          Alterar senha
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
