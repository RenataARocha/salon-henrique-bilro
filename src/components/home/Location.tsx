import SectionTitle from '@/components/ui/SectionTitle'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'


export default function Location() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section id="localizacao" ref={ref} className="py-14 sm:py-16 lg:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <SectionTitle
                    title="Localização"
                    subtitle="Venha nos visitar e conhecer nosso espaço"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">

                    {/* Mapa */}
                    <motion.div
                        className="rounded-xl overflow-hidden shadow-lg h-[260px] sm:h-[320px] lg:h-[400px]"
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                        transition={{ duration: 0.6 }}
                    >
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.646585780604!2d-35.256692!3d-5.740777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7b3aa3210598e31%3A0x91e7dcbd464dbf67!2sHenrique%20Bilro%20Cabeleireiros!5e0!3m2!1spt-BR!2sbr!4v1737200000000"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Localização do Salão Henrique Bilro"
                        />
                    </motion.div>

                    {/* Infos */}
                    <motion.div
                        className="space-y-6 sm:space-y-8"
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h3 className="text-xl sm:text-2xl font-bold text-charcoal">
                            Entre em Contato
                        </h3>

                        <div className="space-y-4 sm:space-y-5">

                            <ContactItem icon="📍" title="Endereço">
                                <a
                                    href="https://www.google.com/maps/place/Henrique+Bilro+Cabeleireiros/@-5.7407769,-35.2541181,17z"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gold hover:text-gold-dark underline text-sm sm:text-base"
                                >
                                    Av. Rio Doce, 3101 – Potengi<br />
                                    Natal / RN
                                </a>
                            </ContactItem>

                            <ContactItem icon="📱" title="WhatsApp">
                                <div className="flex flex-col gap-1">
                                    <a
                                        href="https://wa.me/5584988814965?text=Olá! Gostaria de agendar um horário no Salão Henrique Bilro 💇‍♀️✨"
                                        target="_blank"
                                        className="text-gold hover:text-gold-dark text-sm sm:text-base"
                                    >
                                        (84) 98881-4965
                                    </a>

                                </div>
                            </ContactItem>

                            <ContactItem icon="📷" title="Instagram">
                                <a
                                    href="https://www.instagram.com/rosebilro/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gold hover:text-gold-dark text-sm sm:text-base"
                                >
                                    @rosebilro
                                </a>
                            </ContactItem>

                            <ContactItem icon="✉️" title="Email">
                                <a
                                    href="mailto:salaobilro@icloud.com"
                                    className="text-gold hover:text-gold-dark text-sm sm:text-base"
                                >
                                    salaobilro@icloud.com
                                </a>
                            </ContactItem>

                            <ContactItem icon="🕐" title="Horário de Funcionamento">
                                <span className="text-sm sm:text-base">
                                    Terça a Sábado: 10h às 18h<br />
                                    Domingo: Fechado<br />
                                    Segunda: Fechado
                                </span>
                            </ContactItem>

                        </div>

                        {/* BOTÕES */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">

                            <a
                                href="https://wa.me/5584988814965?text=Olá! Gostaria de agendar um horário no Salão Henrique Bilro 💇‍♀️✨"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:flex-1 bg-green-500 text-white text-center py-3 sm:py-4 rounded-lg hover:bg-green-600 transition-all font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                💬 Falar no WhatsApp
                            </a>

                            <a
                                href="https://www.google.com/maps/dir/?api=1&destination=Henrique+Bilro+Cabeleireiros"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:flex-1 border-2 border-gold text-gold text-center py-3 sm:py-4 rounded-lg hover:bg-gold hover:text-white transition-all font-semibold text-sm sm:text-base"
                            >
                                🧭 Como chegar
                            </a>

                        </div>

                    </motion.div>
                </div>
            </div>
        </section>
    )
}

function ContactItem({
    icon,
    title,
    children,
}: {
    icon: string
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-2xl">{icon}</span>
            </div>
            <div>
                <div className="font-semibold text-charcoal mb-1 text-sm sm:text-base">
                    {title}
                </div>
                <div className="text-gray-600 text-sm sm:text-base">
                    {children}
                </div>
            </div>
        </div>
    )
}
