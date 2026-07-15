import PhotoThumb from "@/components/PhotoThumb";

export type MediaKind = "IMAGE" | "VIDEO_FILE" | "VIDEO_LINK";

function getEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shortsMatch = url.pathname.match(/\/shorts\/([^/]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

const PLAY_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export default function MediaThumb({
  id,
  mediaType,
  externalUrl,
  alt,
  className,
  interactive = false,
}: {
  id: string;
  mediaType: MediaKind;
  externalUrl?: string | null;
  alt: string;
  className?: string;
  interactive?: boolean;
}) {
  if (mediaType === "IMAGE") {
    return <PhotoThumb photoId={id} alt={alt} className={className} />;
  }

  if (mediaType === "VIDEO_FILE") {
    return (
      <video
        src={`/api/files/${id}`}
        controls={interactive}
        muted={!interactive}
        preload="metadata"
        className={className ?? "h-full w-full object-contain"}
      />
    );
  }

  // VIDEO_LINK
  const embedUrl = externalUrl ? getEmbedUrl(externalUrl) : null;
  const placeholderClassName =
    className ??
    "flex h-full w-full flex-col items-center justify-center gap-1 bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400";

  if (!interactive) {
    // Em grades, o card já é um link (para a página de detalhe); um <a>
    // aqui dentro seria uma âncora aninhada, então só mostramos o ícone.
    return <div className={placeholderClassName}>{PLAY_ICON}</div>;
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        allowFullScreen
        className={className ?? "aspect-video h-full w-full"}
      />
    );
  }

  return (
    <a
      href={externalUrl ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={placeholderClassName}
    >
      {PLAY_ICON}
      <span className="text-sm">Assistir vídeo externo</span>
    </a>
  );
}
