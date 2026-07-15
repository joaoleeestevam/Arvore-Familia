import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateStory } from "@/app/actions/story";
import StoryForm from "@/components/StoryForm";

export default async function EditarHistoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const [story, people] = await Promise.all([
    prisma.story.findUnique({
      where: { id },
      include: { people: true },
    }),
    prisma.person.findMany({
      where: { status: "APPROVED" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);
  if (!story) notFound();

  if (user.role !== "ADMIN" && story.authorId !== user.id) {
    redirect(`/historias/${story.id}`);
  }

  const boundAction = updateStory.bind(null, story.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Editar história
      </h1>
      <StoryForm
        action={boundAction}
        people={people}
        submitLabel="Salvar alterações"
        initialValues={{
          title: story.title,
          content: story.content,
          personIds: story.people.map((p) => p.personId),
          otherPeopleNames: story.otherPeopleNames ?? undefined,
        }}
      />
    </div>
  );
}
