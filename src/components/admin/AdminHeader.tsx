import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

interface AdminHeaderProps {
    title: string
    description: string
    showBackButton?: boolean
    backUrl?: string
    actions?: React.ReactNode  // ✅ nova prop
}

export default function AdminHeader({
    title,
    description,
    showBackButton = false,
    backUrl = '/admin',
    actions,
}: AdminHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
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
                    <h1 className="text-2xl sm:text-4xl font-bold text-charcoal mb-1 sm:mb-2">{title}</h1>
                    <p className="text-gray-600">{description}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end items-center gap-3">
                {/* ✅ Slot para botões customizados */}
                {actions && <div className="w-full sm:w-auto">{actions}</div>}

                <Link
                    href="/admin"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200 text-sm sm:text-base"
                >
                    <ArrowLeft size={18} />
                    Painel
                </Link>
                <Link
                    href="/"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
                >
                    <Home size={18} />
                    Voltar ao início
                </Link>
            </div>
        </div>
    )
}