-- CreateTable
CREATE TABLE "Union" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerAId" TEXT NOT NULL,
    "partnerBId" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Union_partnerAId_fkey" FOREIGN KEY ("partnerAId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Union_partnerBId_fkey" FOREIGN KEY ("partnerBId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Union_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
