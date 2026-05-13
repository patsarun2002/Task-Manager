/*
  Warnings:

  - You are about to drop the column `completed` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "completed",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "deadlineTime" TEXT,
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "recurringDays" TEXT,
ADD COLUMN     "recurringLastCompleted" TIMESTAMP(3),
ADD COLUMN     "recurringType" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "Subtask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "taskId" INTEGER NOT NULL,

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
