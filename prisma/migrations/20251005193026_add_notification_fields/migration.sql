/*
  Warnings:

  - A unique constraint covering the columns `[friendRequestId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[groupChatInvitationId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friendRequestId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupChatInvitationId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "friendRequestId" TEXT NOT NULL,
ADD COLUMN     "groupChatInvitationId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_friendRequestId_key" ON "Notification"("friendRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_groupChatInvitationId_key" ON "Notification"("groupChatInvitationId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_friendRequestId_fkey" FOREIGN KEY ("friendRequestId") REFERENCES "Friendship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_groupChatInvitationId_fkey" FOREIGN KEY ("groupChatInvitationId") REFERENCES "GroupChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
