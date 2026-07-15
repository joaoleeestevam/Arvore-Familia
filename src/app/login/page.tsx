import Link from "next/link";
import { getFamilySettings } from "@/lib/settings";
import AuthCard from "@/components/AuthCard";
import LoginForm from "./login-form";

// o nome da família pode mudar a qualquer momento em /admin/configuracoes,
// então essa página não pode ficar estática/pré-renderizada
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getFamilySettings();

  return (
    <AuthCard
      title={settings.familyName}
      subtitle="Entre com o email e senha cadastrados pelo administrador."
    >
      <LoginForm />
      <p className="mt-4 text-center text-sm">
        <Link
          href="/esqueci-senha"
          className="text-violet-600 hover:underline dark:text-violet-400"
        >
          Esqueci minha senha
        </Link>
      </p>
    </AuthCard>
  );
}
