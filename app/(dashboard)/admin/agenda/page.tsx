'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Check, X, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AgendaAdminPage() {
    const [monthStatus, setMonthStatus] = useState<{
        [key: string]: 'open' | 'closed'
    }>({
        '2024-12': 'open',
        '2025-01': 'closed',
    })

    const toggleMonthStatus = (month: string) => {
        setMonthStatus(prev => ({
            ...prev,
            [month]: prev[month] === 'open' ? 'closed' : 'open'
        }))
    }

    const months = [
        { value: '2024-12', label: 'Dezembro 2024' },
        { value: '2025-01', label: 'Janeiro 2025' },
        { value: '2025-02', label: 'Fevereiro 2025' },
        { value: '2025-03', label: 'Março 2025' },
    ]

    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <CalendarIcon size={32} className="text-gold" />
                        <h1 className="text-3xl font-bold text-charcoal">
                            Gerenciar Agenda
                        </h1>
                    </div>

                    <div className="mb-8 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-blue-600 mt-1" size={20} />
                        <div>
                            <p className="text-sm text-blue-900 font-semibold">Sobre a Agenda</p>
                            <p className="text-sm text-blue-700">
                                Quando um mês está fechado, os clientes não podem fazer novos agendamentos para esse período.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {months.map(month => {
                            const status = monthStatus[month.value] || 'closed'
                            const isOpen = status === 'open'

                            return (
                                <div
                                    key={month.value}
                                    className={`p-6 rounded-lg border-2 transition-all ${isOpen
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOpen ? 'bg-green-500' : 'bg-gray-400'
                                                }`}>
                                                {isOpen ? (
                                                    <Check className="text-white" size={24} />
                                                ) : (
                                                    <X className="text-white" size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-charcoal">
                                                    {month.label}
                                                </h3>
                                                <p className={`text-sm ${isOpen ? 'text-green-700' : 'text-gray-600'
                                                    }`}>
                                                    {isOpen ? 'Agenda Aberta - Aceitando agendamentos' : 'Agenda Fechada - Sem novos agendamentos'}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant={isOpen ? 'danger' : 'primary'}
                                            onClick={() => toggleMonthStatus(month.value)}
                                        >
                                            {isOpen ? 'Fechar Agenda' : 'Abrir Agenda'}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}