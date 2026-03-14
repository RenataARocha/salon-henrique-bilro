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

            <div className="h-20" />

            <main className="min-h-screen bg-beige">

                <Hero />
                <Features />
                <About />

                {/* SEÇÃO — Serviços */}
                <section id="servicos" ref={servicesRef} className="py-20 bg-beige">

                    <div className="max-w-7xl mx-auto px-4">

                        <motion.h2
                            className="text-4xl md:text-5xl font-bold text-center mb-4 text-charcoal"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isServicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.6 }}
                        >
                            Nossos Serviços
                        </motion.h2>

                        <motion.p
                            className="text-center text-gray-600 mb-12 text-lg"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isServicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            Conheça nossos serviços em destaque
                        </motion.p>

                        {services.length > 0 ? (
                            <>

                                {/* CARROSSEL DE SERVIÇOS com setas customizadas */}
                                <div className="relative px-8">

                                    {/* Seta Anterior */}
                                    <button
                                        ref={prevRef}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                                                   w-11 h-11 rounded-full bg-white shadow-lg border border-gold/30
                                                   flex items-center justify-center text-gold
                                                   hover:bg-gold hover:text-white transition-all duration-200"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>

                                    <Swiper
                                        modules={[Autoplay, Navigation]}
                                        spaceBetween={24}
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
                                            0: { slidesPerView: 1 },
                                            640: { slidesPerView: 1 },
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

                                    {/* Seta Próxima */}
                                    <button
                                        ref={nextRef}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                                                   w-11 h-11 rounded-full bg-white shadow-lg border border-gold/30
                                                   flex items-center justify-center text-gold
                                                   hover:bg-gold hover:text-white transition-all duration-200"
                                    >
                                        <ChevronRight size={22} />
                                    </button>

                                </div>

                                {/* COMBOS EM DESTAQUE */}
                                <FeaturedCombos />

                                {/* BOTÃO VER TODOS */}
                                <motion.div
                                    className="text-center mt-12"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={isServicesInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.6, delay: 0.8 }}
                                >

                                    <SmartBookingButton
                                        variant="link"
                                        className="inline-block bg-gradient-gold text-white px-8 py-3 rounded-md hover:shadow-lg transition-all font-semibold cursor-pointer"
                                    >
                                        Ver Todos os Serviços
                                    </SmartBookingButton>

                                </motion.div>

                            </>
                        ) : (

                            <motion.div
                                className="text-center py-12"
                                initial={{ opacity: 0, y: 30 }}
                                animate={isServicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.6 }}
                            >

                                <p className="text-6xl mb-4">💇‍♀️</p>

                                <p className="text-gray-600 text-lg">
                                    Estamos preparando nossos serviços. Volte em breve!
                                </p>

                            </motion.div>

                        )}

                    </div>

                </section>

                {/* AVALIAÇÕES */}
                <ReviewsCarousel />

                <Location />

                <CTA />

            </main>
        </>
    )
}