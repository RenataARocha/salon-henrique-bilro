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
            <section className="py-14 sm:py-16 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gold mx-auto" />
                    <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">
                        Carregando combos...
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section className="py-14 sm:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                <SectionTitle
                    title="Combos Promocionais"
                    subtitle="Pacotes especiais com desconto"
                />

                <div className="relative mt-10 sm:mt-12">

                    {/* Botão anterior (esconde no mobile) */}
                    <button
                        ref={setPrevEl}
                        className="hidden sm:flex absolute -left-2 lg:left-0 top-1/2 -translate-y-1/2 z-10
                               w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white shadow-lg border border-gold/30
                               items-center justify-center text-gold
                               hover:bg-gold hover:text-white transition-all duration-200
                               disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <Swiper
                        key={combos.length}
                        modules={[Autoplay, Navigation]}
                        spaceBetween={16}
                        loop={combos.length > 3}
                        autoplay={{ delay: 3500, disableOnInteraction: false }}
                        navigation={{ prevEl, nextEl }}
                        breakpoints={{
                            0: { slidesPerView: 1.1 },
                            640: { slidesPerView: 1.2 },
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                    >
                        {combos.map((combo) => (
                            <SwiperSlide key={combo.id}>

                                <div className="bg-white rounded-2xl shadow-lg sm:shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gold/20 relative h-full">

                                    {/* Badge */}
                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg z-10 flex items-center gap-1">
                                        <Percent size={12} />
                                        {combo.discountPercent}% OFF
                                    </div>

                                    {/* Header */}
                                    <div className="bg-gradient-gold p-4 sm:p-6 text-white">
                                        <Gift size={26} className="mb-2 sm:mb-3" />
                                        <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
                                            {combo.name}
                                        </h3>
                                        {combo.description && (
                                            <p className="text-white/90 text-xs sm:text-sm">
                                                {combo.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="p-4 sm:p-6">

                                        <div className="mb-5 sm:mb-6">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                                                <Gift size={14} className="text-gold" />
                                                Serviços inclusos
                                            </p>

                                            <ul className="space-y-1.5 sm:space-y-2">
                                                {combo.services.map(service => (
                                                    <li key={service.id} className="flex gap-2 text-xs sm:text-sm text-gray-600">
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

                                        <div className="flex items-center gap-2 text-gray-600 mb-5 sm:mb-6 bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                                            <Clock size={16} className="text-gold" />
                                            <span className="text-xs sm:text-sm font-medium">
                                                {combo.services.reduce((sum, s) => sum + s.duration, 0)} min
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b">
                                            <div className="flex justify-between text-gray-500 text-sm">
                                                <span>De:</span>
                                                <span className="line-through">
                                                    R$ {combo.originalPrice.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-green-600 font-semibold text-sm">
                                                <span>Economize</span>
                                                <span>
                                                    R$ {(combo.originalPrice - combo.comboPrice).toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between pt-1 sm:pt-2">
                                                <span className="text-sm sm:text-lg font-bold text-charcoal">
                                                    Por apenas
                                                </span>
                                                <span className="text-xl sm:text-3xl font-bold text-gold">
                                                    R$ {combo.comboPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <SmartBookingButton
                                            variant="button"
                                            className="w-full bg-gradient-gold text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:shadow-xl transition-all cursor-pointer"
                                        >
                                            🎁 Agendar Combo
                                        </SmartBookingButton>

                                    </div>

                                </div>

                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Botão próximo (esconde no mobile) */}
                    <button
                        ref={setNextEl}
                        className="hidden sm:flex absolute -right-2 lg:right-0 top-1/2 -translate-y-1/2 z-10
                               w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white shadow-lg border border-gold/30
                               items-center justify-center text-gold
                               hover:bg-gold hover:text-white transition-all duration-200
                               disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>

                </div>
            </div>
        </section>
    )
}