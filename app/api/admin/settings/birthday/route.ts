// app/api/admin/settings/birthday/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Buscar configurações
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        let settings = await prisma.salonSettings.findUnique({
            where: { id: 'singleton' }
        })

        // Criar configurações padrão se não existir
        if (!settings) {
            settings = await prisma.salonSettings.create({
                data: { id: 'singleton' }
            })
        }

        return NextResponse.json({ success: true, data: settings })
    } catch (error) {
        console.error('Erro ao buscar configurações:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}

// Salvar configurações
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const body = await req.json()
        const {
            birthdayAutoEnabled,
            birthdayDiscountType,
            birthdayDiscountValue,
            birthdayValidDays,
            birthdayMessage,
            birthdayApplicableServices, // ✅ novo
        } = body

        const settings = await prisma.salonSettings.upsert({
            where: { id: 'singleton' },
            update: {
                birthdayAutoEnabled,
                birthdayDiscountType,
                birthdayDiscountValue,
                birthdayValidDays,
                birthdayMessage,
                birthdayApplicableServices: birthdayApplicableServices ?? [], // ✅ novo
            },
            create: {
                id: 'singleton',
                birthdayAutoEnabled,
                birthdayDiscountType,
                birthdayDiscountValue,
                birthdayValidDays,
                birthdayMessage,
                birthdayApplicableServices: birthdayApplicableServices ?? [], // ✅ novo
            }
        })

        return NextResponse.json({ success: true, data: settings })
    } catch (error) {
        console.error('Erro ao salvar configurações:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}