import { Settings } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { getFamilySettings } from "@/lib/settings";
import PhotoThumb from "@/components/PhotoThumb";
import SettingsForm from "./settings-form";

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const settings = await getFamilySettings();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
          <Settings className="h-6 w-6 text-slate-500" />
          Configurações da família
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Esses dados identificam esta família dentro do sistema.
        </p>
      </div>

      {settings.backgroundPhotoId && (
        <div className="h-32 overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
          <PhotoThumb
            photoId={settings.backgroundPhotoId}
            alt="Foto de fundo atual"
          />
        </div>
      )}

      <SettingsForm
        initialValues={{
          familyName: settings.familyName,
          description: settings.description ?? "",
        }}
      />
    </div>
  );
}
