/*
  Warnings:

  - Added the required column `commissionPercentage` to the `referral_commissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `referral_commissions` ADD COLUMN `commissionPercentage` DOUBLE NOT NULL DEFAULT 5.0;

-- Update existing records to have the default commission percentage (5%)
UPDATE `referral_commissions` SET `commissionPercentage` = 5.0 WHERE `commissionPercentage` IS NULL;
