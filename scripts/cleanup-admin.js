// scripts/cleanup-admin.js
// Remove admin@henriquebilro.com e garante apenas renatabolos12@gmail.com

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function cleanup() {
    try {
        console.log('🧹 Iniciando limpeza de administradores...\n')

        // 1. Remover admin antigo
        const oldAdmin = await prisma.user.findUnique({
            where: { email: 'admin@henriquebilro.com' }
        })

        if (oldAdmin) {
            console.log('🗑️  Removendo admin@henriquebilro.com...')
            await prisma.user.delete({
                where: { email: 'admin@henriquebilro.com' }
            })
            console.log('✅ Email antigo removido!')
        } else {
            console.log('ℹ️  Email antigo não encontrado (já foi removido)')
        }

        // 2. Verificar/Criar admin correto
        const correctAdmin = await prisma.user.findUnique({
            where: { email: 'renatabolos12@gmail.com' }
        })

        if (correctAdmin) {
            console.log('\n✅ Admin correto já existe:')
            console.log(`   Email: ${correctAdmin.email}`)
            console.log(`   Nome: ${correctAdmin.name}`)
            console.log(`   Role: ${correctAdmin.role}`)

            // Garantir que é ADMIN
            if (correctAdmin.role !== 'ADMIN') {
                await prisma.user.update({
                    where: { email: 'renatabolos12@gmail.com' },
                    data: { role: 'ADMIN' }
                })
                console.log('   ⬆️  Role atualizado para ADMIN')
            }
        } else {
            console.log('\n🔨 Criando admin correto...')
            const hashedPassword = await bcrypt.hash('MinhaSenh@123!', 12)

            await prisma.user.create({
                data: {
                    email: 'renatabolos12@gmail.com',
                    name: 'Rosie',
                    password: hashedPassword,
                    role: 'ADMIN',
                    phone: '(84) 99999-9999',
                    emailVerified: new Date()
                }
            })
            console.log('✅ Admin criado com sucesso!')
        }

        // 3. Listar todos os admins
        console.log('\n📋 Administradores no sistema:')
        const allAdmins = await prisma.user.findMany({
            where: {
                role: 'ADMIN'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        allAdmins.forEach(admin => {
            console.log(`\n   👤 ${admin.name}`)
            console.log(`      Email: ${admin.email}`)
            console.log(`      Role: ${admin.role}`)
            console.log(`      Criado: ${admin.createdAt.toLocaleDateString('pt-BR')}`)
        })

        console.log('\n✅ Limpeza concluída com sucesso!')
        console.log('\n🔐 Use este email para login:')
        console.log('   📧 renatabolos12@gmail.com')
        console.log('   🔑 MinhaSenh@123!')

    } catch (error) {
        console.error('❌ Erro na limpeza:', error)
    } finally {
        await prisma.$disconnect()
    }
}

cleanup()