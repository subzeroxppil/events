/*
  Warnings:

  - The values [numberOfGroups,maxPerGroup] on the enum `GroupingStrategy` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GroupingStrategy_new" AS ENUM ('roundRobin', 'maxGroupCapacity');
ALTER TABLE "Event" ALTER COLUMN "groupingStrategy" TYPE "GroupingStrategy_new" USING ("groupingStrategy"::text::"GroupingStrategy_new");
ALTER TYPE "GroupingStrategy" RENAME TO "GroupingStrategy_old";
ALTER TYPE "GroupingStrategy_new" RENAME TO "GroupingStrategy";
DROP TYPE "GroupingStrategy_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
