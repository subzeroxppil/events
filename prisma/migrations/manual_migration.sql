-- AlterTable
ALTER TABLE "events_portal_admin" RENAME CONSTRAINT "Admin_pkey" TO "events_portal_admin_pkey";

-- AlterTable
ALTER TABLE "events_portal_admin_user" RENAME CONSTRAINT "AdminUser_pkey" TO "events_portal_admin_user_pkey";

-- AlterTable
ALTER TABLE "events_portal_attendance" RENAME CONSTRAINT "Attendance_pkey" TO "events_portal_attendance_pkey";

-- AlterTable
ALTER TABLE "events_portal_brand" RENAME CONSTRAINT "Brand_pkey" TO "events_portal_brand_pkey";

-- AlterTable
ALTER TABLE "events_portal_event" RENAME CONSTRAINT "Event_pkey" TO "events_portal_event_pkey";

-- AlterTable
ALTER TABLE "events_portal_prize" RENAME CONSTRAINT "Prize_pkey" TO "events_portal_prize_pkey";

-- AlterTable
ALTER TABLE "events_portal_user" RENAME CONSTRAINT "User_pkey" TO "events_portal_user_pkey";

-- RenameForeignKey
ALTER TABLE "events_portal_attendance" RENAME CONSTRAINT "Attendance_eventId_fkey" TO "events_portal_attendance_eventId_fkey";

-- RenameForeignKey
ALTER TABLE "events_portal_attendance" RENAME CONSTRAINT "Attendance_prizeId_fkey" TO "events_portal_attendance_prizeId_fkey";

-- RenameForeignKey
ALTER TABLE "events_portal_attendance" RENAME CONSTRAINT "Attendance_userId_fkey" TO "events_portal_attendance_userId_fkey";

-- RenameForeignKey
ALTER TABLE "events_portal_prize" RENAME CONSTRAINT "Prize_brandId_fkey" TO "events_portal_prize_brandId_fkey";

-- RenameForeignKey
ALTER TABLE "events_portal_prize" RENAME CONSTRAINT "Prize_eventId_fkey" TO "events_portal_prize_eventId_fkey";

-- RenameIndex
ALTER INDEX "Admin_email_key" RENAME TO "events_portal_admin_email_key";

-- RenameIndex
ALTER INDEX "AdminUser_email_key" RENAME TO "events_portal_admin_user_email_key";

-- RenameIndex
ALTER INDEX "Brand_name_key" RENAME TO "events_portal_brand_name_key";

-- RenameIndex
ALTER INDEX "User_workId_key" RENAME TO "events_portal_user_workId_key";

