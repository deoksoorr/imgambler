/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Post` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Banner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'MAIN',
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "slogan" TEXT,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "mainLink" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Banner" ("buttonLink", "buttonText", "createdAt", "externalUrl", "fileUrl", "id", "mainLink", "order", "slogan", "type", "updatedAt") SELECT "buttonLink", "buttonText", "createdAt", "externalUrl", "fileUrl", "id", "mainLink", "order", "slogan", "type", "updatedAt" FROM "Banner";
DROP TABLE "Banner";
ALTER TABLE "new_Banner" RENAME TO "Banner";
CREATE INDEX "Banner_category_idx" ON "Banner"("category");
CREATE INDEX "Banner_order_idx" ON "Banner"("order");

CREATE TABLE "new_Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userCode" TEXT NOT NULL,
    "fileUrls" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isNotice" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "boardId" INTEGER NOT NULL,
    CONSTRAINT "Post_userCode_fkey" FOREIGN KEY ("userCode") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("boardId", "content", "createdAt", "dislikes", "id", "isNotice", "isPinned", "likes", "postKey", "title", "updatedAt", "userCode", "views") SELECT "boardId", "content", "createdAt", "dislikes", "id", "isNotice", "isPinned", "likes", "postKey", "title", "updatedAt", "userCode", "views" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_postKey_key" ON "Post"("postKey");
CREATE INDEX "Post_boardId_idx" ON "Post"("boardId");
CREATE INDEX "Post_isPinned_idx" ON "Post"("isPinned");
CREATE INDEX "Post_isNotice_idx" ON "Post"("isNotice");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- Add new columns to User table
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "User_role_idx" ON "User"("role");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
