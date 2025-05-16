/*
  Warnings:

  - You are about to drop the `Casino` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Casino";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "OnlineCasino" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "establishedYear" INTEGER,
    "operator" TEXT,
    "license" TEXT,
    "isMobileSupported" BOOLEAN NOT NULL DEFAULT false,
    "avgRating" REAL,
    "withdrawalSpeed" TEXT,
    "minDeposit" INTEGER,
    "minWithdrawal" INTEGER,
    "withdrawalLimit" INTEGER,
    "visitUrl" TEXT,
    "reviewUrl" TEXT,
    "description" TEXT,
    "review" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OnlineCasinoProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "OnlineCasinoGameType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "OnlineCasinoLanguage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "casinoId" INTEGER NOT NULL,
    CONSTRAINT "OnlineCasinoLanguage_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "OnlineCasino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnlineCasinoSupportLanguage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "casinoId" INTEGER NOT NULL,
    CONSTRAINT "OnlineCasinoSupportLanguage_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "OnlineCasino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnlineCasinoPro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "casinoId" INTEGER NOT NULL,
    CONSTRAINT "OnlineCasinoPro_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "OnlineCasino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnlineCasinoCon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "casinoId" INTEGER NOT NULL,
    CONSTRAINT "OnlineCasinoCon_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "OnlineCasino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnlineCasinoPaymentMethod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "casinoId" INTEGER NOT NULL,
    CONSTRAINT "OnlineCasinoPaymentMethod_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "OnlineCasino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnlineCasinoScreenshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "casinoId" INTEGER NOT NULL,
    CONSTRAINT "OnlineCasinoScreenshot_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "OnlineCasino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_OnlineCasinoToOnlineCasinoProvider" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_OnlineCasinoToOnlineCasinoProvider_A_fkey" FOREIGN KEY ("A") REFERENCES "OnlineCasino" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OnlineCasinoToOnlineCasinoProvider_B_fkey" FOREIGN KEY ("B") REFERENCES "OnlineCasinoProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_OnlineCasinoToOnlineCasinoGameType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_OnlineCasinoToOnlineCasinoGameType_A_fkey" FOREIGN KEY ("A") REFERENCES "OnlineCasino" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OnlineCasinoToOnlineCasinoGameType_B_fkey" FOREIGN KEY ("B") REFERENCES "OnlineCasinoGameType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineCasinoProvider_name_key" ON "OnlineCasinoProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineCasinoGameType_name_key" ON "OnlineCasinoGameType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_OnlineCasinoToOnlineCasinoProvider_AB_unique" ON "_OnlineCasinoToOnlineCasinoProvider"("A", "B");

-- CreateIndex
CREATE INDEX "_OnlineCasinoToOnlineCasinoProvider_B_index" ON "_OnlineCasinoToOnlineCasinoProvider"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OnlineCasinoToOnlineCasinoGameType_AB_unique" ON "_OnlineCasinoToOnlineCasinoGameType"("A", "B");

-- CreateIndex
CREATE INDEX "_OnlineCasinoToOnlineCasinoGameType_B_index" ON "_OnlineCasinoToOnlineCasinoGameType"("B");
