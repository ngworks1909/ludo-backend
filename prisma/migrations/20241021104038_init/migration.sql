/*
  Warnings:

  - You are about to alter the column `status` on the `Room` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `Room` MODIFY `status` ENUM('Running', 'Finished') NOT NULL DEFAULT 'Running';
