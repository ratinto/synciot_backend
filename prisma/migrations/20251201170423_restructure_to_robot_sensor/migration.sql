/*
  Warnings:

  - You are about to drop the `alerts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rover_commands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rovers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sensor_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_roverId_fkey";

-- DropForeignKey
ALTER TABLE "rover_commands" DROP CONSTRAINT "rover_commands_roverId_fkey";

-- DropForeignKey
ALTER TABLE "sensor_logs" DROP CONSTRAINT "sensor_logs_roverId_fkey";

-- DropTable
DROP TABLE "alerts";

-- DropTable
DROP TABLE "rover_commands";

-- DropTable
DROP TABLE "rovers";

-- DropTable
DROP TABLE "sensor_logs";

-- CreateTable
CREATE TABLE "robots" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "battery" INTEGER NOT NULL DEFAULT 0,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "robots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" SERIAL NOT NULL,
    "robotId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sensors_robotId_idx" ON "sensors"("robotId");

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "robots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
