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

                    <Link href="admin/agendamentos" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow group">
                        <History size={48} className="text-gold mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold text-charcoal mb-2">Ver Agendamentos</h3>
                        <p className="text-gray-600">Visualizar todos os agendamentos</p>
                    </Link>

                    <Link href="admin/configuracoes" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow group">
                        <Settings size={48} className="text-gold mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold text-charcoal mb-2">Configurações</h3>
                        <p className="text-gray-600">Em breve</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}