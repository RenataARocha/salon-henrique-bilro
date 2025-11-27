'use client'

import { useState, useEffect } from 'react'
import { Menu, X, LogOut, Calendar, Settings } from 'lucide-react'
import Logo from './Logo'

interface NavbarProps {
    user?: {
        name: string
        role: string
    } | null
}

export default function Navbar({ user }: NavbarProps) {
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
        window.location.href = '/api/auth/signout'
    }

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/20 backdrop-blur-md shadow-lg' : 'bg-black/70 backdrop-blur-sm'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Logo variant="header" />

                    <div className="hidden md:flex items-center space-x-8">
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
                                <a href="/agendar" className="text-charcoal hover-gold transition-colors text-sm font-medium flex items-center gap-2">
                                    <Calendar size={16} />
                                    Agendar
                                </a>
                                <a href="/agendamentos" className="text-charcoal hover-gold transition-colors text-sm font-medium">
                                    Agendamentos
                                </a>
                                {user.role === 'ADMIN' && (
                                    <a href="/admin" className="text-charcoal hover-gold transition-colors text-sm font-medium flex items-center gap-2">
                                        <Settings size={16} />
                                        Admin
                                    </a>
                                )}
                                <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
                                    <span className="text-charcoal text-sm">
                                        <span className="text-gold font-semibold">{user.name}</span>
                                    </span>
                                    <button onClick={handleLogout} className="text-charcoal hover:text-red-500 transition-colors" aria-label="Sair">
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-charcoal hover-gold" aria-label="Menu">
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 space-y-3 border-t border-gray-200 mt-4 pt-4">
                        <a href="/#sobre" className="block text-charcoal hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                            Sobre
                        </a>
                        <a href="/#servicos" className="block text-charcoal hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                            Serviços
                        </a>
                        <a href="/#localizacao" className="block text-charcoal hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                            Localização
                        </a>

                        {!user ? (
                            <>
                                <a href="/login" className="block text-charcoal hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                                    Login
                                </a>
                                <a href="/register" className="block bg-gradient-gold text-white px-4 py-2 rounded-md text-center text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>
                                    Cadastrar
                                </a>
                            </>
                        ) : (
                            <>
                                <div className="text-charcoal text-sm py-2">
                                    Olá, <span className="text-gold font-semibold">{user.name}</span>
                                </div>
                                <a href="/agendar" className="block text-charcoal hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                                    Agendar
                                </a>
                                <a href="/agendamentos" className="block text-charcoal hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                                    Agendamentos
                                </a>
                                {user.role === 'ADMIN' && (
                                    <a href="/admin" className="block text-charcoal hover-gold py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>
                                        Admin
                                    </a>
                                )}
                                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block text-red-500 py-2 w-full text-left text-sm">
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