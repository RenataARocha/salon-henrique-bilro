// src/components/home/HomeClient.tsx - Client Component

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
    return (
        <>
            <Navbar />

            <div className="h-20" />

            <main className="min-h-screen bg-beige">
                <Hero />
                <Features />
                <About />

                {/* SEÇÃO — Serviços DINÂMICOS */}
                <section id="servicos" className="py-20 bg-beige">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-charcoal">
                            Nossos Serviços
                        </h2>
                        <p className="text-center text-gray-600 mb-12 text-lg">
                            Conheça nossos serviços em destaque
                        </p>

                        {services.length > 0 ? (
                            <>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {services.map((service) => (
                                        <ServiceCard
                                            key={service.id}
                                            name={service.name}
                                            description={service.description || ''}
                                            price={service.price}
                                            duration={service.duration}
                                            images={service.images || []}
                                        />
                                    ))}
                                </div>

                                <div className="text-center mt-12">
                                    <SmartBookingButton
                                        variant="link"
                                        className="inline-block bg-gradient-gold text-white px-8 py-3 rounded-md hover:shadow-lg transition-all font-semibold cursor-pointer"
                                    >
                                        Ver Todos os Serviços
                                    </SmartBookingButton>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-6xl mb-4">💇‍♀️</p>
                                <p className="text-gray-600 text-lg">
                                    Estamos preparando nossos serviços. Volte em breve!
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 🆕 CARROSSEL DE AVALIAÇÕES */}
                <ReviewsCarousel />

                <Location />
                <CTA />
            </main>
        </>
    )
}