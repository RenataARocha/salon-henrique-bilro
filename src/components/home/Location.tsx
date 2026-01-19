import SectionTitle from '@/components/ui/SectionTitle'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'


export default function Location() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section id="localizacao" ref={ref} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <SectionTitle
                    title="Localização"
                    subtitle="Venha nos visitar e conhecer nosso espaço"
                />

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Mapa - Vem da esquerda */}
                    <motion.div
                        className="rounded-xl overflow-hidden shadow-lg h-[400px]"
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

                    {/* Informações */}
                    <motion.div className="space-y-8"
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.6, delay: 0.2 }}>
                        <h3 className="text-2xl font-bold text-charcoal mb-6">Entre em Contato</h3>

                        <div className="space-y-4">
                            <ContactItem icon="📍" title="Endereço">
                                <a
                                    href="https://www.google.com/maps/place/Henrique+Bilro+Cabeleireiros/@-5.7407769,-35.2541181,17z"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gold hover:text-gold-dark underline"
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
                                        className="text-gold hover:text-gold-dark"
                                    >
                                        (84) 98881-4965
                                    </a>

                                    <a
                                        href="https://wa.me/5584999651972?text=Olá! Quero informações sobre serviços e horários disponíveis 💇‍♂️✨"
                                        target="_blank"
                                        className="text-gold hover:text-gold-dark"
                                    >
                                        (84) 99965-1972
                                    </a>
                                </div>
                            </ContactItem>

                            <ContactItem icon="📷" title="Instagram">
                                <a
                                    href="https://www.instagram.com/rosebilro/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gold hover:text-gold-dark"
                                >
                                    @rosebilro
                                </a>
                            </ContactItem>

                            <ContactItem icon="✉️" title="Email">
                                <a
                                    href="mailto:salaobilro@icloud.com"
                                    className="text-gold hover:text-gold-dark"
                                >
                                    salaobilro@icloud.com
                                </a>
                            </ContactItem>

                            <ContactItem icon="🕐" title="Horário de Funcionamento">
                                Terça a Sábado: 9h às 19h<br />
                                Domingo: Fechado<br />
                                Segunda: Fechado
                            </ContactItem>
                        </div>

                        <a
                            href="https://wa.me/5584988814965?text=Olá! Gostaria de agendar um horário no Salão Henrique Bilro 💇‍♀️✨"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-green-500 text-white text-center py-4 rounded-lg hover:bg-green-600 transition-all font-semibold shadow-lg hover:shadow-xl"
                        >
                            💬 Falar no WhatsApp
                        </a>

                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=Henrique+Bilro+Cabeleireiros"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border-2 border-gold text-gold text-center py-4 rounded-lg hover:bg-gold hover:text-white transition-all font-semibold"
                        >
                            🧭 Como chegar
                        </a>

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
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{icon}</span>
            </div>
            <div>
                <div className="font-semibold text-charcoal mb-1">{title}</div>
                <div className="text-gray-600">{children}</div>
            </div>
        </div>
    )
}
