// scripts/backup-completo-REAL.js - VERSÃO v3.0 COMPLETA
// ✅ Salva TODAS as tabelas do banco de dados

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BACKUP_DIR = path.join('C:', 'MeusBACKUPS', 'salon-bilro');

function criarPastaBackup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

function getDataFormatada() {
    const now = new Date();
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia}_${hora}h${minuto}`;
}

async function backupDadosCompletos() {
    try {
        console.log('🔄 Fazendo backup de TODAS as tabelas...\n');

        // ✅ Um por vez para evitar erro de conexões no Supabase
        const users = await prisma.user.findMany();
        console.log(`   👥 Usuários: ${users.length}`);

        const services = await prisma.service.findMany();
        console.log(`   ✂️  Serviços: ${services.length}`);

        const slots = await prisma.availableSlot.findMany();
        console.log(`   ⏰ Horários disponíveis: ${slots.length}`);

        const combos = await prisma.serviceCombo.findMany({
            include: {
                services: {
                    include: { service: true }
                }
            }
        });
        console.log(`   🎁 Combos: ${combos.length}`);

        const coupons = await prisma.coupon.findMany();
        console.log(`   🎫 Cupons: ${coupons.length}`);

        const appointments = await prisma.appointment.findMany({
            include: {
                user: true,
                service: true,
                combo: true,
                coupon: true,
            }
        });
        console.log(`   📅 Agendamentos: ${appointments.length}`);

        const appointmentServices = await prisma.appointmentService.findMany({
            include: { service: true }
        });
        console.log(`   🔗 Múltiplos serviços: ${appointmentServices.length}`);

        const statusHistory = await prisma.appointmentStatusHistory.findMany();
        console.log(`   📋 Histórico de status: ${statusHistory.length}`);

        const couponUsages = await prisma.couponUsage.findMany();
        console.log(`   🎟️  Uso de cupons: ${couponUsages.length}`);

        // ✅ NOVO - Avaliações
        const reviews = await prisma.review.findMany();
        console.log(`   ⭐ Avaliações: ${reviews.length}`);

        // ✅ NOVO - Horários bloqueados (férias, folgas, etc)
        const blockedTimes = await prisma.blockedTime.findMany();
        console.log(`   🚫 Horários bloqueados: ${blockedTimes.length}`);

        // ✅ NOVO - Funcionários
        const staff = await prisma.staff.findMany();
        console.log(`   👤 Funcionários: ${staff.length}`);

        // ✅ NOVO - Comandas/serviços executados
        const staffServices = await prisma.staffService.findMany();
        console.log(`   📝 Comandas: ${staffServices.length}`);

        // ✅ NOVO - Relatórios mensais
        const staffMonthlyReports = await prisma.staffMonthlyReport.findMany();
        console.log(`   📊 Relatórios mensais: ${staffMonthlyReports.length}`);

        // ✅ NOVO - Metas financeiras
        const financialGoals = await prisma.financialGoal.findMany();
        console.log(`   🎯 Metas financeiras: ${financialGoals.length}`);

        const backup = {
            timestamp: new Date().toISOString(),
            version: '3.0',
            data: {
                users,
                services,
                slots,
                combos,
                coupons,
                appointments,
                appointmentServices,
                statusHistory,
                couponUsages,
                reviews,
                blockedTimes,
                staff,
                staffServices,
                staffMonthlyReports,
                financialGoals,
            },
            stats: {
                totalUsers: users.length,
                totalServices: services.length,
                totalSlots: slots.length,
                totalCombos: combos.length,
                totalCoupons: coupons.length,
                totalAppointments: appointments.length,
                totalAppointmentServices: appointmentServices.length,
                totalStatusHistory: statusHistory.length,
                totalCouponUsages: couponUsages.length,
                totalReviews: reviews.length,
                totalBlockedTimes: blockedTimes.length,
                totalStaff: staff.length,
                totalStaffServices: staffServices.length,
                totalStaffMonthlyReports: staffMonthlyReports.length,
                totalFinancialGoals: financialGoals.length,
            }
        };

        const data = getDataFormatada();
        const backupFile = path.join(BACKUP_DIR, `dados-completos-${data}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        console.log('\n✅ Backup criado:', backupFile);

        const latestFile = path.join(BACKUP_DIR, 'dados-completos-LATEST.json');
        fs.writeFileSync(latestFile, JSON.stringify(backup, null, 2));
        console.log('✅ Arquivo LATEST atualizado');

        return true;
    } catch (error) {
        console.error('❌ Erro ao fazer backup:', error.message);
        return false;
    }
}

async function backupEnv() {
    try {
        const ENV_FILE = path.join(process.cwd(), '.env.local');
        if (!fs.existsSync(ENV_FILE)) {
            console.log('⚠️ .env.local não encontrado!');
            return false;
        }

        const data = getDataFormatada();
        const backupFile = path.join(BACKUP_DIR, `env-backup-${data}.txt`);
        const envContent = fs.readFileSync(ENV_FILE, 'utf8');

        const header = `# ============================================
# BACKUP DO .ENV - SALON BILRO
# Data: ${new Date().toLocaleString('pt-BR')}
# ============================================

${envContent}`;

        fs.writeFileSync(backupFile, header);
        const latestFile = path.join(BACKUP_DIR, 'env-backup-LATEST.txt');
        fs.writeFileSync(latestFile, header);
        console.log('✅ Backup do .env criado');
        return true;
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

async function executarBackupCompleto() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  BACKUP COMPLETO - SALON BILRO v3.0        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    criarPastaBackup();

    const envSuccess = await backupEnv();
    console.log('');
    const dadosSuccess = await backupDadosCompletos();

    console.log('\n═════════════════════════════════════════════');
    console.log('📊 RELATÓRIO FINAL:');
    console.log('═════════════════════════════════════════════');
    console.log(envSuccess ? '✅ Backup do .env' : '❌ Backup do .env');
    console.log(dadosSuccess ? '✅ Backup dos dados' : '❌ Backup dos dados');
    console.log('═════════════════════════════════════════════');
    console.log(`📁 Local: ${BACKUP_DIR}`);
    console.log('═════════════════════════════════════════════\n');

    await prisma.$disconnect();
}

executarBackupCompleto().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});