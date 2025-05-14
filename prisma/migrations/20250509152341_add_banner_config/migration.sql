-- CreateTable
CREATE TABLE "BannerConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BannerConfig_key_key" ON "BannerConfig"("key");
