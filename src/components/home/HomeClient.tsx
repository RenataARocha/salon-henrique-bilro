'use client'

import Navbar from '@/components/NavBar'
import Hero from '@/components/home/Hero'
import Features from '@/components/home/Feactures'
import About from '@/components/home/About'
import Location from '@/components/home/Location'
import ReviewsCarousel from '@/components/home/ReviewsCarousel'
import CTA from '@/components/home/CTA'
import ServiceCard from '@/components/ServiceCard'
import SmartBookingButton from '@/components/SmartBookingButton'
import FeaturedCombos from '@/components/home/FeaturedCombos'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'

import 'swiper/css'

interface Service {
    id: string
    name: string
    description: string | null
    price: number
    duration: number
    images: string[] | null
}

interface HomeClientProps {
    services: Service[]
}

export default function HomeClient({ services }: HomeClientProps) {

    const servicesRef = useRef(null)
    const isServicesInView = useInView(servicesRef, { once: true, margin: "-100px" })

    const prevRef = useRef<HTMLButtonElement>(null)
    const nextRef = useRef<HTMLButtonElement>(null)

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-beige">

                <Hero />
                <Features />
                <About />

                {/* SEÇÃO — Serviços */}
                <section id="servicos" ref={servicesRef} className="py-14 sm:py-16 lg:py-20 bg-beige">

                    <div className="max-w-7xl mx-auto px-4 sm:px-6">

                        <motion.h2
                            className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-3 sm:mb-4 text-charcoal"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isServicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.6 }}
                        >
                            Nossos Serviços
                        </motion.h2>

                        <motion.p
                            className="text-center text-gray-600 mb-8 sm:mb-10 lg:mb-12 text-sm sm:text-base lg:text-lg"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isServicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            Conheça nossos serviços em destaque
                        </motion.p>

                        {services.length > 0 ? (
                            <>

                                {/* CARROSSEL */}
                                <div className="relative">

                                    {/* Seta Anterior (esconde no mobile) */}
                                    <button
                                        ref={prevRef}
                                        className="hidden sm:flex absolute -left-2 lg:left-0 top-1/2 -translate-y-1/2 z-10
                                           w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white shadow-lg border border-gold/30
                                           items-center justify-center text-gold
                                           hover:bg-gold hover:text-white transition-all duration-200"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    <Swiper
                                        modules={[Autoplay, Navigation]}
                                        spaceBetween={16}
                                        loop={true}
                                        autoplay={{
                                            delay: 4500,
                                            disableOnInteraction: false,
                                        }}
                                        navigation={{
                                            prevEl: prevRef.current,
                                            nextEl: nextRef.current,
                                        }}
                                        onBeforeInit={(swiper) => {
                                            // @ts-ignore
                                            swiper.params.navigation.prevEl = prevRef.current
                                            // @ts-ignore
                                            swiper.params.navigation.nextEl = nextRef.current
                                        }}
                                        breakpoints={{
                                            0: { slidesPerView: 1.1 },
                                            640: { slidesPerView: 1.2 },
                                            768: { slidesPerView: 2 },
                                            1024: { slidesPerView: 3 },
                                        }}
                                    >

                                        {services.map((service, index) => (

                                            <SwiperSlide key={service.id}>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 50 }}
                                                    animate={isServicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                                    className="h-full"
                                                >

                                                    <ServiceCard
                                                        name={service.name}
                                                        description={service.description || ''}
                                                        price={service.price}
                                                        duration={service.duration}
                                                        images={service.images || []}
                                                    />

                                                </motion.div>

                                            </SwiperSlide>

                                        ))}

                                    </Swiper>

                                    {/* Seta Próxima (esconde no mobile) */}
                                    <button
                                        ref={nextRef}
                                        className="hidden sm:flex absolute -right-2 lg:right-0 top-1/2 -translate-y-1/2 z-10
                                           w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white shadow-lg border border-gold/30
                                           items-center justify-center text-gold
                                           hover:bg-gold hover:text-white transition-all duration-200"
                                    >
                                        <ChevronRight size={20} />
                                    </button>

                                </div>

                                {/* COMBOS */}
                                <div className="mt-10 sm:mt-12">
                                    <FeaturedCombos />
                                </div>

                                {/* BOTÃO */}
                                <motion.div
                                    className="text-center mt-10 sm:mt-12"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={isServicesInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.6, delay: 0.8 }}
                                >

                                    <SmartBookingButton
                                        variant="link"
                                        className="w-full sm:w-auto inline-block bg-gradient-gold text-white px-6 sm:px-8 py-3 rounded-md hover:shadow-lg transition-all text-sm sm:text-base font-semibold cursor-pointer"
                                    >
                                        Ver Todos os Serviços
                                    </SmartBookingButton>

                                </motion.div>

                            </>
                        ) : (

                            <motion.div
                                className="text-center py-10 sm:py-12"
                                initial={{ opacity: 0, y: 30 }}
                                animate={isServicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.6 }}
                            >

                                <p className="text-4xl sm:text-6xl mb-3 sm:mb-4">💇‍♀️</p>

                                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                                    Estamos preparando nossos serviços. Volte em breve!
                                </p>

                            </motion.div>

                        )}

                    </div>

                </section>

                <ReviewsCarousel />
                <Location />
                <CTA />

            </main>
        </>
    )
}