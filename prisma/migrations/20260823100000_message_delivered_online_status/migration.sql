-- Add online status fields and message delivered timestamp
ALTER TABLE "User" ADD COLUMN "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "deliveredAt" TIMESTAMP(3);