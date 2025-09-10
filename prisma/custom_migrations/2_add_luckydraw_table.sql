-- CreateTable
CREATE TABLE "events_portal_luckydraw" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "eventIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "events_portal_luckydraw_pkey" PRIMARY KEY ("id")
);

