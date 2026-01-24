// scripts/backup-completo-REAL.js
// ✅ Este faz backup REAL dos dados, não só do schema

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
        console.log('🔄 Fazendo backup dos DADOS do banco...');

        // Buscar TODOS os dados
        const [users, services, appointments, coupons, combos, slots] = await Promise.all([
            prisma.user.findMany(),
            prisma.service.findMany(),
            prisma.appointment.findMany({ include: { user: true, service: true } }),
            prisma.coupon.findMany(),
            prisma.serviceCombo.findMany({ include: { services: true } }),
            prisma.availableSlot.findMany(),
        ]);

        const backup = {
            timestamp: new Date().toISOString(),
            data: {
                users,
                services,
                appointments,
                coupons,
                combos,
                slots,
            },
            stats: {
                totalUsers: users.length,
                totalServices: services.length,
                totalAppointments: appointments.length,
                totalCoupons: coupons.length,
                totalCombos: combos.length,
                totalSlots: slots.length,
            }
        };

        const data = getDataFormatada();
        const backupFile = path.join(BACKUP_DIR, `dados-completos-${data}.json`);

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        console.log('✅ Backup dos dados criado:', backupFile);

        // Salvar também como LATEST
        const latestFile = path.join(BACKUP_DIR, 'dados-completos-LATEST.json');
        fs.writeFileSync(latestFile, JSON.stringify(backup, null, 2));

        console.log('\n📊 Estatísticas:');
        console.log(`   👥 Usuários: ${users.length}`);
        console.log(`   ✂️ Serviços: ${services.length}`);
        console.log(`   📅 Agendamentos: ${appointments.length}`);
        console.log(`   🎫 Cupons: ${coupons.length}`);
        console.log(`   🎁 Combos: ${combos.length}`);
        console.log(`   ⏰ Horários: ${slots.length}`);

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
        console.log('✅ Backup do .env criado');

        const latestFile = path.join(BACKUP_DIR, 'env-backup-LATEST.txt');
        fs.writeFileSync(latestFile, header);

        return true;
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

async function executarBackupCompleto() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  BACKUP COMPLETO - SALON BILRO             ║');
    console.log('╚════════════════════════════════════════════╝\n');

    criarPastaBackup();

    const envSuccess = await backupEnv();
    const dadosSuccess = await backupDadosCompletos();

    console.log('\n═════════════════════════════════════════════');
    console.log('📊 RELATÓRIO:');
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