-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_groupChatId_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "groupChatId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "GroupChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
