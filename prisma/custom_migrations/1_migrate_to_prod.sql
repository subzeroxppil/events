-- CreateEnum
CREATE TYPE "events_portal_GroupingStrategy" AS ENUM ('roundRobin', 'maxGroupCapacity');

-- CreateEnum
CREATE TYPE "events_portal_AdminRole" AS ENUM ('SUPERADMIN', 'EVENTADMIN');

-- CreateTable
CREATE TABLE "events_portal_user" (
    "id" SERIAL NOT NULL,
    "workId" TEXT NOT NULL,

    CONSTRAINT "events_portal_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_portal_event" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eventStartTime" TIMESTAMP(3) NOT NULL,
    "eventEndTime" TIMESTAMP(3) NOT NULL,
    "hasLuckyDraw" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL,
    "groupingStrategy" "events_portal_GroupingStrategy",
    "groupConfigNumber" INTEGER,
    "country" TEXT NOT NULL,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "events_portal_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_portal_attendance" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "groupNumber" INTEGER,
    "prizeId" INTEGER,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_portal_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_portal_brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "events_portal_brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_portal_prize" (
    "id" SERIAL NOT NULL,
    "brandId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageBlob" BYTEA NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "events_portal_prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_portal_admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "role" "events_portal_AdminRole" NOT NULL,

    CONSTRAINT "events_portal_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_portal_business_unit_mapping" (
    "email" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,

    CONSTRAINT "events_portal_business_unit_mapping_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "events_portal_admin_user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_portal_admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_portal_user_workId_key" ON "events_portal_user"("workId");

-- CreateIndex
CREATE UNIQUE INDEX "events_portal_attendance_userId_eventId_key" ON "events_portal_attendance"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "events_portal_brand_name_key" ON "events_portal_brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "events_portal_admin_email_key" ON "events_portal_admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_portal_admin_user_email_key" ON "events_portal_admin_user"("email");

-- AddForeignKey
ALTER TABLE "events_portal_attendance" ADD CONSTRAINT "events_portal_attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "events_portal_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_portal_attendance" ADD CONSTRAINT "events_portal_attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events_portal_event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_portal_attendance" ADD CONSTRAINT "events_portal_attendance_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "events_portal_prize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_portal_prize" ADD CONSTRAINT "events_portal_prize_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "events_portal_brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_portal_prize" ADD CONSTRAINT "events_portal_prize_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events_portal_event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

