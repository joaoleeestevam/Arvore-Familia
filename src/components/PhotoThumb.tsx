/* eslint-disable @next/next/no-img-element */

export default function PhotoThumb({
  photoId,
  alt,
  className,
}: {
  photoId: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={`/api/files/${photoId}`}
      alt={alt}
      className={className ?? "h-full w-full object-contain"}
      loading="lazy"
    />
  );
}
