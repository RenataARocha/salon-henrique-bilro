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
        const interval = setInterval(buscarMetricas, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    async function buscarMetricas() {
        try {
            const response = await fetch('/api/metrics')
            const data = await response.json()
            if (data.success) setMetricas(data.metricas)
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
            textColor: 'text-green-600'
        },
        {
            titulo: 'Emails Enviados',
            valor: metricas.emailsEnviados,
            icone: Mail,
            cor: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            titulo: 'Confirmados',
            valor: metricas.agendamentosConfirmados,
            icone: CheckCircle,
            cor: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600'
        },
        {
            titulo: 'Pendentes',
            valor: metricas.agendamentosPendentes,
            icone: Clock,
            cor: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600'
        },
        {
            titulo: 'Taxa de Confirmação',
            valor: `${metricas.taxaConfirmacao}%`,
            icone: TrendingUp,
            cor: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        },
        {
            titulo: 'Cupons Ativos',
            valor: metricas.cuponsAtivos,
            icone: Gift,
            cor: 'from-pink-500 to-pink-600',
            bgColor: 'bg-pink-50',
            textColor: 'text-pink-600'
        },
        {
            titulo: 'Clientes Ativos',
            valor: metricas.clientesAtivos,
            icone: Users,
            cor: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600'
        },
        {
            titulo: 'Próximos 7 Dias',
            valor: metricas.proximosAgendamentos,
            icone: Calendar,
            cor: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600'
        }
    ]

    if (carregando) {
        return (
            <div className="flex items-center justify-center p-10">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-gold/20 border-t-gold mx-auto mb-4 shadow-md"></div>
                    <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">Carregando métricas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6">

            {/* Header */}
            <div className="bg-gradient-gold rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-6 text-white">
                    <div className="flex flex-col gap-3">
                        <div>
                            <h2 className="text-lg sm:text-2xl font-bold">📊 Dashboard de Métricas</h2>
                            <p className="text-xs sm:text-sm text-white/80 mt-1">
                                Acompanhe o desempenho do sistema de notificações em tempo real
                            </p>
                        </div>

                        {/* Mini resumo inline no header */}
                        <div className="flex flex-wrap gap-3 text-xs">
                            <span className="bg-white/20 px-3 py-1.5 rounded-full font-medium">
                                💬 {metricas.whatsappEnviados + metricas.emailsEnviados} mensagens
                            </span>
                            <span className="bg-white/20 px-3 py-1.5 rounded-full font-medium">
                                ✅ {metricas.taxaConfirmacao}% confirmação
                            </span>
                            <span className="bg-white/20 px-3 py-1.5 rounded-full font-medium">
                                📅 {metricas.proximosAgendamentos} próx. semana
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {cards.map((card, index) => {
                    const Icon = card.icone
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
                        >
                            {/* Barra colorida no topo */}
                            <div className={`h-1.5 bg-gradient-to-r ${card.cor}`} />

                            <div className="p-3 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 sm:p-2.5 rounded-xl ${card.bgColor}`}>
                                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.textColor}`} />
                                    </div>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none mb-1.5">
                                    {card.valor}
                                </p>
                                <p className="text-xs text-gray-500 font-medium leading-tight">
                                    {card.titulo}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Card de Resumo Geral */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-gold text-white p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp size={18} />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold">Resumo Geral</h3>
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1.5 font-medium">Total de Mensagens</p>
                            <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                                {metricas.whatsappEnviados + metricas.emailsEnviados}
                            </p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1.5 font-medium">Taxa de Confirmação</p>
                            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                                {metricas.taxaConfirmacao}%
                            </p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1.5 font-medium">Próxima Semana</p>
                            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                                {metricas.proximosAgendamentos}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Última Atualização */}
            <div className="text-center text-xs text-gray-400">
                Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
        </div>
    )
}