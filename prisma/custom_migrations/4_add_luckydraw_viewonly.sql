-- AlterTable
-- View-only public lucky draw page ("/live/<luckydrawId>").
--   viewOnlyEnabled : server-side on/off gate for the public page + its APIs
--   liveSpin        : the spin payload the admin broadcasts when Spin is pressed
--   liveSpinAt      : bumped on every broadcast; the SSE poller watches this
ALTER TABLE "events_portal_luckydraw"
    ADD COLUMN "viewOnlyEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "liveSpin" JSONB,
    ADD COLUMN "liveSpinAt" TIMESTAMP(3);
