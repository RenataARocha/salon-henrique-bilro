// app/(dashboard)/admin/financeiro/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import { motion } from 'framer-motion';


export default function FinanceiroPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (!session || session.user.role !== 'ADMIN') {
            router.push('/login');
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!session || session.user.role !== 'ADMIN') {
        return null;
    }

    return (
        <motion.div
            className="min-h-screen bg-gray-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Navegação */}
                <motion.div
                    className="mb-6 justify-end flex gap-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-lg hover:shadow-lg transition-all font-semibold border-2 border-gray-200"
                    >

                        <ArrowLeft size={20} />
                        Painel
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                        <Home size={20} />
                        Voltar ao início
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div
                    className="bg-white rounded-lg shadow-sm p-6 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        💰 Dashboard Financeiro
                    </h1>
                    <p className="text-gray-600">
                        Visão completa da saúde financeira do salão
                    </p>
                </motion.div>

                {/* Dashboard */}
                <FinancialDashboard />
            </div>
        </motion.div >
    );
}