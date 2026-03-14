'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Gift, Percent, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import SmartBookingButton from '@/components/SmartBookingButton'
import SectionTitle from '@/components/ui/SectionTitle'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'

import 'swiper/css'

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

    const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null)
    const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null)

    const fetchCombos = useCallback(async () => {
        try {
            const res = await fetch('/api/combos', { cache: 'no-store' })
            const data = await res.json()

            if (data.success && Array.isArray(data.data)) {
                setCombos(data.data)
            } else {
                setCombos([])
            }
        } catch (error) {
            console.error('Erro ao buscar combos', error)
            setCombos([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCombos()
        const interval = setInterval(fetchCombos, 5000)
        const handleUpdate = () => fetchCombos()
        window.addEventListener('combos-updated', handleUpdate)
        return () => {
            clearInterval(interval)
            window.removeEventListener('combos-updated', handleUpdate)
        }
    }, [fetchCombos])

    if (!loading && combos.length === 0) return null

    if (loading) {
        return (
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto" />
                    <p className="text-gray-600 mt-4">Carregando combos...</p>
                </div>
            </section>
        )
    }

    return (
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-4">

                <SectionTitle
                    title="Combos Promocionais"
                    subtitle="Pacotes especiais com desconto"
                />

                <div className="relative px-8 mt-12">

                    <button
                        ref={setPrevEl}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                                   w-11 h-11 rounded-full bg-white shadow-lg border border-gold/30
                                   flex items-center justify-center text-gold
                                   hover:bg-gold hover:text-white transition-all duration-200
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    <Swiper
                        key={combos.length}
                        modules={[Autoplay, Navigation]}
                        spaceBetween={24}
                        loop={combos.length > 3}
                        autoplay={{ delay: 3500, disableOnInteraction: false }}
                        navigation={{ prevEl, nextEl }}
                        breakpoints={{
                            0: { slidesPerView: 1 },
                            640: { slidesPerView: 1 },
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                    >
                        {combos.map((combo) => (
                            <SwiperSlide key={combo.id}>

                                {/* ✅ Sem motion.div — sem opacity:0 inicial que nunca anima dentro do Swiper */}
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gold/20 relative h-full">

                                    {/* Badge de desconto */}
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg z-10 flex items-center gap-1">
                                        <Percent size={14} />
                                        {combo.discountPercent}% OFF
                                    </div>

                                    {/* Header dourado */}
                                    <div className="bg-gradient-gold p-6 text-white">
                                        <Gift size={32} className="mb-3" />
                                        <h3 className="text-2xl font-bold mb-2">{combo.name}</h3>
                                        {combo.description && (
                                            <p className="text-white/90 text-sm">{combo.description}</p>
                                        )}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="p-6">

                                        <div className="mb-6">
                                            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <Gift size={16} className="text-gold" />
                                                Serviços inclusos
                                            </p>
                                            <ul className="space-y-2">
                                                {combo.services.map(service => (
                                                    <li key={service.id} className="flex gap-2 text-sm text-gray-600">
                                                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-1.5 shrink-0" />
                                                        <span>
                                                            {service.name}
                                                            <span className="text-gray-400 ml-1">
                                                                (R$ {service.price.toFixed(2)})
                                                            </span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                                            <Clock size={18} className="text-gold" />
                                            <span className="text-sm font-medium">
                                                {combo.services.reduce((sum, s) => sum + s.duration, 0)} min
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-6 pb-6 border-b">
                                            <div className="flex justify-between text-gray-500">
                                                <span>De:</span>
                                                <span className="line-through">
                                                    R$ {combo.originalPrice.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-green-600 font-semibold">
                                                <span>Economize</span>
                                                <span>
                                                    R$ {(combo.originalPrice - combo.comboPrice).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <span className="text-lg font-bold text-charcoal">
                                                    Por apenas
                                                </span>
                                                <span className="text-3xl font-bold text-gold">
                                                    R$ {combo.comboPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <SmartBookingButton
                                            variant="button"
                                            className="w-full bg-gradient-gold text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
                                        >
                                            🎁 Agendar Combo
                                        </SmartBookingButton>

                                    </div>

                                </div>

                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button
                        ref={setNextEl}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                                   w-11 h-11 rounded-full bg-white shadow-lg border border-gold/30
                                   flex items-center justify-center text-gold
                                   hover:bg-gold hover:text-white transition-all duration-200
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={22} />
                    </button>

                </div>

            </div>
        </section>
    )
}