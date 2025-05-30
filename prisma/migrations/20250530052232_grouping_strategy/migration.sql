-- CreateEnum
CREATE TYPE "GroupingStrategy" AS ENUM ('numberOfGroups', 'maxPerGroup');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "groupConfigNumber" INTEGER,
ADD COLUMN     "groupingStrategy" "GroupingStrategy";
