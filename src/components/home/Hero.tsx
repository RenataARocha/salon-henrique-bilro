'use client'

import SmartBookingButton from '@/components/SmartBookingButton'
import { motion } from 'framer-motion'

export default function Hero() {
    return (
        <section className="relative pt-24 sm:pt-30 lg:pt-32 pb-16 sm:pb-24 lg:pb-30 overflow-hidden 
                    bg-[#0a0a0a] 
                    bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] 
                    text-white">

            <div
                className="absolute inset-0 opacity-[0.03] sm:opacity-[0.04]"
                style={{
                    backgroundImage: `repeating-linear-gradient(0deg, #c9a84c 0px, transparent 1px, transparent 80px),
                              repeating-linear-gradient(90deg, #c9a84c 0px, transparent 1px, transparent 80px)`
                }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)' }}
                />
            </div>

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-40" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">

                <motion.div
                    className="inline-flex items-center gap-2 mb-6 sm:mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="h-px w-6 sm:w-8 bg-gold opacity-60" />
                    <span className="text-[10px] sm:text-xs tracking-[0.3em] text-gold uppercase font-medium">
                        Salão de Beleza Premium
                    </span>
                    <div className="h-px w-6 sm:w-8 bg-gold opacity-60" />
                </motion.div>

                <motion.h1
                    className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-5 sm:mb-6 leading-tight sm:leading-none tracking-tight"
                    style={{
                        background: 'linear-gradient(135deg, #fff 0%, #c9a84c 50%, #fff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    Transforme<br />seu Visual
                </motion.h1>

                <motion.p
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-8 sm:mb-10 lg:mb-12 max-w-md sm:max-w-xl mx-auto font-light tracking-wide leading-relaxed"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    Agende seu horário online de forma rápida e prática no melhor salão da cidade
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <SmartBookingButton
                        variant="link"
                        className="w-full sm:w-auto bg-gradient-gold text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-full hover:shadow-[0_0_30px_rgba(201,168,76,0.4)] transition-all text-sm sm:text-base font-semibold tracking-wide cursor-pointer"
                    >
                        Agendar Agora
                    </SmartBookingButton>

                    <a
                        href="#servicos"
                        className="w-full sm:w-auto text-center bg-transparent border border-gold/40 text-gold/80 px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-full hover:border-gold hover:text-white hover:bg-gold/10 transition-all text-sm sm:text-base font-medium tracking-wide"
                    >
                        Ver Serviços
                    </a>
                </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-20" />
        </section>
    )
}