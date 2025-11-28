'use client'

import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react'

const historyData = [
    {
        id: 1,
        serviceName: 'Loiro Milhões',
        date: '2024-11-15',
        time: '14:00',
        status: 'completed',
        price: 580,
    },
    {
        id: 2,
        serviceName: 'Corte Feminino',
        date: '2024-10-20',
        time: '10:00',
        status: 'completed',
        price: 120,
    },
    {
        id: 3,
        serviceName: 'Hidratação',
        date: '2024-09-10',
        time: '15:00',
        status: 'cancelled',
        price: 150,
    },
]

export default function HistoricoPage() {
    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-charcoal mb-8">
                    Meu Histórico
                </h1>

                <div className="space-y-4">
                    {historyData.map(item => (
                        <div key={item.id} className="bg-white rounded-xl shadow p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-charcoal mb-1">
                                        {item.serviceName}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={16} />
                                            {new Date(item.date).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={16} />
                                            {item.time}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'completed'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {item.status === 'completed' ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={14} />
                                                Concluído
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <XCircle size={14} />
                                                Cancelado
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xl font-bold text-gold">
                                        R$ {item.price.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <button className="text-sm text-gold hover:text-gold-dark font-semibold">
                                Agendar novamente →
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}