import SectionTitle from '@/components/ui/SectionTitle'

export default function Location() {
    return (
        <section id="localizacao" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <SectionTitle
                    title="Localização"
                    subtitle="Venha nos visitar e conhecer nosso espaço"
                />

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Mapa */}
                    <div className="rounded-xl overflow-hidden shadow-lg h-[400px]">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.123456789!2d-35.123456!3d-5.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMDcnMjQuNCJTIDM1wrAwNyc0MC41Ilc!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Localização do Salão Henrique Bilro"
                        />
                    </div>

                    {/* Informações */}
                    <div className="space-y-8">
                        <h3 className="text-2xl font-bold text-charcoal mb-6">Entre em Contato</h3>

                        <div className="space-y-4">
                            <ContactItem icon="📍" title="Endereço">
                                Rua Exemplo, 123 - Centro<br />
                                São Gonçalo do Amarante/RN<br />
                                CEP: 59000-000
                            </ContactItem>

                            <ContactItem icon="📱" title="WhatsApp">
                                <a href="https://wa.me/5584999999999" className="text-gold hover:text-gold-dark">
                                    (84) 99999-9999
                                </a>
                            </ContactItem>

                            <ContactItem icon="📷" title="Instagram">
                                <a href="https://instagram.com/rosebilro" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark">
                                    @rosebilro
                                </a>
                            </ContactItem>

                            <ContactItem icon="✉️" title="Email">
                                <a href="mailto:contato@henriquebilro.com" className="text-gold hover:text-gold-dark">
                                    contato@henriquebilro.com
                                </a>
                            </ContactItem>

                            <ContactItem icon="🕐" title="Horário de Funcionamento">
                                Segunda a Sexta: 9h às 19h<br />
                                Sábado: 9h às 17h<br />
                                Domingo: Fechado
                            </ContactItem>
                        </div>

                        <a
                            href="https://wa.me/5584999999999?text=Olá! Gostaria de agendar um horário"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-green-500 text-white text-center py-4 rounded-lg hover:bg-green-600 transition-all font-semibold shadow-lg hover:shadow-xl"
                        >
                            💬 Falar no WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}

function ContactItem({ icon, title, children }: { icon: string, title: string, children: React.ReactNode }) {
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