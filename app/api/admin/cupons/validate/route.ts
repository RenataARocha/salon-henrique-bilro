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
        const cupom = await prisma.cupom.findUnique({
            where: { codigo: codigo.toUpperCase() }
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
        if (!cupom.ativo) {
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
        if (cupom.dataInicio && new Date(cupom.dataInicio) > agora) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Cupom ainda não está disponível'
                },
                { status: 200 }
            );
        }

        // Verificar data de fim
        if (cupom.dataFim && new Date(cupom.dataFim) < agora) {
            return NextResponse.json(
                {
                    valido: false,
                    erro: 'Cupom expirado'
                },
                { status: 200 }
            );
        }

        // Verificar quantidade de usos
        if (cupom.quantidadeMaxima && cupom.quantidadeUsada >= cupom.quantidadeMaxima) {
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

        if (cupom.tipoDesconto === 'PERCENTUAL') {
            valorDesconto = (valorServico * cupom.valorDesconto) / 100;
            valorFinal = valorServico - valorDesconto;
        } else if (cupom.tipoDesconto === 'FIXO') {
            valorDesconto = Math.min(cupom.valorDesconto, valorServico);
            valorFinal = valorServico - valorDesconto;
        }

        // Garantir que o valor final não seja negativo
        valorFinal = Math.max(0, valorFinal);

        return NextResponse.json({
            valido: true,
            cupom: {
                id: cupom.id,
                codigo: cupom.codigo,
                descricao: cupom.descricao,
                tipoDesconto: cupom.tipoDesconto,
                valorDesconto: cupom.valorDesconto
            },
            desconto: {
                valorOriginal: valorServico,
                valorDesconto: valorDesconto,
                valorFinal: valorFinal,
                percentual: cupom.tipoDesconto === 'PERCENTUAL' ? cupom.valorDesconto : null
            }
        });

    } catch (error) {
        console.error('Erro ao validar cupom:', error);
        return NextResponse.json(
            { error: 'Erro ao validar cupom' },
            { status: 500 }
        );
    }
}

// Rota GET para informações do cupom (sem aplicar desconto)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const codigo = searchParams.get('codigo');

        if (!codigo) {
            return NextResponse.json(
                { error: 'Código do cupom é obrigatório' },
                { status: 400 }
            );
        }

        const cupom = await prisma.cupom.findUnique({
            where: { codigo: codigo.toUpperCase() }
        });

        if (!cupom) {
            return NextResponse.json(
                { encontrado: false },
                { status: 200 }
            );
        }

        const usosRestantes = cupom.quantidadeMaxima
            ? cupom.quantidadeMaxima - cupom.quantidadeUsada
            : null;

        return NextResponse.json({
            encontrado: true,
            cupom: {
                codigo: cupom.codigo,
                descricao: cupom.descricao,
                tipoDesconto: cupom.tipoDesconto,
                valorDesconto: cupom.valorDesconto,
                ativo: cupom.ativo,
                dataInicio: cupom.dataInicio,
                dataFim: cupom.dataFim,
                usosRestantes: usosRestantes
            }
        });

    } catch (error) {
        console.error('Erro ao buscar cupom:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar cupom' },
            { status: 500 }
        );
    }
}