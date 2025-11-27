'use client'

import Navbar from '@/components/NavBar'
import ServiceCard from '@/components/ServiceCard'

export default function Home() {
  const handleBooking = () => {
    window.location.href = '/register'
  }

  return (
    <>
      <Navbar />

      <div className="h-20" />

      <main className="min-h-screen bg-beige">
        <section className="relative bg-black/80 text-white py-32">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient-gold">
              Transforme seu Visual
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light">
              Agende seu horário online de forma rápida e prática no melhor salão da cidade
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/register" className="bg-gradient-gold text-white px-10 py-4 rounded-md hover:shadow-2xl transition-all text-lg font-semibold">
                Agendar Agora
              </a>
              <a href="#servicos" className="bg-transparent border-2 border-gold text-gold px-10 py-4 rounded-md hover-bg-gold hover:text-white transition-all text-lg font-semibold">
                Ver Serviços
              </a>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold mb-3 text-charcoal">Agendamento Fácil</h3>
                <p className="text-gray-600">Reserve seu horário em poucos cliques</p>
              </div>
              <div className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
                <div className="text-6xl mb-4">💇‍♀️</div>
                <h3 className="text-xl font-bold mb-3 text-charcoal">Profissionais Experientes</h3>
                <p className="text-gray-600">Equipe altamente qualificada</p>
              </div>
              <div className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-bold mb-3 text-charcoal">Produtos Premium</h3>
                <p className="text-gray-600">Apenas produtos de alta qualidade</p>
              </div>
            </div>
          </div>
        </section>

        <section id="servicos" className="py-20 bg-beige">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-charcoal">Nossos Serviços</h2>
            <p className="text-center text-gray-600 mb-12 text-lg">Conheça nossos serviços em destaque</p>

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
              <a href="/register" className="inline-block bg-gradient-gold text-white px-8 py-3 rounded-md hover:shadow-lg transition-all font-semibold">
                Ver Todos os Serviços
              </a>
            </div>
          </div>
        </section>

        <section className="bg-gradient-gold text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Pronto para transformar seu visual?</h2>
            <p className="text-xl mb-8">Cadastre-se agora e agende seu horário</p>
            <a href="/register" className="inline-block bg-white text-charcoal px-10 py-4 rounded-md hover:bg-gray-100 transition-all text-lg font-semibold">
              Começar Agora
            </a>
          </div>
        </section>
      </main>
    </>
  )
}