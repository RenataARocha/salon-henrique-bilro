'use client'

import SmartBookingButton from '@/components/SmartBookingButton'
import { motion } from 'framer-motion'

export default function Hero() {
    return (
        <section className="relative bg-gradient-charcoal text-white py-32">
            <div className="max-w-7xl mx-auto px-4 text-center">
                {/* Título com delay 0.2s */}
                <motion.h1
                    className="text-5xl md:text-7xl font-bold mb-6 text-gradient-gold"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Transforme seu Visual
                </motion.h1>

                {/* Subtítulo com delay 0.4s */}
                <motion.p
                    className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    Agende seu horário online de forma rápida e prática no melhor salão da cidade
                </motion.p>

                {/* Botões com delay 0.6s */}
                <motion.div
                    className="flex gap-4 justify-center flex-wrap"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <SmartBookingButton
                        variant="link"
                        className="bg-gradient-gold text-white px-10 py-4 rounded-md hover:shadow-2xl transition-all text-lg font-semibold"
                    >
                        Agendar Agora
                    </SmartBookingButton>
                    <a href="#servicos" className="bg-transparent border-2 border-gold text-gold px-10 py-4 rounded-md hover-bg-gold hover:text-white transition-all text-lg font-semibold cursor-pointer">
                        Ver Serviços
                    </a>
                </motion.div>
            </div>
        </section>
    )
}