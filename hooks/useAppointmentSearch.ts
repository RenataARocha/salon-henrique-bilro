// hooks/useAppointmentSearch.ts

import { useState, useCallback } from 'react'
import { FilterParams } from '@/components/admin/SearchAndFilters'

interface Appointment {
    id: string
    date: string
    time: string
    status: string
    notes?: string
    user: {
        id: string
        name: string
        email: string
        phone?: string
        image?: string
    }
    service: {
        name: string
        price: number
        duration: number
    }
}

interface Stats {
    total: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
    totalValue: number
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
}

interface UseAppointmentSearchReturn {
    appointments: Appointment[]
    stats: Stats
    pagination: PaginationInfo
    loading: boolean
    error: string | null
    search: (filters: FilterParams, page?: number) => Promise<void>
    refresh: () => Promise<void>
}

export function useAppointmentSearch(): UseAppointmentSearchReturn {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [stats, setStats] = useState<Stats>({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        totalValue: 0
    })
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastFilters, setLastFilters] = useState<FilterParams>({
        searchTerm: '',
        services: [],
        statuses: [],
        dateRange: { start: null, end: null, preset: 'all' },
        timeOfDay: [],
        paymentMethods: [],
        sortBy: 'date',
        sortOrder: 'desc'
    })

    const search = useCallback(async (filters: FilterParams, page: number = 1) => {
        try {
            setLoading(true)
            setError(null)
            setLastFilters(filters)

            const response = await fetch('/api/admin/appointments/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...filters,
                    page,
                    limit: 20
                })
            })

            if (!response.ok) {
                throw new Error('Erro ao buscar agendamentos')
            }

            const data = await response.json()

            if (data.success) {
                setAppointments(data.data.appointments)
                setStats(data.data.stats)
                setPagination(data.data.pagination)
            } else {
                throw new Error(data.message || 'Erro ao buscar agendamentos')
            }
        } catch (err) {
            console.error('Erro na busca:', err)
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
            setAppointments([])
        } finally {
            setLoading(false)
        }
    }, [])

    const refresh = useCallback(async () => {
        await search(lastFilters, pagination.page)
    }, [search, lastFilters, pagination.page])

    return {
        appointments,
        stats,
        pagination,
        loading,
        error,
        search,
        refresh
    }
}