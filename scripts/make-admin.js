// scripts/make-admin.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function makeAdmin() {
    const email = process.argv[2]

    if (!email) {
        console.log('❌ Uso: node scripts/make-admin.js seu-email@exemplo.com')
        process.exit(1)
    }

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        })

        console.log('✅ Usuário atualizado para ADMIN:')
        console.log('   Email:', user.email)
        console.log('   Role:', user.role)
    } catch (error) {
        console.error('❌ Erro:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

makeAdmin()