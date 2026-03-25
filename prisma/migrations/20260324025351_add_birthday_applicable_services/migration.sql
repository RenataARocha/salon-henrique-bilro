-- AlterTable
ALTER TABLE "salon_settings" ADD COLUMN     "birthdayApplicableServices" TEXT[] DEFAULT ARRAY[]::TEXT[];
