'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LogOut, Calendar, Settings } from 'lucide-react'

interface NavbarProps {
    user?: {
        name: string
        role: string
    } | null
}

export default function Navbar({ user }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        window.location.href = '/api/auth/signout'
    }

    return (
        <nav className="bg-black shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo Tipográfica */}
                    <Link href="/" className="flex-shrink-0">
                        <div className="flex flex-col">
                            <span className="text-3xl md:text-4xl font-bold tracking-wider text-yellow-500 font-playfair">
                                HENRIQUE BILRO
                            </span>
                            <span className="text-xs md:text-sm tracking-[0.3em] text-gray-400 mt-1 font-lato">
                                CABELEIREIROS
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {!user ? (
                            <>
                                <Link
                                    href="/#servicos"
                                    className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium"
                                >
                                    Serviços
                                </Link>
                                <Link
                                    href="/login"
                                    className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
                                >
                                    Cadastrar
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/agendar"
                                    className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Calendar size={18} />
                                    Agendar
                                </Link>
                                <Link
                                    href="/agendamentos"
                                    className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium"
                                >
                                    Meus Agendamentos
                                </Link>
                                {user.role === 'ADMIN' && (
                                    <Link
                                        href="/admin"
                                        className="text-gray-300 hover:text-yellow-500 transition-colors text-sm font-medium flex items-center gap-2"
                                    >
                                        <Settings size={18} />
                                        Administração
                                    </Link>
                                )}
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-400 text-sm">
                                        Olá, <span className="text-yellow-500 font-semibold">{user.name}</span>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                        aria-label="Sair"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-gray-300 hover:text-yellow-500"
                        aria-label="Menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 space-y-3" role="navigation">
                        {!user ? (
                            <>
                                <Link
                                    href="/#servicos"
                                    className="block text-gray-300 hover:text-yellow-500 py-2 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Serviços
                                </Link>
                                <Link
                                    href="/login"
                                    className="block text-gray-300 hover:text-yellow-500 py-2 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/register"
                                    className="block bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Cadastrar
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="text-gray-400 text-sm py-2">
                                    Olá, <span className="text-yellow-500 font-semibold">{user.name}</span>
                                </div>
                                <Link
                                    href="/agendar"
                                    className="block text-gray-300 hover:text-yellow-500 py-2 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Agendar
                                </Link>
                                <Link
                                    href="/agendamentos"
                                    className="block text-gray-300 hover:text-yellow-500 py-2 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Meus Agendamentos
                                </Link>
                                {user.role === 'ADMIN' && (
                                    <Link
                                        href="/admin"
                                        className="block text-gray-300 hover:text-yellow-500 py-2 transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Administração
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="block text-red-500 hover:text-red-600 py-2 transition-colors w-full text-left"
                                >
                                    Sair
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    )
}