'use client'

import SectionTitle from '@/components/ui/SectionTitle'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function About() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section id="sobre" ref={ref} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Texto - Vem da esquerda */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                        transition={{ duration: 0.6 }}
                    >
                        <SectionTitle
                            title="Sobre o Salão"
                            align="left"
                        />
                        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                            Com mais de 15 anos de experiência, o <span className="text-gold font-semibold">Henrique Bilro Cabeleireiros</span> é referência em colorimetria e tratamentos capilares na região.
                        </p>
                        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                            Nossa equipe é formada por profissionais especializados e constantemente atualizados com as últimas tendências e técnicas do mercado.
                        </p>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                            Utilizamos apenas produtos de alta qualidade das melhores marcas do mercado, garantindo resultados incríveis e a saúde dos seus cabelos.
                        </p>

                        <div className="grid grid-cols-3 gap-6 text-center">
                            {[
                                { number: '15+', label: 'Anos de Experiência' },
                                { number: '5000+', label: 'Clientes Satisfeitos' },
                                { number: '100%', label: 'Produtos Premium' }
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
                                >
                                    <div className="text-3xl font-bold text-gold mb-2">{stat.number}</div>
                                    <div className="text-sm text-gray-600">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Imagem - Vem da direita */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="aspect-[4/4] bg-gray-100 rounded-xl overflow-hidden shadow-2xl">
                            <img
                                src="https://lh3.googleusercontent.com/p/AF1QipO9oyR_EY3o7E5FDfO5INB2_ZlCzGabefZmvqWF=w600-h988-p-k-no"
                                alt="Interior do salão"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-gradient-gold text-white p-6 rounded-xl shadow-xl">
                            <div className="text-2xl font-bold">Ambiente</div>
                            <div className="text-sm">Acolhedor e Moderno</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}