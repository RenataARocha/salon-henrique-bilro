// app/api/coupons/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ValidationRequest {
    codigo: string;
    valorServico: number;
    serviceIds?: string[];
    scheduledDate?: string;
    scheduledTime?: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { valido: false, erro: 'Não autenticado' },
                { status: 401 }
            );
        }

        const {
            codigo,
            valorServico,
            serviceIds = [],
            scheduledDate,
            scheduledTime
        }: ValidationRequest = await req.json();

        if (!codigo || !valorServico) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Código do cupom e valor do serviço são obrigatórios'
                },
                { status: 400 }
            );
        }

        // Buscar cupom no banco
        const cupom = await prisma.coupon.findUnique({
            where: { code: codigo.toUpperCase() }
        });

        if (!cupom) {
            return NextResponse.json({
                valido: false,
                erro: 'Cupom não encontrado'
            });
        }

        // Validação 1: Verificar se está ativo
        if (!cupom.active) {
            return NextResponse.json({
                valido: false,
                erro: 'Cupom desativado'
            });
        }

        // Validação 2: Verificar data de início
        const agora = new Date();
        if (cupom.validFrom && new Date(cupom.validFrom) > agora) {
            return NextResponse.json({
                valido: false,
                erro: `Cupom válido a partir de ${new Date(cupom.validFrom).toLocaleDateString('pt-BR')}`
            });
        }

        // Validação 3: Verificar data de fim
        if (cupom.validUntil && new Date(cupom.validUntil) < agora) {
            return NextResponse.json({
                valido: false,
                erro: 'Cupom expirado'
            });
        }

        // Validação 4: Verificar quantidade de usos
        if (cupom.maxUses && cupom.usedCount >= cupom.maxUses) {
            return NextResponse.json({
                valido: false,
                erro: 'Cupom esgotado'
            });
        }

        // Validação 5: Verificar se usuário já usou (se perUserLimit = true)
        if (cupom.perUserLimit) {
            const userUsage = await prisma.appointment.findFirst({
                where: {
                    userId: session.user.id,
                    couponId: cupom.id,
                    status: { not: 'CANCELLED' }
                }
            });

            if (userUsage) {
                return NextResponse.json({
                    valido: false,
                    erro: 'Você já utilizou este cupom'
                });
            }
        }

        // Validação 6: Verificar valor mínimo
        if (cupom.minValue && valorServico < cupom.minValue) {
            return NextResponse.json({
                valido: false,
                erro: `Valor mínimo de R$ ${cupom.minValue.toFixed(2)} não atingido`
            });
        }


        // Validação 7: Verificar serviços aplicáveis
        if (
            Array.isArray(cupom.applicableServices) &&
            cupom.applicableServices.length > 0
        ) {
            const hasApplicableService = serviceIds.some(id =>
                cupom.applicableServices.includes(id)
            );

            if (!hasApplicableService) {
                return NextResponse.json({
                    valido: false,
                    erro: 'Cupom não aplicável aos serviços selecionados'
                });
            }
        }


        // Validação 8: Verificar dia da semana (se aplicável)
        if (cupom.daysOfWeek && cupom.daysOfWeek.length > 0 && scheduledDate) {
            const dayOfWeek = new Date(scheduledDate).getDay();

            if (!cupom.daysOfWeek.includes(dayOfWeek)) {
                const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
                const validDays = cupom.daysOfWeek.map(d => days[d]).join(', ');

                return NextResponse.json({
                    valido: false,
                    erro: `Cupom válido apenas: ${validDays}`
                });
            }
        }

        // Validação 9: Verificar horário (se aplicável)
        if (cupom.timeStart && cupom.timeEnd && scheduledTime) {
            if (scheduledTime < cupom.timeStart || scheduledTime > cupom.timeEnd) {
                return NextResponse.json({
                    valido: false,
                    erro: `Cupom válido das ${cupom.timeStart} às ${cupom.timeEnd}`
                });
            }
        }

        // Calcular desconto
        let valorDesconto = 0;
        let valorFinal = valorServico;

        if (cupom.discountType === 'PERCENTAGE') {
            valorDesconto = (valorServico * cupom.discountValue) / 100;
            valorFinal = valorServico - valorDesconto;
        } else if (cupom.discountType === 'FIXED') {
            valorDesconto = Math.min(cupom.discountValue, valorServico);
            valorFinal = valorServico - valorDesconto;
        }

        // Garantir que o valor final não seja negativo
        valorFinal = Math.max(0, valorFinal);

        return NextResponse.json({
            valido: true,
            cupom: {
                id: cupom.id,
                codigo: cupom.code,
                descricao: cupom.description,
                tipoDesconto: cupom.discountType === 'PERCENTAGE' ? 'PERCENTUAL' : 'FIXO',
                valorDesconto: cupom.discountValue
            },
            desconto: {
                valorOriginal: valorServico,
                valorDesconto: valorDesconto,
                valorFinal: valorFinal,
                percentual: cupom.discountType === 'PERCENTAGE' ? cupom.discountValue : null
            }
        });

    } catch (error) {
        console.error('❌ Erro ao validar cupom:', error);
        return NextResponse.json({
            valido: false,
            erro: 'Erro ao validar cupom'
        }, { status: 500 });
    }
}