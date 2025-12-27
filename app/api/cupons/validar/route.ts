// app/api/cupons/validar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { codigo, valorServico } = await req.json();

        if (!codigo || !valorServico) {
            return NextResponse.json(
                { error: 'Código do cupom e valor do serviço são obrigatórios' },
                { status: 400 }
            );
        }

        // Buscar cupom no banco
        const cupom = await prisma.coupon.findUnique({
            where: { code: codigo.toUpperCase() }
        });

        if (!cupom) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Cupom não encontrado'
                },
                { status: 200 }
            );
        }

        // Verificar se está ativo
        if (!cupom.active) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Cupom desativado'
                },
                { status: 200 }
            );
        }

        // Verificar data de início
        const agora = new Date();
        if (cupom.validFrom && new Date(cupom.validFrom) > agora) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Cupom ainda não está disponível'
                },
                { status: 200 }
            );
        }

        // Verificar data de fim
        if (cupom.validUntil && new Date(cupom.validUntil) < agora) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Cupom expirado'
                },
                { status: 200 }
            );
        }

        // Verificar quantidade de usos
        if (cupom.maxUses && cupom.usedCount >= cupom.maxUses) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Cupom esgotado'
                },
                { status: 200 }
            );
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
        console.error('Erro ao validar cupom:', error);
        return NextResponse.json(
            {
                valido: false,
                erro: 'Erro ao validar cupom'
            },
            { status: 500 }
        );
    }
}