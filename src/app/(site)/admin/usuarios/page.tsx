import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import CreateUserForm from "./create-user-form";
import UserRow from "./user-row";

export default async function UsuariosPage() {
  const currentUser = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
        <Users className="h-6 w-6 text-slate-500" />
        Usuários da família
      </h1>

      <CreateUserForm />

      <div className="space-y-3">
        {users.map((user) => (
          <UserRow
            key={user.id}
            id={user.id}
            name={user.name}
            email={user.email}
            role={user.role}
            isActive={user.isActive}
            isSelf={user.id === currentUser.id}
          />
        ))}
      </div>
    </div>
  );
}
