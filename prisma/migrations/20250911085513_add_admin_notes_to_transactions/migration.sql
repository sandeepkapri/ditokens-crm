/*
  Warnings:

  - You are about to drop the `admin_actions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `admin_actions` DROP FOREIGN KEY `admin_actions_adminId_fkey`;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `adminNotes` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `admin_actions`;
