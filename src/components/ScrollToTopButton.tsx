// src/components/ScrollToTopButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            // Mostra o botão quando rolar mais de 300px
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)

        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    if (!isVisible) return null

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 z-40 group"
            aria-label="Voltar ao topo"
        >
            <div className="relative">
                {/* Círculo pulsante de fundo */}
                <div className="absolute inset-0 bg-gold rounded-full animate-ping opacity-75" />

                {/* Botão */}
                <div className="relative bg-gradient-to-br from-gold to-yellow-600 text-white p-3 rounded-full shadow-2xl hover:from-yellow-600 hover:to-gold transition-all duration-300 hover:scale-110">
                    <ArrowUp className="w-6 h-6" />
                </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    ⬆️ Voltar ao topo
                    <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
            </div>
        </button>
    )
}