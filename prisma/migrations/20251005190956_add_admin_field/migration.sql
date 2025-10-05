/*
  Warnings:

  - You are about to drop the `_GroupChatToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `adminId` to the `GroupChat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_GroupChatToUser" DROP CONSTRAINT "_GroupChatToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_GroupChatToUser" DROP CONSTRAINT "_GroupChatToUser_B_fkey";

-- AlterTable
ALTER TABLE "GroupChat" ADD COLUMN     "adminId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."_GroupChatToUser";

-- CreateTable
CREATE TABLE "_GroupChats" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupChats_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GroupChats_B_index" ON "_GroupChats"("B");

-- AddForeignKey
ALTER TABLE "GroupChat" ADD CONSTRAINT "GroupChat_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupChats" ADD CONSTRAINT "_GroupChats_A_fkey" FOREIGN KEY ("A") REFERENCES "GroupChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupChats" ADD CONSTRAINT "_GroupChats_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
