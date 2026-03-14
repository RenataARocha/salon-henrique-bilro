// src/components/DashboardMetricas.tsx
'use client'

import { useState, useEffect } from 'react'
import {
    MessageCircle,
    Mail,
    CheckCircle,
    Clock,
    TrendingUp,
    Users,
    Gift,
    Calendar
} from 'lucide-react'

interface Metricas {
    whatsappEnviados: number
    emailsEnviados: number
    agendamentosConfirmados: number
    agendamentosPendentes: number
    taxaConfirmacao: number
    cuponsAtivos: number
    clientesAtivos: number
    proximosAgendamentos: number
}

export default function DashboardMetricas() {
    const [metricas, setMetricas] = useState<Metricas>({
        whatsappEnviados: 0,
        emailsEnviados: 0,
        agendamentosConfirmados: 0,
        agendamentosPendentes: 0,
        taxaConfirmacao: 0,
        cuponsAtivos: 0,
        clientesAtivos: 0,
        proximosAgendamentos: 0
    })
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        buscarMetricas()

        // Atualizar a cada 5 minutos
        const interval = setInterval(buscarMetricas, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    async function buscarMetricas() {
        try {
            const response = await fetch('/api/metrics')
            const data = await response.json()

            if (data.success) {
                setMetricas(data.metricas)
            }
        } catch (error) {
            console.error('Erro ao buscar métricas:', error)
        } finally {
            setCarregando(false)
        }
    }

    const cards = [
        {
            titulo: 'WhatsApp Enviados',
            valor: metricas.whatsappEnviados,
            icone: MessageCircle,
            cor: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700'
        },
        {
            titulo: 'Emails Enviados',
            valor: metricas.emailsEnviados,
            icone: Mail,
            cor: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700'
        },
        {
            titulo: 'Agendamentos Confirmados',
            valor: metricas.agendamentosConfirmados,
            icone: CheckCircle,
            cor: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-700'
        },
        {
            titulo: 'Agendamentos Pendentes',
            valor: metricas.agendamentosPendentes,
            icone: Clock,
            cor: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-700'
        },
        {
            titulo: 'Taxa de Confirmação',
            valor: `${metricas.taxaConfirmacao}%`,
            icone: TrendingUp,
            cor: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700'
        },
        {
            titulo: 'Cupons Ativos',
            valor: metricas.cuponsAtivos,
            icone: Gift,
            cor: 'from-pink-500 to-pink-600',
            bgColor: 'bg-pink-50',
            textColor: 'text-pink-700'
        },
        {
            titulo: 'Clientes Ativos',
            valor: metricas.clientesAtivos,
            icone: Users,
            cor: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-700'
        },
        {
            titulo: 'Próximos 7 Dias',
            valor: metricas.proximosAgendamentos,
            icone: Calendar,
            cor: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700'
        }
    ]

    if (carregando) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-gold rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">📊 Dashboard de Métricas</h2>
                <p className="text-white/90">
                    Acompanhe o desempenho do sistema de notificações em tempo real
                </p>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icone

                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                        >
                            {/* Barra colorida no topo */}
                            <div className={`h-2 bg-gradient-to-r ${card.cor}`} />

                            <div className="p-6">
                                {/* Ícone e Título */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                        <Icon className={`w-6 h-6 ${card.textColor}`} />
                                    </div>
                                </div>

                                {/* Valor */}
                                <div className="mb-2">
                                    <p className="text-3xl font-bold text-gray-900">
                                        {card.valor}
                                    </p>
                                </div>

                                {/* Título */}
                                <p className="text-sm text-gray-600 font-medium">
                                    {card.titulo}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Card de Resumo */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    📈 Resumo Geral
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Total de Mensagens */}
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Total de Mensagens</p>
                        <p className="text-3xl font-bold text-purple-600">
                            {metricas.whatsappEnviados + metricas.emailsEnviados}
                        </p>
                    </div>

                    {/* Taxa de Sucesso */}
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Taxa de Confirmação</p>
                        <p className="text-3xl font-bold text-emerald-600">
                            {metricas.taxaConfirmacao}%
                        </p>
                    </div>

                    {/* Próximos Agendamentos */}
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Próxima Semana</p>
                        <p className="text-3xl font-bold text-orange-600">
                            {metricas.proximosAgendamentos}
                        </p>
                    </div>
                </div>
            </div>

            {/* Última Atualização */}
            <div className="text-center text-sm text-gray-500">
                Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
        </div>
    )
}