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
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
                            <div className="text-6xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-3 text-charcoal">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}