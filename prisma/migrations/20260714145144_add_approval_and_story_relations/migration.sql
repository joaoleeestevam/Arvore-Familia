-- CreateTable
CREATE TABLE "StoryPerson" (
    "storyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    PRIMARY KEY ("storyId", "personId"),
    CONSTRAINT "StoryPerson_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryPhoto" (
    "storyId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,

    PRIMARY KEY ("storyId", "photoId"),
    CONSTRAINT "StoryPhoto_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryPhoto_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "birthDate" DATETIME,
    "deathDate" DATETIME,
    "bio" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "profilePhotoId" TEXT,
    "fatherId" TEXT,
    "motherId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_profilePhotoId_fkey" FOREIGN KEY ("profilePhotoId") REFERENCES "Photo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Person" ("address", "bio", "birthDate", "createdAt", "createdById", "deathDate", "email", "fatherId", "fullName", "id", "motherId", "phone", "profilePhotoId", "updatedAt") SELECT "address", "bio", "birthDate", "createdAt", "createdById", "deathDate", "email", "fatherId", "fullName", "id", "motherId", "phone", "profilePhotoId", "updatedAt" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
CREATE UNIQUE INDEX "Person_profilePhotoId_key" ON "Person"("profilePhotoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
