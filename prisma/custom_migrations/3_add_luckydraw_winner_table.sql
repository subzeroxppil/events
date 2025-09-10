-- CreateTable
CREATE TABLE "events_portal_luckydraw_winners" (
    "id" SERIAL NOT NULL,
    "luckydrawId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_portal_luckydraw_winners_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "events_portal_luckydraw_winners" ADD CONSTRAINT "events_portal_luckydraw_winners_luckydrawId_fkey" FOREIGN KEY ("luckydrawId") REFERENCES "events_portal_luckydraw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_portal_luckydraw_winners" ADD CONSTRAINT "events_portal_luckydraw_winners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "events_portal_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;