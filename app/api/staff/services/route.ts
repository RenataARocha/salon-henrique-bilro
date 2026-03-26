import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentMethod } from '@prisma/client'

// ✅ Mapeia qualquer formato de pagamento para o enum correto do Prisma
// Enum aceita: DINHEIRO | CARTAO_DEBITO | CARTAO_CREDITO | PIX | TRANSFERENCIA
function normalizarPaymentMethod(raw: string | null | undefined): string {
    if (!raw) return 'DINHEIRO'

    const val = raw.toUpperCase().trim()

    const mapa: Record<string, string> = {
        // Variações de cartão de crédito
        'CARTAO_DE_CREDITO': 'CARTAO_CREDITO',
        'CARTÃO_DE_CRÉDITO': 'CARTAO_CREDITO',
        'CARTAO_CREDITO': 'CARTAO_CREDITO',
        'CARTÃO_CRÉDITO': 'CARTAO_CREDITO',
        'CREDITO': 'CARTAO_CREDITO',
        'CRÉDITO': 'CARTAO_CREDITO',
        'CREDIT_CARD': 'CARTAO_CREDITO',

        // Variações de cartão de débito
        'CARTAO_DE_DEBITO': 'CARTAO_DEBITO',
        'CARTÃO_DE_DÉBITO': 'CARTAO_DEBITO',
        'CARTAO_DEBITO': 'CARTAO_DEBITO',
        'CARTÃO_DÉBITO': 'CARTAO_DEBITO',
        'DEBITO': 'CARTAO_DEBITO',
        'DÉBITO': 'CARTAO_DEBITO',
        'DEBIT_CARD': 'CARTAO_DEBITO',

        // Dinheiro
        'DINHEIRO': 'DINHEIRO',
        'CASH': 'DINHEIRO',
        'ESPECIE': 'DINHEIRO',
        'ESPÉCIE': 'DINHEIRO',

        // PIX
        'PIX': 'PIX',

        // Transferência
        'TRANSFERENCIA': 'TRANSFERENCIA',
        'TRANSFERÊNCIA': 'TRANSFERENCIA',
        'TRANSFER': 'TRANSFERENCIA',
        'TED': 'TRANSFERENCIA',
        'DOC': 'TRANSFERENCIA',
    }

    // Tenta encontrar mapeamento exato
    if (mapa[val]) return mapa[val]

    // Tenta parcial: se contiver "CREDITO" → CARTAO_CREDITO
    if (val.includes('CREDITO') || val.includes('CRÉDITO')) return 'CARTAO_CREDITO'
    if (val.includes('DEBITO') || val.includes('DÉBITO')) return 'CARTAO_DEBITO'
    if (val.includes('PIX')) return 'PIX'
    if (val.includes('TRANSFER')) return 'TRANSFERENCIA'
    if (val.includes('DINHEIRO') || val.includes('CASH')) return 'DINHEIRO'

    // Fallback seguro
    console.warn(`[paymentMethod] Valor desconhecido "${raw}" → usando DINHEIRO`)
    return 'DINHEIRO'
}

// GET - Listar serviços executados
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const staffId = searchParams.get('staffId')
        const date = searchParams.get('date')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const unpaidOnly = searchParams.get('unpaid') === 'true'

        type StaffServiceWhere = {
            staffId?: string
            executedAt?: {
                gte?: Date
                lte?: Date
                lt?: Date
            }
            commissionPaid?: boolean
        }

        const where: StaffServiceWhere = {}

        if (staffId) where.staffId = staffId

        if (date) {
            const dateObj = new Date(date)
            const nextDay = new Date(dateObj)
            nextDay.setDate(nextDay.getDate() + 1)
            where.executedAt = { gte: dateObj, lt: nextDay }
        } else if (startDate && endDate) {
            where.executedAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        if (unpaidOnly) where.commissionPaid = false

        const services = await prisma.staffService.findMany({
            where,
            include: {
                staff: {
                    select: { id: true, name: true, photo: true, commissionPercent: true }
                },
                service: {
                    select: { id: true, name: true, price: true, duration: true }
                },
                combo: {
                    select: { id: true, name: true, discountPercent: true }
                }
            },
            orderBy: { executedAt: 'desc' }
        })

        type Totals = {
            totalRevenue: number
            totalCommission: number
            count: number
        }

        const totals = services.reduce((acc: Totals, s) => {
            acc.totalRevenue += s.serviceValue
            acc.totalCommission += s.commissionValue
            acc.count += 1
            return acc
        }, { totalRevenue: 0, totalCommission: 0, count: 0 })

        return NextResponse.json({ success: true, data: services, totals })

    } catch (error: unknown) {
        console.error('Erro ao listar serviços:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao listar serviços' },
            { status: 500 }
        )
    }
}


