'use client'

import Navbar from '@/components/NavBar'
import Hero from '@/components/home/Hero'
import Features from '@/components/home/Feactures'
import About from '@/components/home/About'
import Location from '@/components/home/Location'
import ServiceCard from '@/components/ServiceCard'
import CTA from '@/components/home/CTA'

export default function Home() {
  const handleBooking = () => {
    window.location.href = '/register'
  }

  return (
    <>
      <Navbar />

      <div className="h-20" />

      <main className="min-h-screen bg-beige">

        <Hero />
        <Features />
        <About />
        <Location />
        <CTA />

        {/* SEÇÃO — Serviços (única) */}
        <section id="servicos" className="py-20 bg-beige">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-charcoal">
              Nossos Serviços
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Conheça nossos serviços em destaque
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ServiceCard
                name="Loiro Milhões"
                description="Loiro radiante e luminoso"
                price={580}
                duration={180}
                images={['https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600']}
                onBook={handleBooking}
              />

              <ServiceCard
                name="Iluminados"
                description="Loiros ou morenas iluminadas"
                price={480}
                duration={150}
                images={['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600']}
                onBook={handleBooking}
              />

              <ServiceCard
                name="Corte Feminino"
                description="Corte completo com finalização"
                price={120}
                duration={60}
                images={['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600']}
                onBook={handleBooking}
              />
            </div>

            <div className="text-center mt-12">
              <a
                href="/register"
                className="inline-block bg-gradient-gold text-white px-8 py-3 rounded-md hover:shadow-lg transition-all font-semibold"
              >
                Ver Todos os Serviços
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
