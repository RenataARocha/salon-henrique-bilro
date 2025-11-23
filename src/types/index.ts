import { User, Service, Appointment } from '@prisma/client'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: string
        }
    }

    interface User {
        role: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: string
        id: string
    }
}

export interface RegisterFormData {
    name: string
    email: string
    password: string
    phone?: string
}

export interface LoginFormData {
    email: string
    password: string
}

export interface ServiceFormData {
    name: string
    description: string
    price: number
    duration: number
}

export interface AppointmentFormData {
    serviceId: string
    date: string
    time: string
    notes?: string
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface AppointmentWithRelations extends Appointment {
    user: User
    service: Service
}

export interface UserWithAppointments extends User {
    appointments: Appointment[]
}

export type { User, Service, Appointment }