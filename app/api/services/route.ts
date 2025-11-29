// src/app/api/services/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const services = await prisma.service.findMany({
            where: {
                active: true
            },
            orderBy: {
                price: 'asc'
            }
        })

        return NextResponse.json({ success: true, data: services })
    } catch (error) {
        console.error('Erro ao buscar serviços:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar serviços' },
            { status: 500 }
        )
    }
}