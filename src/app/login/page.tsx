
import { LoginForm } from "./login-form";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string; error: string }>
}) {
    const params = await searchParams
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md p-8 backdrop-blur-3xl bg-black/40 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-2">
                        GYRAL
                    </h1>
                    <p className="text-zinc-500 text-sm tracking-widest uppercase">
                        Identify Yourself
                    </p>
                </div>

                <LoginForm message={params?.message} error={params?.error} />

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                        Protected by the Order
                    </p>
                </div>
            </div >
        </div >
    )
}
