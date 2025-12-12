// middleware.ts (na raiz do projeto)

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const isAuth = !!token
        const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
            req.nextUrl.pathname.startsWith('/register')
        const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
        const isAgendarPage = req.nextUrl.pathname.startsWith('/agendar')

        // Se está em página de auth e já logado, redirecionar
        if (isAuthPage && isAuth) {
            if (token.role === 'ADMIN') {
                return NextResponse.redirect(new URL('/admin', req.url))
            }
            return NextResponse.redirect(new URL('/agendar', req.url))
        }

        // Se tentar acessar /admin sem ser admin
        if (isAdminPage && token?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/agendar', req.url))
        }

        // Se admin tentar acessar /agendar, redirecionar para /admin
        if (isAgendarPage && token?.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                    req.nextUrl.pathname.startsWith('/register') ||
                    req.nextUrl.pathname.startsWith('/forgot-password') ||
                    req.nextUrl.pathname.startsWith('/reset-password')

                // Páginas de auth são públicas
                if (isAuthPage) return true

                // Outras páginas precisam de autenticação
                return !!token
            },
        },
    }
)

export const config = {
    matcher: [
        '/admin/:path*',
        '/agendar/:path*',
        '/meus-agendamentos/:path*',
        '/perfil/:path*',
        '/login',
        '/register'
    ],
}