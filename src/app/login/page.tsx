
import { login, signup, signInWithGoogle, continueAsGuest } from './actions'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string; error: string }
}) {
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

                {/* Message / Error */}
                {searchParams?.message && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-lg text-center backdrop-blur-sm">
                        {searchParams.message}
                    </div>
                )}
                {searchParams?.error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center backdrop-blur-sm">
                        {searchParams.error}
                    </div>
                )}

                <form className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 ml-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="initiate@gyral.com"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 ml-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono"
                        />
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <button
                            formAction={login}
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                        >
                            Log In
                        </button>
                        <div className="flex gap-4">
                            <button
                                formAction={signup}
                                className="flex-1 bg-transparent border border-white/20 text-white font-bold py-3 rounded-lg hover:bg-white/5 hover:border-white/40 transition-all text-sm"
                            >
                                Sign Up (Email)
                            </button>
                        </div>
                    </div>
                </form>

                <div className="flex flex-col gap-4">
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-zinc-600 text-[10px] uppercase tracking-widest">Or Authenticate With</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <form>
                        <button
                            formAction={current => {
                                // We need to preventDefault if we were using onSubmit, 
                                // but with formAction on button it submits the form to that action.
                                // However, google button is inside a form with no other inputs?
                                // Ah, the Google button is in its own form in the original code. 
                                // Let's simplify and put this new button in its own form or reuse the google one if appropriate.
                                // The original code has the Google button inside a separate <form>. 
                                // I will add another form for Guest or add it to the Google form. 
                                // Adding a separate form for clarity.
                                signInWithGoogle()
                            }}
                            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg group"
                        >
                            <svg className="w-5 h-5 bg-white rounded-full p-0.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>
                    </form>

                    <form>
                        <button
                            formAction={continueAsGuest}
                            className="w-full bg-transparent border border-white/10 text-zinc-500 hover:text-white font-mono text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-white/5 transition-all"
                        >
                            Continue as Guest
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                        Protected by the Order
                    </p>
                </div>
            </div >
        </div >
    )
}
