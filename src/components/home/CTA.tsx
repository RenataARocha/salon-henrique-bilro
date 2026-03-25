'use client'

import SmartBookingButton from '@/components/SmartBookingButton'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function CTA() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <section ref={ref} className="relative bg-black py-16 sm:py-20 lg:py-28 overflow-hidden border-t border-white/5">



            {/* Linhas decorativas */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-30" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-30" />

            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">

                <motion.div
                    className="flex items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="h-px w-6 sm:w-10 bg-gold opacity-40" />
                    <span className="text-[10px] sm:text-xs tracking-[0.3em] text-gold uppercase">
                        Reserve Seu Horário
                    </span>
                    <div className="h-px w-6 sm:w-10 bg-gold opacity-40" />
                </motion.div>

                <motion.h2
                    className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 text-white leading-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    Pronto para transformar<br />
                    <span className="text-gradient-gold">seu visual?</span>
                </motion.h2>

                <motion.p
                    className="text-white/50 text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 font-light"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Cadastre-se agora e agende seu horário
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <SmartBookingButton
                        variant="link"
                        className="inline-block w-full sm:w-auto bg-gradient-gold text-white px-6 sm:px-10 lg:px-14 py-3 sm:py-4 rounded-full hover:shadow-[0_0_40px_rgba(201,168,76,0.35)] transition-all text-sm sm:text-base font-semibold tracking-wide cursor-pointer"
                    >
                        Começar Agora
                    </SmartBookingButton>
                </motion.div>
            </div>
        </section>
    )
}