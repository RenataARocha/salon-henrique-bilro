'use client'

import SmartBookingButton from '@/components/SmartBookingButton'

export default function Hero() {
    return (
        <section className="relative bg-gradient-charcoal text-white py-32">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient-gold">
                    Transforme seu Visual
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light">
                    Agende seu horário online de forma rápida e prática no melhor salão da cidade
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <SmartBookingButton
                        variant="link"
                        className="bg-gradient-gold text-white px-10 py-4 rounded-md hover:shadow-2xl transition-all text-lg font-semibold"
                    >
                        Agendar Agora
                    </SmartBookingButton>
                    <a href="#servicos" className="bg-transparent border-2 border-gold text-gold px-10 py-4 rounded-md hover-bg-gold hover:text-white transition-all text-lg font-semibold">
                        Ver Serviços
                    </a>
                </div>
            </div>
        </section>
    )
}
