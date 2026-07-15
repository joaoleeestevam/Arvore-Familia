import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { readUploadedPhoto } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession();
  if (!session?.userId) {
    return new NextResponse(null, { status: 401 });
  }

  const { id } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { filePath: true, mimeType: true },
  });

  if (!photo || !photo.filePath || !photo.mimeType) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = await readUploadedPhoto(photo.filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
