'use client'

import ServiceCard from '@/components/ServiceCard'
import SectionTitle from '@/components/ui/SectionTitle'

const services = [
    {
        name: 'Loiro Milhões',
        description: 'Loiro radiante e luminoso',
        price: 580,
        duration: 180,
        images: ['https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600']
    },
    {
        name: 'Iluminados',
        description: 'Loiros ou morenas iluminadas',
        price: 480,
        duration: 150,
        images: ['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600']
    },
    {
        name: 'Corte Feminino',
        description: 'Corte completo com finalização',
        price: 120,
        duration: 60,
        images: ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600']
    }
]

export default function Services() {
    const handleBooking = () => {
        window.location.href = '/register'
    }

    return (
        <section id="servicos" className="py-20 bg-beige">
            <div className="max-w-7xl mx-auto px-4">
                <SectionTitle
                    title="Nossos Serviços"
                    subtitle="Conheça nossos serviços em destaque"
                />

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <ServiceCard
                            key={index}
                            {...service}
                            onBook={handleBooking}
                        />
                    ))}
                </div>

                <div className="text-center mt-12">
                    <a href="/register" className="inline-block bg-gradient-gold text-white px-8 py-3 rounded-md hover:shadow-lg transition-all font-semibold">
                        Ver Todos os Serviços
                    </a>
                </div>
            </div>
        </section>
    )
}