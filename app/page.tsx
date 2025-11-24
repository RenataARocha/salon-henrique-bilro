'use client'

import Navbar from '@/components/NavBar'
import ServiceCard from '@/components/ServiceCard'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-yellow-500">
              Transforme seu Visual
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Agende seu horário online de forma rápida e prática no melhor salão da cidade
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-yellow-600 text-white px-8 py-4 rounded-lg hover:bg-yellow-700 transition-all text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                Agendar Agora
              </Link>
              <Link
                href="/#servicos"
                className="bg-transparent border-2 border-yellow-600 text-yellow-500 px-8 py-4 rounded-lg hover:bg-yellow-600 hover:text-white transition-all text-lg font-semibold"
              >
                Ver Serviços
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="text-xl font-bold mb-3">Agendamento Fácil</h3>
                <p className="text-gray-600">
                  Reserve seu horário em poucos cliques, 24 horas por dia
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow">
                <div className="text-5xl mb-4">💇‍♀️</div>
                <h3 className="text-xl font-bold mb-3">Profissionais Experientes</h3>
                <p className="text-gray-600">
                  Equipe altamente qualificada e atualizada com as tendências
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-xl font-bold mb-3">Produtos Premium</h3>
                <p className="text-gray-600">
                  Utilizamos apenas produtos de alta qualidade para seu cabelo
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Preview - AQUI VÃO OS CARDS! */}
        <section id="servicos" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">Nossos Serviços</h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Conheça alguns dos nossos serviços em destaque
            </p>

            {/* Grid de Serviços */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ServiceCard
                name="Loiro Milhões"
                description="Loiro radiante e luminoso com técnicas avançadas"
                price={580}
                duration={180}
                images={[
                  '/assets/images/services/loiro-milhoes-1.jpg',
                  '/assets/images/services/loiro-milhoes-2.jpg',
                  '/assets/images/services/loiro-milhoes-3.jpg'
                ]}
                onBook={() => {
                  // Redirecionar para cadastro se não estiver logado
                  window.location.href = '/register'
                }}
              />

              <ServiceCard
                name="Iluminados"
                description="Loiros ou morenas iluminadas com mechas naturais"
                price={480}
                duration={150}
                images={[
                  '/assets/images/services/iluminados-1.jpg',
                  '/assets/images/services/iluminados-2.jpg'
                ]}
                onBook={() => {
                  window.location.href = '/register'
                }}
              />

              <ServiceCard
                name="Corte Feminino"
                description="Corte completo com finalização profissional"
                price={120}
                duration={60}
                images={[
                  '/assets/images/services/corte-feminino-1.jpg'
                ]}
                onBook={() => {
                  window.location.href = '/register'
                }}
              />
            </div>

            <div className="text-center mt-12">
              <Link
                href="/register"
                className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                Cadastre-se para Ver Todos os Serviços
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Pronto para transformar seu visual?</h2>
            <p className="text-xl mb-8">
              Cadastre-se agora e agende seu horário em menos de 2 minutos!
            </p>
            <Link
              href="/register"
              className="inline-block bg-black text-white px-10 py-4 rounded-lg hover:bg-gray-900 transition-colors text-lg font-semibold shadow-xl"
            >
              Começar Agora
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}