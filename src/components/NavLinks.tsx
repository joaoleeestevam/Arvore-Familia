"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TreePine, Images, BookOpen, Users, Settings } from "lucide-react";

const links = [
  { href: "/", label: "Início", icon: Home },
  { href: "/arvore", label: "Árvore", icon: TreePine },
  { href: "/fotos", label: "Fotos", icon: Images },
  { href: "/historias", label: "Histórias", icon: BookOpen },
];

const adminLinks = [
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const allLinks = isAdmin ? [...links, ...adminLinks] : links;

  return (
    <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
      {allLinks.map((link) => {
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors " +
              (isActive
                ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
