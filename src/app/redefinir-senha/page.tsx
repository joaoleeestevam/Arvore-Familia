import AuthCard from "@/components/AuthCard";
import ResetPasswordForm from "./reset-password-form";

export const dynamic = "force-dynamic";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Link inválido">
        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          Este link de redefinição de senha está incompleto. Solicite um novo
          em &quot;Esqueci minha senha&quot;.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Redefinir senha"
      subtitle="Escolha uma nova senha para sua conta."
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
