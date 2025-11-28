import Link from 'next/link'
import { Calendar, History, Settings } from 'lucide-react'

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-beige py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-charcoal mb-8">
                    Painel Administrativo
                </h1>

                <div className="grid md:grid-cols-3 gap-6">
                    <Link href="/admin/agenda" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow group">
                        <Calendar size={48} className="text-gold mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold text-charcoal mb-2">Gerenciar Agenda</h3>
                        <p className="text-gray-600">Abrir ou fechar agenda por mês</p>
                    </Link>

                    <Link href="/agendamentos" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow group">
                        <History size={48} className="text-gold mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold text-charcoal mb-2">Ver Agendamentos</h3>
                        <p className="text-gray-600">Visualizar todos os agendamentos</p>
                    </Link>

                    <div className="bg-white p-8 rounded-xl shadow-lg opacity-50">
                        <Settings size={48} className="text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Configurações</h3>
                        <p className="text-gray-500">Em breve</p>
                    </div>
                </div>
            </div>
        </div>
    )
}