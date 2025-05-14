-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Casino" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "safetyLevel" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Casino" ("createdAt", "id", "imageUrl", "link", "name", "safetyLevel", "type", "updatedAt") SELECT "createdAt", "id", "imageUrl", "link", "name", "safetyLevel", "type", "updatedAt" FROM "Casino";
DROP TABLE "Casino";
ALTER TABLE "new_Casino" RENAME TO "Casino";
CREATE INDEX "Casino_order_idx" ON "Casino"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
