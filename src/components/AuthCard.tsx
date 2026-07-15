import { TreePine } from "lucide-react";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-4 dark:bg-stone-950">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-700/20" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-300/40 blur-3xl dark:bg-fuchsia-700/20" />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white/90 p-8 shadow-xl shadow-stone-300/30 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/90 dark:shadow-none">
        <div className="mb-5 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <TreePine className="h-7 w-7" />
          </span>
        </div>
        <h1 className="mb-1 text-center text-2xl font-semibold text-stone-900 dark:text-stone-100">
          {title}
        </h1>
        {subtitle && (
          <p className="mb-6 text-center text-sm text-stone-500 dark:text-stone-400">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
