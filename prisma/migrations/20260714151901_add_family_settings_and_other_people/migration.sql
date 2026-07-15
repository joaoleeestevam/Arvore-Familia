-- AlterTable
ALTER TABLE "Photo" ADD COLUMN "otherPeopleNames" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN "otherPeopleNames" TEXT;

-- CreateTable
CREATE TABLE "FamilySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyName" TEXT NOT NULL DEFAULT 'Minha Família',
    "description" TEXT,
    "backgroundPhotoId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamilySettings_backgroundPhotoId_fkey" FOREIGN KEY ("backgroundPhotoId") REFERENCES "Photo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilySettings_backgroundPhotoId_key" ON "FamilySettings"("backgroundPhotoId");
