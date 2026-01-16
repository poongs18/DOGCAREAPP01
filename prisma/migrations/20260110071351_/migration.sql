/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ServiceVariant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ServiceVariant_name_key" ON "ServiceVariant"("name");
