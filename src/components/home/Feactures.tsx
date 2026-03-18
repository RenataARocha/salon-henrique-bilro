'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
    {
        icon: '📅',
        title: 'Agendamento Fácil',
        description: 'Reserve seu horário em poucos cliques'
    },
    {
        icon: '💇‍♀️',
        title: 'Profissionais Experientes',
        description: 'Equipe altamente qualificada'
    },
    {
        icon: '✨',
        title: 'Produtos Premium',
        description: 'Apenas produtos de alta qualidade'
    }
]

export default function Features() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section
            ref={ref}
            className="py-14 sm:py-16 lg:py-20 
                                bg-gradient-to-br from-[#fdfbf7] via-[#e2d1a4] to-[#fdfbf7]">
            {/* Brilho */}
            <div className="absolute inset-0 opacity-20 sm:opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="text-center p-5 sm:p-6 lg:p-8 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all"
                            initial={{ opacity: 0, y: 50 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 drop-shadow-md">
                                {feature.icon}
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800">
                                {feature.title}
                            </h3>

                            <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}