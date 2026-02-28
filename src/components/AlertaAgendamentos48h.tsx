// src/components/AlertaAgendamentos48h.tsx
'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Clock, User, Calendar, Phone } from 'lucide-react'
import { parseISO, differenceInHours, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ✅ TIPO COMPLETO COM STATUS
interface Appointment {
    id: string
    userId: string
    serviceId: string | null
    date: string
    time: string
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    user: {
        id: string
        name: string
        phone: string | null
    }
    service: {
        id: string
        name: string
    } | null
}

export default function AlertaAgendamentos48h() {
    const [agendamentosProximos, setAgendamentosProximos] = useState<Appointment[]>([])
    const [mostrarAlerta, setMostrarAlerta] = useState(false)
    const [carregando, setCarregando] = useState(true)

    // Injetar CSS de animação
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const styleId = 'alerta-agendamentos-style'

            // Verificar se já existe
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style')
                style.id = styleId
                style.textContent = `
                    @keyframes bounce-subtle {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                    }
                    .animate-bounce-subtle {
                        animation: bounce-subtle 3s ease-in-out infinite;
                    }
                `
                document.head.appendChild(style)
            }
        }
    }, [])

    useEffect(() => {
        buscarAgendamentosProximos()
        const intervalo = setInterval(buscarAgendamentosProximos, 5 * 60 * 1000) // A cada 5 minutos
        return () => clearInterval(intervalo)
    }, [])

    async function buscarAgendamentosProximos() {
        try {
            const response = await fetch('/api/appointments')
            const data = await response.json()

            if (data.success && Array.isArray(data.data)) {
                const agora = new Date()

                // ✅ FILTRAR AGENDAMENTOS DAS PRÓXIMAS 48H
                const proximos = data.data.filter((apt: Appointment) => {
                    // Verificar status válido
                    if (apt.status !== 'PENDING' && apt.status !== 'CONFIRMED') return false

                    // Verificar se tem serviço
                    if (!apt.service) return false

                    try {
                        const dateTime = parseISO(`${apt.date.split('T')[0]}T${apt.time}`)
                        const horasAte = differenceInHours(dateTime, agora)

                        // Entre 24h e 72h de antecedência
                        return horasAte >= 24 && horasAte <= 72
                    } catch {
                        return false
                    }
                })

                setAgendamentosProximos(proximos)
                setMostrarAlerta(proximos.length > 0)
            }
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function enviarLembrete(agendamento: Appointment) {
        try {
            const response = await fetch('/api/whatsapp/send-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId: agendamento.id })
            })

            if (response.ok) {
                alert('✅ Lembrete enviado com sucesso!')
                buscarAgendamentosProximos() // Atualizar lista
            } else {
                alert('❌ Erro ao enviar lembrete')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('❌ Erro ao enviar lembrete')
        }
    }

    if (carregando) return null
    if (!mostrarAlerta || agendamentosProximos.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-2xl border-2 border-pink-300 overflow-hidden animate-bounce-subtle">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full animate-pulse">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">
                                ⏰ Agendamentos das Próximas 48h
                            </h3>
                            <p className="text-white/90 text-sm">
                                {agendamentosProximos.length} cliente(s) precisam de confirmação
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMostrarAlerta(false)}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Lista de Agendamentos */}
                <div className="max-h-96 overflow-y-auto">
                    {agendamentosProximos.map((agendamento) => {
                        const dataHora = parseISO(`${agendamento.date.split('T')[0]}T${agendamento.time}`)
                        const horasRestantes = differenceInHours(dataHora, new Date())

                        return (
                            <div
                                key={agendamento.id}
                                className="p-4 border-b border-pink-100 hover:bg-pink-50/50 transition"
                            >
                                {/* Cliente */}
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-pink-600" />
                                    <span className="font-semibold text-gray-800">
                                        {agendamento.user.name}
                                    </span>
                                </div>

                                {/* Serviço */}
                                {agendamento.service && (
                                    <div className="text-sm text-gray-600 mb-2">
                                        📌 {agendamento.service.name}
                                    </div>
                                )}

                                {/* Data e Hora */}
                                <div className="flex items-center gap-4 text-sm text-gray-700 mb-2">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-purple-600" />
                                        {format(dataHora, "dd/MM/yyyy", { locale: ptBR })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                        {agendamento.time}
                                    </div>
                                </div>

                                {/* Tempo Restante */}
                                <div className={`text-xs font-medium mb-3 ${horasRestantes <= 24 ? 'text-red-600' : 'text-orange-600'
                                    }`}>
                                    ⏰ Faltam {horasRestantes}h
                                </div>

                                {/* Botão de Enviar Lembrete */}
                                <button
                                    onClick={() => enviarLembrete(agendamento)}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2 font-medium shadow-md"
                                >
                                    <Phone className="w-4 h-4" />
                                    Enviar Lembrete no WhatsApp
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-600">
                    💡 Clique para enviar lembretes de confirmação
                </div>
            </div>
        </div>
    )
}