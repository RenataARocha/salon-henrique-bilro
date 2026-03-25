-- CreateTable
CREATE TABLE "salon_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "birthdayAutoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "birthdayDiscountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "birthdayDiscountValue" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "birthdayValidDays" INTEGER NOT NULL DEFAULT 30,
    "birthdayMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_settings_pkey" PRIMARY KEY ("id")
);