// POST - Registrar novo serviço executado
export async function POST(request: Request) {

    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        type CreateStaffServiceBody = {
            staffId: string
            serviceId?: string | null
            comboId?: string | null
            appointmentId?: string | null
            clientName: string
            clientPhone?: string | null
            serviceValue: number
            paymentMethod?: string | null
            executedAt?: string | Date
            notes?: string | null
        }

        const body: CreateStaffServiceBody = await request.json()
        const {
            staffId,
            serviceId: serviceIdRaw,
            comboId: comboIdRaw,
            appointmentId,
            clientName,
            clientPhone,
            serviceValue,
            paymentMethod,
            executedAt,
            notes
        } = body

        // ✅ Sanitiza serviceId e comboId:
        // Se o valor for "multiple", vazio, ou não parecer um ID real (cuid),
        // descarta e usa null — evita Foreign Key violation no banco.
        const INVALID_IDS = ['multiple', 'none', 'null', 'undefined', '']
        const serviceId = (!serviceIdRaw || INVALID_IDS.includes(String(serviceIdRaw).toLowerCase()))
            ? null
            : serviceIdRaw
        const comboId = (!comboIdRaw || INVALID_IDS.includes(String(comboIdRaw).toLowerCase()))
            ? null
            : comboIdRaw

        // — Validações obrigatórias —
        if (!staffId) {
            return NextResponse.json(
                { success: false, error: 'Selecione um funcionário' },
                { status: 400 }
            )
        }

        // ✅ serviceId e comboId são OPCIONAIS
        // Agendamentos com múltiplos serviços livres não têm vínculo
        // com um registro único de Service ou Combo.

        if (!clientName) {
            return NextResponse.json(
                { success: false, error: 'Nome do cliente é obrigatório' },
                { status: 400 }
            )
        }

        if (!serviceValue || serviceValue <= 0) {
            return NextResponse.json(
                { success: false, error: 'Valor do serviço inválido' },
                { status: 400 }
            )
        }

        // Evitar duplicação por appointmentId
        if (appointmentId) {
            const existingRecord = await prisma.staffService.findFirst({
                where: { staffId, appointmentId }
            })
            if (existingRecord) {
                return NextResponse.json(
                    { success: false, error: 'Este agendamento já foi registrado para este funcionário' },
                    { status: 400 }
                )
            }
        }

        // Verificar status do agendamento
        if (appointmentId) {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                select: { id: true, status: true }
            })

            if (!appointment) {
                return NextResponse.json(
                    { success: false, error: 'Agendamento não encontrado' },
                    { status: 400 }
                )
            }

            if (appointment.status !== 'COMPLETED') {
                return NextResponse.json(
                    { success: false, error: 'Só é possível registrar serviços de agendamentos concluídos' },
                    { status: 400 }
                )
            }
        }

        // Buscar funcionário para calcular comissão
        const staff = await prisma.staff.findUnique({ where: { id: staffId } })
        if (!staff) {
            return NextResponse.json(
                { success: false, error: 'Funcionário não encontrado' },
                { status: 404 }
            )
        }

        const commissionValue = (serviceValue * staff.commissionPercent) / 100

        // ✅ Normaliza o método de pagamento para o enum do Prisma
        const paymentMethodNormalizado = normalizarPaymentMethod(paymentMethod)

        const staffService = await prisma.staffService.create({
            data: {
                staffId,
                appointmentId: appointmentId || null,
                serviceId: serviceId || null,
                comboId: comboId || null,
                clientName,
                clientPhone: clientPhone || null,
                serviceValue,
                commissionValue,

                // 👇 AQUI
                paymentMethod: paymentMethodNormalizado as PaymentMethod,

                executedAt: executedAt ? new Date(executedAt) : new Date(),
                notes: notes || null
            },
            include: {
                staff: true,
                service: true,
                combo: true
            }
        })

        // Atualizar relatório mensal
        const date = new Date(executedAt || new Date())
        await updateMonthlyReport(staffId, date.getFullYear(), date.getMonth() + 1)

        return NextResponse.json({
            success: true,
            data: staffService,
            message: 'Serviço registrado com sucesso!'
        })

    } catch (error: unknown) {
        console.error('Erro ao registrar serviço:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao registrar serviço' },
            { status: 500 }
        )
    }
}

