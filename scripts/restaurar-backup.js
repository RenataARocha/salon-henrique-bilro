// scripts/restaurar-backup.js - VERSÃO CORRIGIDA
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BACKUP_DIR = path.join('C:', 'MeusBACKUPS', 'salon-bilro');

async function restaurarBackup(backupFile) {
    try {
        console.log('⚠️ ATENÇÃO: Isso vai SUBSTITUIR todos os dados!');
        console.log('📂 Arquivo:', backupFile);

        if (!fs.existsSync(backupFile)) {
            console.error('❌ Arquivo de backup não encontrado!');
            return false;
        }

        const backupContent = fs.readFileSync(backupFile, 'utf8');
        const backup = JSON.parse(backupContent);

        console.log('\n🗑️ Limpando dados existentes...');

        // Limpar na ordem correta
        await prisma.appointment.deleteMany();
        await prisma.coupon.deleteMany();
        await prisma.couponUsage.deleteMany();
        await prisma.comboService.deleteMany(); // ✅ Tabela de relação
        await prisma.serviceCombo.deleteMany();
        await prisma.service.deleteMany();
        await prisma.availableSlot.deleteMany();
        await prisma.user.deleteMany();

        console.log('✅ Dados antigos removidos\n');
        console.log('📥 Restaurando dados...\n');

        // 1. Restaurar usuários
        if (backup.data.users?.length > 0) {
            for (const user of backup.data.users) {
                await prisma.user.create({ data: user });
            }
            console.log(`✅ ${backup.data.users.length} usuários restaurados`);
        }

        // 2. Restaurar serviços
        if (backup.data.services?.length > 0) {
            for (const service of backup.data.services) {
                await prisma.service.create({ data: service });
            }
            console.log(`✅ ${backup.data.services.length} serviços restaurados`);
        }

        // 3. Restaurar horários
        if (backup.data.slots?.length > 0) {
            for (const slot of backup.data.slots) {
                await prisma.availableSlot.create({ data: slot });
            }
            console.log(`✅ ${backup.data.slots.length} horários restaurados`);
        }

        // 4. Restaurar combos (CORRIGIDO - Cria mapeamento de IDs)
        if (backup.data.combos?.length > 0) {
            // Buscar serviços reais do banco
            const servicesInDb = await prisma.service.findMany();
            const serviceMap = new Map(servicesInDb.map(s => [s.name, s.id]));

            for (const combo of backup.data.combos) {
                const { services, ...comboData } = combo;

                // Criar combo SEM os serviços primeiro
                const createdCombo = await prisma.serviceCombo.create({
                    data: {
                        id: comboData.id,
                        name: comboData.name,
                        description: comboData.description,
                        originalPrice: comboData.originalPrice,
                        comboPrice: comboData.comboPrice,
                        discountPercent: comboData.discountPercent,
                        active: comboData.active,
                        featured: comboData.featured,
                        createdAt: comboData.createdAt,
                        updatedAt: comboData.updatedAt,
                    }
                });

                // Conectar serviços usando os NOMES para encontrar IDs corretos
                if (services && services.length > 0) {
                    for (const service of services) {
                        // Buscar ID real do serviço pelo nome
                        const realServiceId = serviceMap.get(service.name);

                        if (realServiceId) {
                            await prisma.comboService.create({
                                data: {
                                    comboId: createdCombo.id,
                                    serviceId: realServiceId
                                }
                            });
                        } else {
                            console.warn(`⚠️ Serviço não encontrado: ${service.name}`);
                        }
                    }
                }
            }
            console.log(`✅ ${backup.data.combos.length} combos restaurados`);
        }

        // 5. Restaurar cupons
        if (backup.data.coupons?.length > 0) {
            for (const coupon of backup.data.coupons) {
                await prisma.coupon.create({ data: coupon });
            }
            console.log(`✅ ${backup.data.coupons.length} cupons restaurados`);
        }

        // 6. Restaurar agendamentos
        if (backup.data.appointments?.length > 0) {
            for (const appointment of backup.data.appointments) {
                const { user, service, combo, coupon, ...aptData } = appointment;
                await prisma.appointment.create({ data: aptData });
            }
            console.log(`✅ ${backup.data.appointments.length} agendamentos restaurados`);
        }

        console.log('\n✅ RESTAURAÇÃO CONCLUÍDA!');
        console.log(`📅 Backup de: ${backup.timestamp}`);
        console.log('\n📊 Dados restaurados:');
        console.log(`   👥 Usuários: ${backup.data.users?.length || 0}`);
        console.log(`   ✂️ Serviços: ${backup.data.services?.length || 0}`);
        console.log(`   📅 Agendamentos: ${backup.data.appointments?.length || 0}`);
        console.log(`   🎫 Cupons: ${backup.data.coupons?.length || 0}`);
        console.log(`   🎁 Combos: ${backup.data.combos?.length || 0}`);
        console.log(`   ⏰ Horários: ${backup.data.slots?.length || 0}\n`);

        return true;
    } catch (error) {
        console.error('❌ Erro ao restaurar:', error.message);
        console.error('\n💡 Detalhes do erro:');
        console.error(error);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

// Usar o arquivo LATEST
const backupFile = path.join(BACKUP_DIR, 'dados-completos-LATEST.json');
restaurarBackup(backupFile);