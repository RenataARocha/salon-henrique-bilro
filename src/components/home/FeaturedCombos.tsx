// components/home/FeaturedCombos.tsx

'use client'

import { useState, useEffect } from 'react'
import { Gift, Percent, Clock } from 'lucide-react'
import SmartBookingButton from '@/components/SmartBookingButton'
import SectionTitle from '@/components/ui/SectionTitle'

interface Combo {
    id: string
    name: string
    description?: string
    discountPercent: number
    services: Array<{
        id: string
        name: string
        price: number
        duration: number
    }>
    originalPrice: number
    comboPrice: number
}

export default function FeaturedCombos() {
    const [combos, setCombos] = useState<Combo[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCombos()

        // ✅ Polling a cada 5 segundos para detectar mudanças
        const interval = setInterval(fetchCombos, 5000)

        // ✅ Escutar evento customizado (disparado pela página admin)
        const handleUpdate = () => {
            console.log('🔄 Evento de atualização recebido')
            fetchCombos()
        }

        window.addEventListener('combos-updated', handleUpdate)

        return () => {
            clearInterval(interval)
            window.removeEventListener('combos-updated', handleUpdate)
        }
    }, [])

    const fetchCombos = async () => {
        try {
            const res = await fetch('/api/combos', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })

            const data = await res.json()

            if (data.success) {
                console.log('🎁 Combos featured recebidos:', data.data.length)
                setCombos(data.data)
            }
        } catch (error) {
            console.error('❌ Erro ao buscar combos:', error)
        } finally {
            setLoading(false)
        }
    }

    // Se não há combos featured, não mostra a seção
    if (!loading && combos.length === 0) {
        return null
    }

    if (loading) {
        return (
            <section className="py-20 bg-beige">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-20 bg-gradient-to-br from-beige to-white">
            <div className="max-w-7xl mx-auto px-4">
                <SectionTitle
                    title="Combos Promocionais"
                    subtitle="Pacotes especiais com desconto"
                />

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {combos.map((combo) => (
                        <div
                            key={combo.id}
                            className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gold/20 relative group"
                        >
                            {/* Badge de Desconto */}
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg z-10 flex items-center gap-1">
                                <Percent size={14} />
                                {combo.discountPercent}% OFF
                            </div>

                            {/* Header */}
                            <div className="bg-gradient-gold p-6 text-white relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="relative z-10">
                                    <Gift size={32} className="mb-3" />
                                    <h3 className="text-2xl font-bold mb-2">{combo.name}</h3>
                                    {combo.description && (
                                        <p className="text-white/90 text-sm">{combo.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {/* Serviços Inclusos */}
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Gift size={16} className="text-gold" />
                                        Serviços inclusos:
                                    </p>
                                    <ul className="space-y-2">
                                        {combo.services.map((service) => (
                                            <li key={service.id} className="flex items-start gap-2 text-sm text-gray-600">
                                                <span className="w-1.5 h-1.5 bg-gold rounded-full mt-1.5 flex-shrink-0"></span>
                                                <span className="flex-1">
                                                    {service.name}
                                                    <span className="text-gray-400 ml-1">
                                                        (R$ {service.price.toFixed(2)})
                                                    </span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Duração Total */}
                                <div className="flex items-center gap-2 text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                                    <Clock size={18} className="text-gold" />
                                    <span className="text-sm font-medium">
                                        Duração total: {combo.services.reduce((sum, s) => sum + s.duration, 0)} min
                                    </span>
                                </div>

                                {/* Preços */}
                                <div className="space-y-2 mb-6 pb-6 border-b">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">De:</span>
                                        <span className="text-lg text-gray-400 line-through">
                                            R$ {combo.originalPrice.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-green-600">
                                            Economize:
                                        </span>
                                        <span className="text-lg font-bold text-green-600">
                                            R$ {(combo.originalPrice - combo.comboPrice).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-lg font-bold text-charcoal">Por apenas:</span>
                                        <span className="text-3xl font-bold text-gold">
                                            R$ {combo.comboPrice.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Botão */}
                                <SmartBookingButton
                                    variant="button"
                                    className="w-full bg-gradient-gold text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-200 cursor-pointer"
                                >
                                    🎁 Agendar Combo
                                </SmartBookingButton>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}