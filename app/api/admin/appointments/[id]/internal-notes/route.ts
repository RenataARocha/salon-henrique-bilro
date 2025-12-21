import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const params = await context.params
        const id = params.id

        const body = await request.json()
        const { internalNotes } = body

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { internalNotes }
        })

        return NextResponse.json({
            success: true,
            message: 'Nota interna salva com sucesso!',
            data: appointment
        })

    } catch (error) {
        console.error('❌ Erro ao salvar nota:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao salvar nota',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}
