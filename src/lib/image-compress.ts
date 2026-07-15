// Roda apenas no navegador: fotos tiradas direto do celular podem ter
// dezenas de MB, então redimensionamos e recomprimimos antes do upload.

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function compressFileList(fileList: FileList): Promise<FileList> {
  const dataTransfer = new DataTransfer();
  for (const file of Array.from(fileList)) {
    dataTransfer.items.add(await compressImageFile(file));
  }
  return dataTransfer.files;
}
