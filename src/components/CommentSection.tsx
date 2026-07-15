"use client";

import { useActionState, useTransition } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { createComment, deleteComment } from "@/app/actions/comment";

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  canDelete: boolean;
};

export default function CommentSection({
  photoId,
  comments,
}: {
  photoId: string;
  comments: CommentItem[];
}) {
  const [state, formAction, pending] = useActionState(
    createComment.bind(null, photoId),
    undefined,
  );
  const [deleting, startDeleting] = useTransition();

  return (
    <div className="space-y-4 border-t border-stone-200 pt-4 dark:border-stone-800">
      <h2 className="flex items-center gap-2 text-sm font-medium text-stone-900 dark:text-stone-100">
        <MessageCircle className="h-4 w-4 text-slate-500" />
        Comentários
      </h2>

      {comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {comment.authorName}
                  </p>
                  <p className="text-xs text-stone-400">{comment.createdAt}</p>
                </div>
                {comment.canDelete && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() =>
                      startDeleting(() => deleteComment(comment.id))
                    }
                    title="Excluir comentário"
                    className="text-stone-400 hover:text-red-600 disabled:opacity-60 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-300">
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-2">
        <textarea
          name="content"
          rows={2}
          required
          placeholder="Escreva um comentário..."
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
        />
        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-violet-500/20 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
        >
          {pending ? "Enviando..." : "Comentar"}
        </button>
      </form>
    </div>
  );
}
