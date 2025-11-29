// src/middleware.ts - VERSÃO CORRIGIDA

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // Rotas de admin só para ADMIN
        if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/agendar', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname

                // Permitir acesso às rotas públicas
                if (path.startsWith('/login') || path.startsWith('/register')) {
                    return true
                }

                // Para outras rotas protegidas, exigir token
                return !!token
            }
        }
    }
)

// IMPORTANTE: Especificar APENAS as rotas que precisam de autenticação
export const config = {
    matcher: [
        '/agendar/:path*',
        '/agendamentos/:path*',
        '/admin/:path*',
        '/historico/:path*'
    ]
}