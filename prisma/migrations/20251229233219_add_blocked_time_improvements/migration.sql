-- CreateEnum
CREATE TYPE "BlockedTimeType" AS ENUM ('LUNCH_BREAK', 'DAY_OFF', 'HOLIDAY', 'VACATION', 'MAINTENANCE', 'SPECIAL_EVENT', 'OTHER');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "finalPrice" DOUBLE PRECISION,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "rescheduledFrom" TEXT;

-- CreateTable
CREATE TABLE "appointment_status_history" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "appointment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "applicableServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_times" (
    "id" TEXT NOT NULL,
    "type" "BlockedTimeType" NOT NULL,
    "date" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "dayOfWeek" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_appointmentId_key" ON "reviews"("appointmentId");

-- CreateIndex
CREATE INDEX "blocked_times_date_idx" ON "blocked_times"("date");

-- CreateIndex
CREATE INDEX "blocked_times_dayOfWeek_idx" ON "blocked_times"("dayOfWeek");

-- CreateIndex
CREATE INDEX "blocked_times_isRecurring_idx" ON "blocked_times"("isRecurring");

-- CreateIndex
CREATE INDEX "blocked_times_type_idx" ON "blocked_times"("type");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_status_history" ADD CONSTRAINT "appointment_status_history_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_times" ADD CONSTRAINT "blocked_times_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
