// scripts/backup.js
// Script para fazer backup automático do .env e banco de dados

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configurações
const BACKUP_DIR = path.join('C:', 'MeusBACKUPS', 'salon-bilro');
const ENV_FILE = path.join(process.cwd(), '.env.local');
const PROJECT_ROOT = process.cwd();

// Criar pasta de backup se não existir
function criarPastaBackup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log('✅ Pasta de backup criada:', BACKUP_DIR);
    }
}

// Obter data formatada
function getDataFormatada() {
    const now = new Date();
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');

    return `${ano}-${mes}-${dia}_${hora}h${minuto}`;
}

// Backup do .env
function backupEnv() {
    try {
        if (!fs.existsSync(ENV_FILE)) {
            console.log('⚠️ Arquivo .env.local não encontrado!');
            return false;
        }

        const data = getDataFormatada();
        const backupFile = path.join(BACKUP_DIR, `env-backup-${data}.txt`);

        // Ler .env.local
        const envContent = fs.readFileSync(ENV_FILE, 'utf8');

        // Adicionar cabeçalho informativo
        const header = `# ============================================
# BACKUP DO .ENV - SALON BILRO
# Data: ${new Date().toLocaleString('pt-BR')}
# ============================================
#
# ⚠️ IMPORTANTE:
# - Este arquivo contém informações sensíveis
# - Não compartilhe com ninguém
# - Guarde em local seguro
#
# Em caso de emergência:
# 1. Copie todo o conteúdo abaixo
# 2. Cole no arquivo .env.local do projeto
# 3. Reinicie o servidor: npm run dev
#
# ============================================

${envContent}

# ============================================
# FIM DO BACKUP
# ============================================
`;

        fs.writeFileSync(backupFile, header);
        console.log('✅ Backup do .env criado:', backupFile);

        // Criar também uma cópia "latest" (sempre a mais recente)
        const latestFile = path.join(BACKUP_DIR, 'env-backup-LATEST.txt');
        fs.writeFileSync(latestFile, header);

        return true;
    } catch (error) {
        console.error('❌ Erro ao fazer backup do .env:', error.message);
        return false;
    }
}

// Backup do banco de dados (PostgreSQL)
function backupDatabase() {
    return new Promise((resolve, reject) => {
        // Ler DATABASE_URL do .env
        if (!fs.existsSync(ENV_FILE)) {
            console.log('⚠️ .env.local não encontrado, pulando backup do banco');
            resolve(false);
            return;
        }

        const envContent = fs.readFileSync(ENV_FILE, 'utf8');
        const dbUrlMatch = envContent.match(/DATABASE_URL="(.+)"/);

        if (!dbUrlMatch) {
            console.log('⚠️ DATABASE_URL não encontrado no .env');
            resolve(false);
            return;
        }

        const databaseUrl = dbUrlMatch[1];

        // Verificar se é PostgreSQL local ou Supabase
        if (databaseUrl.includes('supabase.co')) {
            console.log('ℹ️ Supabase detectado - backup automático já está ativo');
            resolve(true);
            return;
        }

        const data = getDataFormatada();
        const backupFile = path.join(BACKUP_DIR, `banco-backup-${data}.sql`);

        console.log('🔄 Fazendo backup do banco de dados...');

        // Comando pg_dump
        const comando = `pg_dump "${databaseUrl}" > "${backupFile}"`;

        exec(comando, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Erro ao fazer backup do banco:', error.message);
                console.log('💡 Dica: Certifique-se que PostgreSQL está instalado');
                resolve(false);
                return;
            }

            console.log('✅ Backup do banco criado:', backupFile);

            // Criar cópia "latest"
            const latestFile = path.join(BACKUP_DIR, 'banco-backup-LATEST.sql');
            fs.copyFileSync(backupFile, latestFile);

            resolve(true);
        });
    });
}

// Limpar backups antigos (manter últimos 10)
function limparBackupsAntigos() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);

        // Separar por tipo
        const envBackups = files.filter(f => f.startsWith('env-backup-') && f !== 'env-backup-LATEST.txt');
        const dbBackups = files.filter(f => f.startsWith('banco-backup-') && f !== 'banco-backup-LATEST.sql');

        // Ordenar por data (mais recente primeiro)
        const sortFiles = (arr) => arr.sort().reverse();

        // Deletar backups antigos (manter últimos 10 de cada)
        const deleteOld = (backups) => {
            if (backups.length > 10) {
                backups.slice(10).forEach(file => {
                    const filePath = path.join(BACKUP_DIR, file);
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Backup antigo removido:', file);
                });
            }
        };

        deleteOld(sortFiles(envBackups));
        deleteOld(sortFiles(dbBackups));

    } catch (error) {
        console.error('⚠️ Erro ao limpar backups antigos:', error.message);
    }
}

// Criar relatório de backup
function criarRelatorio(envSuccess, dbSuccess) {
    const data = new Date().toLocaleString('pt-BR');
    const relatorio = `
╔════════════════════════════════════════════╗
║     RELATÓRIO DE BACKUP - SALON BILRO      ║
╚════════════════════════════════════════════╝

Data/Hora: ${data}
Local: ${BACKUP_DIR}

Status:
${envSuccess ? '✅' : '❌'} Backup do .env
${dbSuccess ? '✅' : '❌'} Backup do banco de dados

${envSuccess && dbSuccess ? '✅ BACKUP COMPLETO COM SUCESSO!' : '⚠️ Backup parcial - verifique os erros acima'}

Próximo backup: Configure no agendador de tarefas

═════════════════════════════════════════════
`;

    console.log(relatorio);

    // Salvar relatório
    const relatorioFile = path.join(BACKUP_DIR, 'ultimo-backup.txt');
    fs.writeFileSync(relatorioFile, relatorio);
}

// Função principal
async function executarBackup() {
    console.log('\n🔄 INICIANDO BACKUP...\n');

    // 1. Criar pasta
    criarPastaBackup();

    // 2. Backup do .env
    const envSuccess = backupEnv();

    // 3. Backup do banco
    const dbSuccess = await backupDatabase();

    // 4. Limpar antigos
    limparBackupsAntigos();

    // 5. Relatório
    criarRelatorio(envSuccess, dbSuccess);

    console.log('\n✅ BACKUP FINALIZADO!\n');
}

// Executar
executarBackup().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});