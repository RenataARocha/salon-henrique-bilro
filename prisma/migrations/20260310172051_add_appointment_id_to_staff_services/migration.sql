-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "comboId" TEXT,
ALTER COLUMN "serviceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "secondaryPhone" TEXT;

-- CreateTable
CREATE TABLE "service_combos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_services" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "combo_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photo" TEXT,
    "cpf" TEXT,
    "specialties" TEXT[],
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workSchedule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_services" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "staffId" TEXT NOT NULL,
    "serviceId" TEXT,
    "comboId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "serviceValue" DOUBLE PRECISION NOT NULL,
    "commissionValue" DOUBLE PRECISION NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'DINHEIRO',
    "commissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_monthly_reports" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalServices" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paymentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combo_services_comboId_serviceId_key" ON "combo_services"("comboId", "serviceId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_cpf_key" ON "staff"("cpf");

-- CreateIndex
CREATE INDEX "staff_active_idx" ON "staff"("active");

-- CreateIndex
CREATE INDEX "staff_name_idx" ON "staff"("name");

-- CreateIndex
CREATE INDEX "staff_services_staffId_executedAt_idx" ON "staff_services"("staffId", "executedAt");

-- CreateIndex
CREATE INDEX "staff_services_executedAt_idx" ON "staff_services"("executedAt");

-- CreateIndex
CREATE INDEX "staff_services_commissionPaid_idx" ON "staff_services"("commissionPaid");

-- CreateIndex
CREATE INDEX "staff_monthly_reports_year_month_idx" ON "staff_monthly_reports"("year", "month");

-- CreateIndex
CREATE INDEX "staff_monthly_reports_paid_idx" ON "staff_monthly_reports"("paid");

-- CreateIndex
CREATE UNIQUE INDEX "staff_monthly_reports_staffId_year_month_key" ON "staff_monthly_reports"("staffId", "year", "month");

-- CreateIndex
CREATE INDEX "appointments_comboId_idx" ON "appointments"("comboId");

-- AddForeignKey
ALTER TABLE "combo_services" ADD CONSTRAINT "combo_services_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "service_combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_services" ADD CONSTRAINT "combo_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "service_combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "service_combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_monthly_reports" ADD CONSTRAINT "staff_monthly_reports_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
