// src/components/admin/AdminHeader.tsx - NOVO COMPONENTE

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

interface AdminHeaderProps {
    title: string
    description: string
    showBackButton?: boolean
    backUrl?: string
}

export default function AdminHeader({
    title,
    description,
    showBackButton = false,
    backUrl = '/admin'
}: AdminHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                {showBackButton && (
                    <Link
                        href={backUrl}
                        className="flex items-center justify-center w-10 h-10 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all border-2 border-gray-200"
                        title="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                )}
                <div>
                    <h1 className="text-4xl font-bold text-charcoal mb-2">{title}</h1>
                    <p className="text-gray-600">{description}</p>
                </div>
            </div>

            {/* Navegação */}
            <div className="flex justify-end gap-3">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                >
                    <ArrowLeft size={20} />
                    Painel
                </Link>

                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold "
                >
                    <Home size={20} />
                    Voltar ao início
                </Link>
            </div>
        </div>
    )
}