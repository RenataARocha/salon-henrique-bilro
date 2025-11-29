import SectionTitle from '@/components/ui/SectionTitle'

export default function About() {
    return (
        <section id="sobre" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
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
                            <div>
                                <div className="text-3xl font-bold text-gold mb-2">15+</div>
                                <div className="text-sm text-gray-600">Anos de Experiência</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gold mb-2">5000+</div>
                                <div className="text-sm text-gray-600">Clientes Satisfeitos</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gold mb-2">100%</div>
                                <div className="text-sm text-gray-600">Produtos Premium</div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800"
                                alt="Interior do salão"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-gradient-gold text-white p-6 rounded-xl shadow-xl">
                            <div className="text-2xl font-bold">Ambiente</div>
                            <div className="text-sm">Acolhedor e Moderno</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}