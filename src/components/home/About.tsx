'use client'

import SectionTitle from '@/components/ui/SectionTitle'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function About() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section id="sobre" ref={ref} className="py-16 sm:py-20 lg:py-24 
                                bg-[#0a0a0a] 
                                bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-4 sm:mb-5">
                            <div className="h-px w-6 sm:w-8 bg-gold opacity-60" />
                            <span className="text-[10px] sm:text-xs tracking-[0.3em] text-gold uppercase">
                                Sobre Nós
                            </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-5 sm:mb-6 leading-tight">
                            Referência em beleza<br />
                            <span className="text-gradient-gold">há mais de 15 anos</span>
                        </h2>

                        <p className="text-white/60 text-sm sm:text-base mb-4 leading-relaxed">
                            O <span className="text-gold font-semibold">Henrique Bilro Cabeleireiros</span> é referência em colorimetria e tratamentos capilares na região, com uma equipe especializada e constantemente atualizada.
                        </p>

                        <p className="text-white/60 text-sm sm:text-base mb-8 sm:mb-10 leading-relaxed">
                            Utilizamos apenas produtos de alta qualidade das melhores marcas, garantindo resultados incríveis e a saúde dos seus cabelos.
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            {[
                                { number: '15+', label: 'Anos de Experiência' },
                                { number: '5000+', label: 'Clientes Satisfeitos' },
                                { number: '100%', label: 'Produtos Premium' }
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-white/[0.04] border border-white/10 rounded-xl p-3 sm:p-4 text-center hover:border-gold/30 transition-colors"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                >
                                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gold mb-1">
                                        {stat.number}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-white/40 leading-tight">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="relative w-full max-w-md mx-auto md:max-w-none"
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-gold/20 via-transparent to-gold/5 pointer-events-none z-10" />

                        <div className="aspect-square sm:aspect-[4/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                            <img
                                src="https://lh3.googleusercontent.com/p/AF1QipO9oyR_EY3o7E5FDfO5INB2_ZlCzGabefZmvqWF=w600-h988-p-k-no"
                                alt="Interior do salão"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-gradient-gold text-white p-3 sm:p-5 rounded-xl shadow-xl z-20">
                            <div className="text-sm sm:text-base lg:text-lg font-bold">Ambiente</div>
                            <div className="text-[10px] sm:text-xs text-white/80">
                                Acolhedor e Moderno
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}