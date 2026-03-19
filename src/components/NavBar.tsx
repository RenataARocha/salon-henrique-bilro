'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, LogOut, Calendar, Settings, List } from 'lucide-react'
import Logo from './Logo'
import { motion } from 'framer-motion'
import NotificationBell from './NotificationBell'

export default function Navbar() {
    const { data: session } = useSession()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = () => signOut({ callbackUrl: '/' })

    const user = session?.user
    const isAdmin = user?.role === 'ADMIN'

    return (
        <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0aec] border-b border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex-shrink-0"
                    >
                        <Logo variant="header" />
                    </motion.div>

                    {/* Desktop Menu — só aparece em telas grandes o suficiente */}
                    <motion.div
                        className="hidden lg:flex items-center gap-5 xl:gap-8"
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <a href="/#home" className="text-white hover-gold tracking-wide transition-colors text-sm font-medium whitespace-nowrap">Home</a>
                        <a href="/#sobre" className="text-white hover-gold tracking-wide transition-colors text-sm font-medium whitespace-nowrap">Sobre</a>
                        <a href="/#servicos" className="text-white hover-gold tracking-wide transition-colors text-sm font-medium whitespace-nowrap">Serviços</a>
                        <a href="/#localizacao" className="text-white hover-gold tracking-wide transition-colors text-sm font-medium whitespace-nowrap">Localização</a>

                        {!user ? (
                            <>
                                <a href="/login" className="text-white hover-gold transition-colors text-sm font-medium whitespace-nowrap">Login</a>
                                <a href="/register" className="bg-gradient-gold text-white px-5 py-2.5 rounded-md hover:shadow-lg transition-all text-sm font-semibold whitespace-nowrap">
                                    Cadastrar
                                </a>
                            </>
                        ) : (
                            <>
                                {!isAdmin && (
                                    <>
                                        <a href="/agendar" className="text-white hover-gold transition-colors text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                                            <Calendar size={15} />
                                            Agendar
                                        </a>
                                        <a href="/meus-agendamentos" className="text-white hover-gold transition-colors text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                                            <List size={15} />
                                            Meus Agendamentos
                                        </a>
                                    </>
                                )}
                                {isAdmin && (
                                    <a href="/admin" className="text-white hover-gold transition-colors text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
                                        <Settings size={15} />
                                        Admin
                                    </a>
                                )}

                                <div className="flex items-center gap-3 pl-4 border-l border-white/15">
                                    <span className="text-white text-sm whitespace-nowrap">
                                        Olá, <span className="text-gold font-semibold">{user.name?.split(' ')[0]}</span>
                                    </span>
                                    {isAdmin && <NotificationBell />}
                                    <button
                                        onClick={handleLogout}
                                        className="text-white/60 hover:text-red-400 transition-colors"
                                        aria-label="Sair"
                                        title="Sair"
                                    >
                                        <LogOut size={17} />
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Hamburguer — aparece abaixo de lg */}
                    <motion.button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden text-white hover-gold p-1"
                        aria-label="Menu"
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </motion.button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="lg:hidden pb-5 space-y-1 border-t border-white/8 mt-2 pt-4"
                    >
                        {/* Links principais */}
                        {[
                            { href: '/#home', label: 'Home' },
                            { href: '/#sobre', label: 'Sobre' },
                            { href: '/#servicos', label: 'Serviços' },
                            { href: '/#localizacao', label: 'Localização' },
                        ].map(({ href, label }) => (
                            <a
                                key={href}
                                href={href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center text-white/70 hover:text-white hover-gold py-2.5 px-2 rounded-lg hover:bg-white/4 text-sm transition-all"
                            >
                                {label}
                            </a>
                        ))}

                        <div className="border-t border-white/8 my-2" />

                        {!user ? (
                            <>
                                <a href="/login" onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center text-white/70 hover:text-white hover-gold py-2.5 px-2 rounded-lg hover:bg-white/4 text-sm transition-all">
                                    Login
                                </a>
                                <a href="/register" onClick={() => setMobileMenuOpen(false)}
                                    className="block bg-gradient-gold text-white px-4 py-3 rounded-lg text-center text-sm font-semibold mt-2">
                                    Cadastrar
                                </a>
                            </>
                        ) : (
                            <>
                                {/* Saudação */}
                                <div className="px-2 py-2 text-sm text-white/50">
                                    Olá, <span className="text-gold font-semibold">{user.name?.split(' ')[0]}</span>
                                </div>

                                {!isAdmin && (
                                    <>
                                        <a href="/agendar" onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-2 text-white/70 hover:text-white hover-gold py-2.5 px-2 rounded-lg hover:bg-white/4 text-sm transition-all">
                                            <Calendar size={15} className="text-gold" />
                                            Agendar
                                        </a>
                                        <a href="/meus-agendamentos" onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-2 text-white/70 hover:text-white hover-gold py-2.5 px-2 rounded-lg hover:bg-white/4 text-sm transition-all">
                                            <List size={15} className="text-gold" />
                                            Meus Agendamentos
                                        </a>
                                    </>
                                )}

                                {isAdmin && (
                                    <a href="/admin" onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-2 text-white/70 hover:text-white hover-gold py-2.5 px-2 rounded-lg hover:bg-white/4 text-sm transition-all">
                                        <Settings size={15} className="text-gold" />
                                        Admin
                                    </a>
                                )}

                                <div className="border-t border-white/8 mt-2 pt-2">
                                    <button
                                        onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                                        className="flex items-center gap-2 text-red-400/80 hover:text-red-400 py-2.5 px-2 rounded-lg hover:bg-red-950/30 w-full text-sm transition-all"
                                    >
                                        <LogOut size={15} />
                                        Sair
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.nav>
    )
}