-- AlterTable
ALTER TABLE "Person" ADD COLUMN "gender" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "filePath" TEXT,
    "mimeType" TEXT,
    "externalUrl" TEXT,
    "takenDate" DATETIME,
    "caption" TEXT,
    "description" TEXT,
    "otherPeopleNames" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("caption", "createdAt", "description", "filePath", "id", "mimeType", "otherPeopleNames", "takenDate", "uploadedById") SELECT "caption", "createdAt", "description", "filePath", "id", "mimeType", "otherPeopleNames", "takenDate", "uploadedById" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
