export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-yellow-600 mb-4">
          HENRIQUE BILRO
        </h1>
        <p className="text-2xl text-gray-600 mb-8">CABELEIREIROS</p>
        <p className="text-gray-500 mb-12">Sistema de agendamento online</p>

        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/login"
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Entrar
          </a>
          <a
            href="/register"
            className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 transition"
          >
            Cadastrar
          </a>
        </div>

        <div className="mt-16 space-y-2 text-sm text-gray-500">
          <p>✅ Backend configurado com Supabase</p>
          <p>✅ Prisma ORM + PostgreSQL</p>
          <p>✅ NextAuth para autenticação</p>
          <p className="text-green-600 font-semibold mt-4">Sistema funcionando!</p>
        </div>
      </div>
    </div>
  )
}