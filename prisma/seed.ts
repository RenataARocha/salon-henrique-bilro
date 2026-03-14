// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed...')

    // ✅ CRIAR APENAS ADMIN (SEM SERVIÇOS DE TESTE)
    const hashedPassword = await bcrypt.hash('MinhaSenh@123!', 12)

    const admin = await prisma.user.upsert({
        where: { email: 'renatabolos12@gmail.com' },
        update: {},
        create: {
            name: 'Rosie',
            email: 'renatabolos12@gmail.com',
            password: hashedPassword,
            phone: '(84) 98881-4965',
            secondaryPhone: '(84) 99965-1972',
            role: 'ADMIN',
            emailVerified: new Date()
        }
    })

    console.log('✅ Admin criado:', admin.email)
    console.log('📞 Telefone 1:', admin.phone)
    console.log('📞 Telefone 2:', admin.secondaryPhone)

    // ✅ HORÁRIOS DISPONÍVEIS (Terça a Sábado)
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    const availableSlots = []

    for (let day = 2; day <= 6; day++) {
        for (const time of timeSlots) {
            availableSlots.push({
                dayOfWeek: day,
                timeSlot: time,
                active: true
            })
        }
    }

    await prisma.availableSlot.deleteMany() // Limpar horários antigos
    await prisma.availableSlot.createMany({
        data: availableSlots
    })

    console.log('✅ Horários criados:', availableSlots.length)
    console.log('🎉 Seed concluído!')
    console.log('\n📧 Login: renatabolos12@gmail.com')
    console.log('🔑 Senha: MinhaSenh@123!')
    console.log('\n💡 Agora adicione os serviços reais pela interface admin!')
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })