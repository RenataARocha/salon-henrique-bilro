import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID do funcionário não informado' },
                { status: 400 }
            )
        }

        // Verifica se o funcionário existe antes de tentar excluir
        const funcionario = await prisma.staff.findUnique({
            where: { id },
            select: { id: true, name: true }
        })

        if (!funcionario) {
            return NextResponse.json(
                { success: false, error: 'Funcionário não encontrado' },
                { status: 404 }
            )
        }

        // -------------------------------------------------------
        // Deleção manual em cascata (segura mesmo sem Cascade no schema)
        // Remove primeiro os registros filhos, depois o funcionário.
        // Se o seu schema já tiver onDelete: Cascade, estas linhas
        // não causam problema — só fazem o trabalho duas vezes.
        // -------------------------------------------------------

        // 1. Remove relatórios mensais do funcionário
        await prisma.staffMonthlyReport.deleteMany({
            where: { staffId: id }
        })

        // 2. Remove todos os serviços executados pelo funcionário
        await prisma.staffService.deleteMany({
            where: { staffId: id }
        })

        // 3. Remove o funcionário em si
        await prisma.staff.delete({
            where: { id }
        })

        console.log(`🗑️ Funcionário excluído permanentemente: ${funcionario.name} (${id})`)

        return NextResponse.json({
            success: true,
            message: `Funcionário "${funcionario.name}" excluído com sucesso`
        })

    } catch (error) {
        console.error('Erro ao excluir funcionário:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao excluir funcionário' },
            { status: 500 }
        )
    }
}