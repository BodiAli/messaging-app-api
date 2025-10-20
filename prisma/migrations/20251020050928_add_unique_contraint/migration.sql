/*
  Warnings:

  - A unique constraint covering the columns `[friendRequestId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,groupChatInvitationId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Notification_friendRequestId_key" ON "Notification"("friendRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_groupChatInvitationId_key" ON "Notification"("userId", "groupChatInvitationId");
