import AuthCard from "@/components/AuthCard";
import ForgotPasswordForm from "./forgot-password-form";

export const dynamic = "force-dynamic";

export default function EsqueciSenhaPage() {
  return (
    <AuthCard
      title="Esqueci minha senha"
      subtitle="Informe seu email e enviaremos um link para redefinir sua senha."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
