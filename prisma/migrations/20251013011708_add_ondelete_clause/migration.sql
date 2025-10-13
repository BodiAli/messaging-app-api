-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_groupChatInvitationId_fkey";

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_groupChatInvitationId_fkey" FOREIGN KEY ("groupChatInvitationId") REFERENCES "GroupChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
