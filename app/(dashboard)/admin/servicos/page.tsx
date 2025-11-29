'use client'

import { useState, useEffect } from 'react'

interface Service {
    id: string
    name: string
    description: string
    price: number
    duration: number
    active: boolean
}

export default function AdminServicosPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/services')
            const data = await res.json()
            if (data.success) {
                setServices(data.data)
            }
        } catch (error) {
            console.error('Erro ao buscar serviços:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-charcoal mb-2">Serviços</h1>
                    <p className="text-gray-600">Gerencie os serviços oferecidos pelo salão</p>
                </div>
                <button
                    className="bg-gradient-gold text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
                >
                    + Novo Serviço
                </button>
            </div>

            {/* Lista de serviços */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                    <div
                        key={service.id}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-charcoal">{service.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${service.active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                {service.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Preço</p>
                                <p className="text-2xl font-bold text-gold">R$ {service.price.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Duração</p>
                                <p className="text-lg font-bold text-charcoal">{service.duration} min</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => alert('Funcionalidade em desenvolvimento')}
                                className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                onClick={() => alert('Funcionalidade em desenvolvimento')}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${service.active
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                {service.active ? '🔒 Desativar' : '🔓 Ativar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {services.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <p className="text-6xl mb-4">💇‍♀️</p>
                    <h3 className="text-2xl font-bold text-charcoal mb-2">Nenhum serviço cadastrado</h3>
                    <p className="text-gray-600 mb-6">Adicione serviços para começar a receber agendamentos</p>
                    <button
                        onClick={() => alert('Funcionalidade em desenvolvimento')}
                        className="bg-gradient-gold text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                        + Adicionar Primeiro Serviço
                    </button>
                </div>
            )}
        </div>
    )
}