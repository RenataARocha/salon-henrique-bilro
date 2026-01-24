// app/api/admin/combos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Atualizar combo
export async function PATCH(
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
        const id = params.id  // ✅ Pega o ID do combo
        const body = await request.json()

        // ✅ Separar dados que vão direto pro combo vs services
        const { serviceIds, ...comboData } = body

        // ✅ Se tem serviceIds, atualizar relações
        if (serviceIds && Array.isArray(serviceIds)) {
            // Deletar relações antigas
            await prisma.comboService.deleteMany({
                where: { comboId: id }
            })

            // Criar novas relações
            if (serviceIds.length > 0) {
                await prisma.comboService.createMany({
                    data: serviceIds.map((serviceId: string) => ({
                        comboId: id,  // ✅ USAR O ID QUE PEGAMOS ACIMA
                        serviceId
                    }))
                })
            }
        }

        // ✅ Atualizar o combo (sem serviceIds no data)
        const combo = await prisma.serviceCombo.update({
            where: { id },
            data: comboData,  // Só dados do combo (name, description, etc)
            include: {
                services: {
                    include: {
                        service: true
                    }
                }
            }
        })

        // ✅ Calcular preços
        const services = combo.services.map(cs => cs.service)
        const originalPrice = services.reduce((sum, s) => sum + s.price, 0)
        const comboPrice = originalPrice * (1 - combo.discountPercent / 100)

        return NextResponse.json({
            success: true,
            message: 'Combo atualizado com sucesso!',
            data: {
                ...combo,
                originalPrice,
                comboPrice,
                services
            }
        })

    } catch (error) {
        console.error('❌ Erro ao atualizar combo:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao atualizar combo',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// DELETE - Excluir combo
export async function DELETE(
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

        // ✅ Deletar relações primeiro
        await prisma.comboService.deleteMany({
            where: { comboId: id }
        })

        // ✅ Depois deletar o combo
        await prisma.serviceCombo.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Combo excluído com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao excluir combo:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao excluir combo',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}