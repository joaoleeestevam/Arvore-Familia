import { redirect } from "next/navigation";
import { getCurrentUserForPasswordChange } from "@/lib/dal";
import AuthCard from "@/components/AuthCard";
import ChangePasswordMandatoryForm from "./change-password-mandatory-form";

export default async function TrocarSenhaPage() {
  const user = await getCurrentUserForPasswordChange();

  if (!user.mustChangePassword) {
    redirect("/");
  }

  return (
    <AuthCard
      title={`Olá, ${user.name}`}
      subtitle="Por segurança, defina uma nova senha só sua antes de continuar."
    >
      <ChangePasswordMandatoryForm />
    </AuthCard>
  );
}
