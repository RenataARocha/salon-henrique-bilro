'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, LogOut, Calendar, Settings, List } from 'lucide-react'
import Logo from './Logo'

export default function Navbar() {
    const { data: session } = useSession()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogout = () => {
        signOut({ callbackUrl: '/' })
    }

    const user = session?.user

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-charcoal/95 backdrop-blur-md shadow-lg' : 'bg-charcoal/90 backdrop-blur-sm'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Logo variant="header" />

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="/#home" className="text-white hover-gold transition-colors text-sm font-medium">
                            Home
                        </a>
                        <a href="/#sobre" className="text-white hover-gold transition-colors text-sm font-medium">
                            Sobre
                        </a>
                        <a href="/#servicos" className="text-white hover-gold transition-colors text-sm font-medium">
                            Serviços
                        </a>
                        <a href="/#localizacao" className="text-white hover-gold transition-colors text-sm font-medium">
                            Localização
                        </a>

                        {!user ? (
                            <>
                                <a href="/login" className="text-white hover-gold transition-colors text-sm font-medium">
                                    Login
                                </a>
                                <a href="/register" className="bg-gradient-gold text-white px-6 py-2.5 rounded-md hover:shadow-lg transition-all text-sm font-semibold">
                                    Cadastrar
                                </a>
                            </>
                        ) : (
                            <>
                                <a href="/agendar" className="text-white hover-gold transition-colors text-sm font-medium flex items-center gap-2">
                                    <Calendar size={16} />
                                    Agendar
                                </a>
                                <a href="/meus-agendamentos" className="text-white hover-gold transition-colors text-sm font-medium flex items-center gap-2">
                                    <List size={16} />
                                    Meus Agendamentos
                                </a>
                                <a href="/historico" className="text-white hover-gold transition-colors text-sm font-medium">
                                    Histórico
                                </a>
                                {user.role === 'ADMIN' && (
                                    <a href="/admin" className="text-white hover-gold transition-colors text-sm font-medium flex items-center gap-2">
                                        <Settings size={16} />
                                        Admin
                                    </a>
                                )}
                                <div className="flex items-center gap-3 pl-4 border-l border-gray-500">
                                    <span className="text-white text-sm">
                                        Olá, <span className="text-gold font-semibold">{user.name?.split(' ')[0]}</span>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-white hover:text-red-400 transition-colors"
                                        aria-label="Sair"
                                        title="Sair"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-white hover-gold"
                        aria-label="Menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 space-y-3 border-t border-gray-700 mt-4 pt-4">
                        <a href="/#home" className="block text-white hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                            Home
                        </a>
                        <a href="/#sobre" className="block text-white hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                            Sobre
                        </a>
                        <a href="/#servicos" className="block text-white hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                            Serviços
                        </a>
                        <a href="/#localizacao" className="block text-white hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                            Localização
                        </a>

                        {!user ? (
                            <>
                                <a href="/login" className="block text-white hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                                    Login
                                </a>
                                <a href="/register" className="block bg-gradient-gold text-white px-4 py-2 rounded-md text-center text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>
                                    Cadastrar
                                </a>
                            </>
                        ) : (
                            <>
                                <div className="text-white text-sm py-2 border-b border-gray-700">
                                    Olá, <span className="text-gold font-semibold">{user.name?.split(' ')[0]}</span>
                                </div>
                                <a href="/agendar" className="block text-white hover-gold py-2 text-sm flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                                    <Calendar size={16} />
                                    Agendar
                                </a>
                                <a href="/meus-agendamentos" className="block text-white hover-gold py-2 text-sm flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                                    <List size={16} />
                                    Meus Agendamentos
                                </a>
                                <a href="/historico" className="block text-white hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                                    Histórico
                                </a>
                                {user.role === 'ADMIN' && (
                                    <a href="/admin" className="block text-white hover-gold py-2 text-sm flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                                        <Settings size={16} />
                                        Admin
                                    </a>
                                )}
                                <button
                                    onClick={() => {
                                        handleLogout()
                                        setMobileMenuOpen(false)
                                    }}
                                    className="block text-red-400 py-2 w-full text-left text-sm flex items-center gap-2"
                                >
                                    <LogOut size={16} />
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