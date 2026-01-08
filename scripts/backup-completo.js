// scripts/backup-completo.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join('C:', 'MeusBACKUPS', 'salon-bilro');
const ENV_FILE = path.join(process.cwd(), '.env.local');

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

function backupEnv() {
    try {
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

${envContent}

# ============================================
# FIM DO BACKUP
# ============================================
`;

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

function backupDatabaseViaPrisma() {
    try {
        const data = getDataFormatada();
        const schemaFile = path.join(BACKUP_DIR, `schema-backup-${data}.txt`);

        console.log('🔄 Fazendo backup do schema...');

        // Copiar schema.prisma
        const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
        fs.writeFileSync(schemaFile, schemaContent);

        console.log('✅ Schema do banco salvo');

        const latestFile = path.join(BACKUP_DIR, 'schema-backup-LATEST.txt');
        fs.writeFileSync(latestFile, schemaContent);

        return true;
    } catch (error) {
        console.error('❌ Erro ao backup do schema:', error.message);
        return false;
    }
}

async function executarBackup() {
    console.log('\n🔄 INICIANDO BACKUP...\n');

    criarPastaBackup();

    const envSuccess = backupEnv();
    const schemaSuccess = backupDatabaseViaPrisma();

    console.log('\n═══════════════════════════════════════');
    console.log('📊 RELATÓRIO:');
    console.log('═══════════════════════════════════════');
    console.log(envSuccess ? '✅ Backup do .env' : '❌ Backup do .env');
    console.log(schemaSuccess ? '✅ Backup do schema' : '❌ Backup do schema');
    console.log('═══════════════════════════════════════');
    console.log(`📁 Local: ${BACKUP_DIR}`);
    console.log('═══════════════════════════════════════\n');
}

executarBackup();