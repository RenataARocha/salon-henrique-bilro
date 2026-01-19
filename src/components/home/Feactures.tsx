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
        <section ref={ref} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow"
                            initial={{ opacity: 0, y: 50 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                            <div className="text-6xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-3 text-charcoal">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}