// PATCH - Marcar comissão como paga
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        type PatchBody = {
            ids: string[]
        }

        const body: PatchBody = await request.json()
        const { ids } = body

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'IDs inválidos' },
                { status: 400 }
            )
        }

        const services = await prisma.staffService.findMany({
            where: { id: { in: ids } }
        })

        await prisma.staffService.updateMany({
            where: { id: { in: ids } },
            data: { commissionPaid: true, paidAt: new Date() }
        })

        // Atualiza apenas os períodos afetados, sem repetição
        const periodos = new Set<string>()
        for (const s of services) {
            const d = new Date(s.executedAt)
            periodos.add(`${s.staffId}|${d.getFullYear()}|${d.getMonth() + 1}`)
        }
        for (const key of periodos) {
            const [staffId, year, month] = key.split('|')
            await updateMonthlyReport(staffId, Number(year), Number(month))
        }

        return NextResponse.json({
            success: true,
            message: 'Comissões marcadas como pagas'
        })

    } catch (error: unknown) {
        console.error('Erro ao marcar como pago:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao marcar como pago' },
            { status: 500 }
        )
    }
}

// DELETE - Remover serviço registrado
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
                { success: false, error: 'ID não fornecido' },
                { status: 400 }
            )
        }

        const service = await prisma.staffService.findUnique({ where: { id } })
        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Serviço não encontrado' },
                { status: 404 }
            )
        }

        await prisma.staffService.delete({ where: { id } })

        const date = new Date(service.executedAt)
        await updateMonthlyReport(service.staffId, date.getFullYear(), date.getMonth() + 1)

        return NextResponse.json({
            success: true,
            message: 'Serviço removido com sucesso'
        })

    } catch (error: unknown) {
        console.error('Erro ao remover serviço:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao remover serviço' },
            { status: 500 }
        )
    }
}

// Atualizar relatório mensal
async function updateMonthlyReport(staffId: string, year: number, month: number) {
    try {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        const services = await prisma.staffService.findMany({
            where: {
                staffId,
                executedAt: { gte: startDate, lte: endDate }
            }
        })

        const totalServices = services.length
        const totalRevenue = services.reduce((sum, s) => sum + s.serviceValue, 0)
        const totalCommission = services.reduce((sum, s) => sum + s.commissionValue, 0)

        const paidCount = services.filter(s => s.commissionPaid).length
        const allPaid = totalServices > 0 && paidCount === totalServices

        await prisma.staffMonthlyReport.upsert({
            where: { staffId_year_month: { staffId, year, month } },
            create: {
                staffId, year, month,
                totalServices, totalRevenue, totalCommission,
                paid: allPaid,
                paidAt: allPaid ? new Date() : null
            },
            update: {
                totalServices, totalRevenue, totalCommission,
                paid: allPaid,
                paidAt: allPaid ? new Date() : null,
                updatedAt: new Date()
            }
        })

        console.log(`✅ Relatório: ${staffId} ${month}/${year} | ${paidCount}/${totalServices} pagos`)
    } catch (error: unknown) {
        console.error('Erro ao atualizar relatório mensal:', error)
    }
}