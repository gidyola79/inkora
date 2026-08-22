-- Add message body to notifications so their content can be displayed
ALTER TABLE "Notification" ADD COLUMN "message" TEXT;
