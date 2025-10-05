-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_friendRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_groupChatInvitationId_fkey";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "friendRequestId" DROP NOT NULL,
ALTER COLUMN "groupChatInvitationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_friendRequestId_fkey" FOREIGN KEY ("friendRequestId") REFERENCES "Friendship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_groupChatInvitationId_fkey" FOREIGN KEY ("groupChatInvitationId") REFERENCES "GroupChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
