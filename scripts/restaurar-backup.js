// scripts/restaurar-backup.js - VERSÃO v4.0 COMPLETA
// ✅ Restaura TODAS as tabelas do banco de dados

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BACKUP_DIR = path.join('C:', 'MeusBACKUPS', 'salon-bilro');

async function restaurarBackup(backupFile) {
    try {
        console.log('⚠️  ATENÇÃO: Isso vai SUBSTITUIR todos os dados!');
        console.log('📂 Arquivo:', backupFile);

        if (!fs.existsSync(backupFile)) {
            console.error('❌ Arquivo de backup não encontrado!');
            return false;
        }

        const backupContent = fs.readFileSync(backupFile, 'utf8');
        const backup = JSON.parse(backupContent);

        console.log(`\n📅 Backup de: ${backup.timestamp}`);
        console.log(`📦 Versão: ${backup.version || '1.0'}\n`);
        console.log('🗑️  Limpando dados existentes...');

        // ✅ Limpar na ordem correta (filhos antes dos pais)
        await prisma.review.deleteMany();
        await prisma.staffService.deleteMany();
        await prisma.staffMonthlyReport.deleteMany();
        await prisma.staff.deleteMany();
        await prisma.appointmentService.deleteMany();
        await prisma.appointmentStatusHistory.deleteMany();
        await prisma.couponUsage.deleteMany();
        await prisma.appointment.deleteMany();
        await prisma.coupon.deleteMany();
        await prisma.comboService.deleteMany();
        await prisma.serviceCombo.deleteMany();
        await prisma.service.deleteMany();
        await prisma.availableSlot.deleteMany();
        await prisma.blockedTime.deleteMany();
        await prisma.financialGoal.deleteMany();
        await prisma.passwordReset.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.user.deleteMany();

        console.log('✅ Dados antigos removidos\n');
        console.log('📥 Restaurando dados...\n');

        // 1. Usuários
        if (backup.data.users?.length > 0) {
            for (const user of backup.data.users) {
                await prisma.user.create({ data: user });
            }
            console.log(`✅ ${backup.data.users.length} usuários restaurados`);
        }

        // 2. Serviços
        if (backup.data.services?.length > 0) {
            for (const service of backup.data.services) {
                await prisma.service.create({ data: service });
            }
            console.log(`✅ ${backup.data.services.length} serviços restaurados`);
        }

        // 3. Horários disponíveis
        if (backup.data.slots?.length > 0) {
            for (const slot of backup.data.slots) {
                await prisma.availableSlot.create({ data: slot });
            }
            console.log(`✅ ${backup.data.slots.length} horários restaurados`);
        }

        // 4. Combos com serviços vinculados
        if (backup.data.combos?.length > 0) {
            const servicesInDb = await prisma.service.findMany();
            const serviceMapByName = new Map(servicesInDb.map(s => [s.name, s.id]));
            const serviceMapById = new Map(servicesInDb.map(s => [s.id, s.id]));

            for (const combo of backup.data.combos) {
                const { services, ...comboData } = combo;

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

                if (services?.length > 0) {
                    for (const serviceEntry of services) {
                        let realServiceId = null;

                        // Suporta todos os formatos possíveis do backup
                        if (serviceEntry?.service?.name) {
                            realServiceId = serviceMapByName.get(serviceEntry.service.name);
                        } else if (serviceEntry?.service?.id) {
                            realServiceId = serviceMapById.get(serviceEntry.service.id);
                        } else if (serviceEntry?.name) {
                            realServiceId = serviceMapByName.get(serviceEntry.name);
                        } else if (serviceEntry?.serviceId) {
                            realServiceId = serviceMapById.get(serviceEntry.serviceId);
                        } else if (serviceEntry?.id) {
                            realServiceId = serviceMapById.get(serviceEntry.id);
                        }

                        if (realServiceId) {
                            await prisma.comboService.create({
                                data: {
                                    comboId: createdCombo.id,
                                    serviceId: realServiceId
                                }
                            });
                        } else {
                            console.warn(`   ⚠️  Serviço não encontrado no combo "${combo.name}"`);
                        }
                    }
                }
            }
            console.log(`✅ ${backup.data.combos.length} combos restaurados`);
        }

        // 5. Cupons
        if (backup.data.coupons?.length > 0) {
            for (const coupon of backup.data.coupons) {
                await prisma.coupon.create({ data: coupon });
            }
            console.log(`✅ ${backup.data.coupons.length} cupons restaurados`);
        }

        // 6. Agendamentos
        if (backup.data.appointments?.length > 0) {
            for (const appointment of backup.data.appointments) {
                const { user, service, combo, coupon, statusHistory,
                    appointmentServices, staffServices, review,
                    couponUsages, ...aptData } = appointment;
                await prisma.appointment.create({ data: aptData });
            }
            console.log(`✅ ${backup.data.appointments.length} agendamentos restaurados`);
        }

        // 7. Múltiplos serviços por agendamento
        if (backup.data.appointmentServices?.length > 0) {
            const servicesInDb = await prisma.service.findMany();
            const serviceMapById = new Map(servicesInDb.map(s => [s.id, s.id]));

            let restaurados = 0;
            for (const aptService of backup.data.appointmentServices) {
                const { service, ...aptServiceData } = aptService;
                if (!serviceMapById.get(aptServiceData.serviceId)) {
                    console.warn(`   ⚠️  Serviço ${aptServiceData.serviceId} não encontrado`);
                    continue;
                }
                await prisma.appointmentService.create({ data: aptServiceData });
                restaurados++;
            }
            console.log(`✅ ${restaurados} múltiplos serviços restaurados`);
        }

        // 8. Histórico de status
        if (backup.data.statusHistory?.length > 0) {
            for (const history of backup.data.statusHistory) {
                await prisma.appointmentStatusHistory.create({ data: history });
            }
            console.log(`✅ ${backup.data.statusHistory.length} históricos de status restaurados`);
        }

        // 9. Uso de cupons
        if (backup.data.couponUsages?.length > 0) {
            for (const usage of backup.data.couponUsages) {
                await prisma.couponUsage.create({ data: usage });
            }
            console.log(`✅ ${backup.data.couponUsages.length} usos de cupons restaurados`);
        }

        // 10. ✅ Avaliações
        if (backup.data.reviews?.length > 0) {
            for (const review of backup.data.reviews) {
                await prisma.review.create({ data: review });
            }
            console.log(`✅ ${backup.data.reviews.length} avaliações restauradas`);
        }

        // 11. ✅ Horários bloqueados
        if (backup.data.blockedTimes?.length > 0) {
            for (const blockedTime of backup.data.blockedTimes) {
                await prisma.blockedTime.create({ data: blockedTime });
            }
            console.log(`✅ ${backup.data.blockedTimes.length} horários bloqueados restaurados`);
        }

        // 12. ✅ Funcionários
        if (backup.data.staff?.length > 0) {
            for (const member of backup.data.staff) {
                await prisma.staff.create({ data: member });
            }
            console.log(`✅ ${backup.data.staff.length} funcionários restaurados`);
        }

        // 13. ✅ Comandas
        if (backup.data.staffServices?.length > 0) {
            let restaurados = 0;
            for (const staffService of backup.data.staffServices) {
                try {
                    await prisma.staffService.create({ data: staffService });
                    restaurados++;
                } catch (e) {
                    console.warn(`   ⚠️  Comanda ignorada: ${e.message}`);
                }
            }
            console.log(`✅ ${restaurados} comandas restauradas`);
        }

        // 14. ✅ Relatórios mensais
        if (backup.data.staffMonthlyReports?.length > 0) {
            for (const report of backup.data.staffMonthlyReports) {
                await prisma.staffMonthlyReport.create({ data: report });
            }
            console.log(`✅ ${backup.data.staffMonthlyReports.length} relatórios mensais restaurados`);
        }

        // 15. ✅ Metas financeiras
        if (backup.data.financialGoals?.length > 0) {
            for (const goal of backup.data.financialGoals) {
                await prisma.financialGoal.create({ data: goal });
            }
            console.log(`✅ ${backup.data.financialGoals.length} metas financeiras restauradas`);
        }

        console.log('\n✅ RESTAURAÇÃO COMPLETA!');
        console.log('\n📊 Resumo:');
        console.log(`   👥 Usuários:           ${backup.data.users?.length || 0}`);
        console.log(`   ✂️  Serviços:           ${backup.data.services?.length || 0}`);
        console.log(`   📅 Agendamentos:        ${backup.data.appointments?.length || 0}`);
        console.log(`   🔗 Múltiplos serviços:  ${backup.data.appointmentServices?.length || 0}`);
        console.log(`   🎫 Cupons:              ${backup.data.coupons?.length || 0}`);
        console.log(`   🎁 Combos:              ${backup.data.combos?.length || 0}`);
        console.log(`   ⏰ Horários:            ${backup.data.slots?.length || 0}`);
        console.log(`   ⭐ Avaliações:          ${backup.data.reviews?.length || 0}`);
        console.log(`   🚫 Horários bloqueados: ${backup.data.blockedTimes?.length || 0}`);
        console.log(`   👤 Funcionários:        ${backup.data.staff?.length || 0}`);
        console.log(`   📝 Comandas:            ${backup.data.staffServices?.length || 0}`);
        console.log(`   🎯 Metas financeiras:   ${backup.data.financialGoals?.length || 0}\n`);

        return true;
    } catch (error) {
        console.error('❌ Erro ao restaurar:', error.message);
        console.error('\n💡 Detalhes:');
        console.error(error);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

const backupFile = path.join(BACKUP_DIR, 'dados-completos-LATEST.json');
restaurarBackup(backupFile);