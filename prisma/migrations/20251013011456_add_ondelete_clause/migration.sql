-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_friendRequestId_fkey";

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_friendRequestId_fkey" FOREIGN KEY ("friendRequestId") REFERENCES "Friendship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
