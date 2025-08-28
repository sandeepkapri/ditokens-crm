/*
  Warnings:

  - You are about to drop the column `stakingRate` on the `commission_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `commission_settings` DROP COLUMN `stakingRate`;

-- CreateTable
CREATE TABLE `token_supply` (
    `id` VARCHAR(191) NOT NULL,
    `totalSupply` DOUBLE NOT NULL DEFAULT 50000000,
    `tokensSold` DOUBLE NOT NULL DEFAULT 0,
    `tokensAvailable` DOUBLE NOT NULL DEFAULT 50000000,
    `updatedBy` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
