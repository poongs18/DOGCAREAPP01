/*
  Warnings:

  - You are about to drop the column `endTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickupOption` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `slotId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `species` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the `Slot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `services` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bookingTime` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceVariantId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransportOption" AS ENUM ('NONE', 'PICKUP', 'DROP', 'BOTH');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_slotId_fkey";

-- DropForeignKey
ALTER TABLE "Slot" DROP CONSTRAINT "Slot_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Slot" DROP CONSTRAINT "Slot_staffId_fkey";

-- DropIndex
DROP INDEX "Booking_serviceId_idx";

-- DropIndex
DROP INDEX "Booking_slotId_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "endTime",
DROP COLUMN "pickupOption",
DROP COLUMN "serviceId",
DROP COLUMN "slotId",
DROP COLUMN "startTime",
ADD COLUMN     "bookingTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "serviceVariantId" TEXT NOT NULL,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "transportOption" "TransportOption" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "pets" DROP COLUMN "species";

-- DropTable
DROP TABLE "Slot";

-- DropTable
DROP TABLE "services";

-- DropEnum
DROP TYPE "PickupOption";

-- DropEnum
DROP TYPE "SlotStatus";

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceVariant" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroomingBookingDetails" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "groomingStyle" TEXT,
    "coatCondition" TEXT,
    "specialRequests" TEXT,

    CONSTRAINT "GroomingBookingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingBookingDetails" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "trainingLevel" TEXT,
    "behaviorNotes" TEXT,
    "goals" TEXT,

    CONSTRAINT "TrainingBookingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetBookingDetails" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "symptoms" TEXT,
    "previousIssues" TEXT,
    "medications" TEXT,

    CONSTRAINT "VetBookingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE INDEX "ServiceVariant_serviceId_idx" ON "ServiceVariant"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "GroomingBookingDetails_bookingId_key" ON "GroomingBookingDetails"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBookingDetails_bookingId_key" ON "TrainingBookingDetails"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "VetBookingDetails_bookingId_key" ON "VetBookingDetails"("bookingId");

-- CreateIndex
CREATE INDEX "Booking_serviceVariantId_idx" ON "Booking"("serviceVariantId");

-- AddForeignKey
ALTER TABLE "ServiceVariant" ADD CONSTRAINT "ServiceVariant_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceVariantId_fkey" FOREIGN KEY ("serviceVariantId") REFERENCES "ServiceVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroomingBookingDetails" ADD CONSTRAINT "GroomingBookingDetails_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBookingDetails" ADD CONSTRAINT "TrainingBookingDetails_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetBookingDetails" ADD CONSTRAINT "VetBookingDetails_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
