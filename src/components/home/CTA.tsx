'use client'

import SmartBookingButton from '@/components/SmartBookingButton'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function CTA() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <section ref={ref} className="bg-gradient-gold text-white py-20">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <motion.h2
                    className="text-4xl font-bold mb-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6 }}
                >
                    Pronto para transformar seu visual?
                </motion.h2>

                <motion.p
                    className="text-xl mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Cadastre-se agora e agende seu horário
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <SmartBookingButton
                        variant="link"
                        className="inline-block bg-white text-charcoal px-10 py-4 rounded-md hover:bg-gray-100 transition-all text-lg font-semibold"
                    >
                        Começar Agora
                    </SmartBookingButton>
                </motion.div>
            </div>
        </section>
    )
}