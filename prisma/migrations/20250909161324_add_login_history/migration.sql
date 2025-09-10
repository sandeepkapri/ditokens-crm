-- CreateTable
CREATE TABLE `login_history` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NOT NULL,
    `status` ENUM('SUCCESS', 'FAILED', 'BLOCKED') NOT NULL DEFAULT 'SUCCESS',
    `location` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `login_history` ADD CONSTRAINT `login_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
