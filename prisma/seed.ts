import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed...')

    await prisma.appointment.deleteMany()
    await prisma.service.deleteMany()
    await prisma.user.deleteMany()
    await prisma.availableSlot.deleteMany()

    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.create({
        data: {
            name: 'Henrique Bilro Admin',
            email: 'admin@henriquebilro.com',
            password: hashedPassword,
            phone: '(84) 99999-9999',
            role: 'ADMIN'
        }
    })

    console.log('✅ Admin criado:', admin.email)

    const clientPassword = await bcrypt.hash('cliente123', 10)

    const client = await prisma.user.create({
        data: {
            name: 'Maria Silva',
            email: 'maria@example.com',
            password: clientPassword,
            phone: '(84) 98888-8888',
            role: 'CLIENT'
        }
    })

    console.log('✅ Cliente criado:', client.email)

    await prisma.service.createMany({
        data: [
            {
                name: 'Loiro Milhões',
                description: 'Loiro radiante e luminoso com técnicas avançadas',
                price: 580.00,
                duration: 180
            },
            {
                name: 'Iluminados',
                description: 'Loiros ou morenas iluminadas com mechas naturais',
                price: 480.00,
                duration: 150
            },
            {
                name: 'Corte Feminino',
                description: 'Corte completo com finalização profissional',
                price: 120.00,
                duration: 60
            },
            {
                name: 'Hidratação Profunda',
                description: 'Tratamento capilar intensivo com produtos premium',
                price: 150.00,
                duration: 90
            },
            {
                name: 'Escova Progressiva',
                description: 'Alisamento e tratamento prolongado',
                price: 350.00,
                duration: 240
            },
            {
                name: 'Coloração Completa',
                description: 'Coloração total dos fios com produtos de alta qualidade',
                price: 280.00,
                duration: 150
            }
        ]
    })

    console.log('✅ Serviços criados')

    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    const availableSlots = []

    // Atualizar esta parte do seed:
    for (let day = 2; day <= 6; day++) {
        for (const time of timeSlots) {
            availableSlots.push({
                dayOfWeek: day,
                timeSlot: time,
                active: true
            })
        }
    }

    await prisma.availableSlot.createMany({
        data: availableSlots
    })

    console.log('✅ Horários criados:', availableSlots.length)

    const servicesCreated = await prisma.service.findMany()

    if (servicesCreated.length > 0) {
        await prisma.appointment.create({
            data: {
                userId: client.id,
                serviceId: servicesCreated[0].id,
                date: new Date('2024-12-15'),
                time: '14:00',
                status: 'CONFIRMED',
                notes: 'Primeiro agendamento de teste'
            }
        })

        console.log('✅ Agendamento criado')
    }

    console.log('🎉 Seed concluído!')
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })