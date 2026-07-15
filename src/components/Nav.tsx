import Link from "next/link";
import { LogOut, TreePine } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getFamilySettings } from "@/lib/settings";
import { logout } from "@/app/actions/auth";
import NavLinks from "@/components/NavLinks";

export default async function Nav() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getFamilySettings(),
  ]);

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm">
            <TreePine className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-lg font-semibold text-transparent dark:from-violet-400 dark:to-fuchsia-400">
            {settings.familyName}
          </span>
        </Link>

        <NavLinks isAdmin={user.role === "ADMIN"} />

        <div className="flex shrink-0 items-center gap-3 text-sm">
          <Link
            href="/perfil"
            className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
            title={user.name}
          >
            {user.name}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              title="Sair"
              className="flex items-center gap-1 text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
