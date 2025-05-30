/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Prize` table. All the data in the column will be lost.
  - Added the required column `imageBlob` to the `Prize` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prize" DROP COLUMN "imageUrl",
ADD COLUMN     "imageBlob" BYTEA NOT NULL;
