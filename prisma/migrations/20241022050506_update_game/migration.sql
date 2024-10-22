/*
  Warnings:

  - Added the required column `entryFee` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prizePool` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Game` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    ADD COLUMN `entryFee` DOUBLE NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `prizePool` DOUBLE NOT NULL;
