-- Mute users and report notifications
CREATE TABLE "MutedUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mutedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MutedUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MutedUser_userId_mutedId_key" ON "MutedUser"("userId", "mutedId");
CREATE INDEX "MutedUser_userId_idx" ON "MutedUser"("userId");
CREATE INDEX "MutedUser_mutedId_idx" ON "MutedUser"("mutedId");

ALTER TABLE "MutedUser" ADD CONSTRAINT "MutedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MutedUser" ADD CONSTRAINT "MutedUser_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NotificationReport" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'spam',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationReport_notificationId_reporterId_key" ON "NotificationReport"("notificationId", "reporterId");
CREATE INDEX "NotificationReport_notificationId_idx" ON "NotificationReport"("notificationId");
CREATE INDEX "NotificationReport_reporterId_idx" ON "NotificationReport"("reporterId");

ALTER TABLE "NotificationReport" ADD CONSTRAINT "NotificationReport_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationReport" ADD CONSTRAINT "NotificationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
