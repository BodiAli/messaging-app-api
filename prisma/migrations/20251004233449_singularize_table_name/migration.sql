/*
  Warnings:

  - You are about to drop the `MessagesToUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."MessagesToUsers" DROP CONSTRAINT "MessagesToUsers_messageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MessagesToUsers" DROP CONSTRAINT "MessagesToUsers_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MessagesToUsers" DROP CONSTRAINT "MessagesToUsers_senderId_fkey";

-- DropTable
DROP TABLE "public"."MessagesToUsers";

-- CreateTable
CREATE TABLE "MessageToUser" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,

    CONSTRAINT "MessageToUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageToUser" ADD CONSTRAINT "MessageToUser_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageToUser" ADD CONSTRAINT "MessageToUser_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageToUser" ADD CONSTRAINT "MessageToUser_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
