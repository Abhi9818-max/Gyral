const fs = require('fs');

// Patch user-data-context.tsx
let ctx = fs.readFileSync('src/context/user-data-context.tsx', 'utf8');

ctx = ctx.replace(
`    lifeEvents: LifeEvent[];
    addLifeEvent: (event: Omit<LifeEvent, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    deleteLifeEvent: (id: string) => Promise<void>;`,
`    lifeEvents: LifeEvent[];
    addLifeEvent: (event: Omit<LifeEvent, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    updateLifeEvent: (id: string, updates: Partial<LifeEvent>) => Promise<void>;
    deleteLifeEvent: (id: string) => Promise<void>;`
);

ctx = ctx.replace(
`    const deleteLifeEvent = async (id: string) => {
        const { error } = await supabase.from('life_events').delete().match({ id });
        if (!error) {
            setLifeEvents(prev => prev.filter(e => e.id !== id));
        }
    };`,
`    const deleteLifeEvent = async (id: string) => {
        const { error } = await supabase.from('life_events').delete().match({ id });
        if (!error) {
            setLifeEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    const updateLifeEvent = async (id: string, updates: Partial<LifeEvent>) => {
        const { error } = await supabase.from('life_events').update(updates).match({ id });
        if (!error) {
            setLifeEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        } else {
            console.error("Error updating life event:", error);
        }
    };`
);

ctx = ctx.replace(
`restoreData, birthDate, setBirthDate: updateBirthDate, showStatsCard, toggleStatsCard, theme, setTheme, language, setLanguage, user, lifeEvents, addLifeEvent, deleteLifeEvent,`,
`restoreData, birthDate, setBirthDate: updateBirthDate, showStatsCard, toggleStatsCard, theme, setTheme, language, setLanguage, user, lifeEvents, addLifeEvent, updateLifeEvent, deleteLifeEvent,`
);

ctx = ctx.replace(
`export type NavItemKey = 'world' | 'ritual' | 'bank' | 'watch' | 'arena' | 'notes' | 'messages' | 'pacts' | 'memento' | 'citadel';`,
`export type NavItemKey = 'world' | 'ritual' | 'bank' | 'watch' | 'arena' | 'notes' | 'messages' | 'pacts' | 'memento' | 'citadel' | 'goals';`
);

ctx = ctx.replace(
`    { key: 'arena', label: 'Arena', icon: 'Sword' },
    { key: 'notes', label: 'Notes', icon: 'ClipboardList', href: '/notes' },`,
`    { key: 'arena', label: 'Arena', icon: 'Sword' },
    { key: 'goals', label: 'Goals', icon: 'Flag', href: '/goals' },
    { key: 'notes', label: 'Notes', icon: 'ClipboardList', href: '/notes' },`
);

fs.writeFileSync('src/context/user-data-context.tsx', ctx);


// Patch header.tsx
let header = fs.readFileSync('src/components/header.tsx', 'utf8');

header = header.replace(
`          <Link href="/memento" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Skull className="w-4 h-4 group-hover:text-accent transition-colors" /> <span className="relative">Memento <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent group-hover:w-full transition-all duration-300" /></span>
          </Link>`,
`          <Link href="/memento" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Skull className="w-4 h-4 group-hover:text-accent transition-colors" /> <span className="relative">Memento <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent group-hover:w-full transition-all duration-300" /></span>
          </Link>

          <Link href="/goals" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Flag className="w-4 h-4 group-hover:text-blue-500 transition-colors" /> <span className="relative">Goals <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 group-hover:w-full transition-all duration-300" /></span>
          </Link>`
);

// Desktop dropdown
header = header.replace(
`                    <a href="/feed" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>👻</span>
                      <span class="text-white font-medium">Feed</span>
                    </a>`,
`                    <a href="/feed" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>👻</span>
                      <span class="text-white font-medium">Feed</span>
                    </a>
                    <a href="/goals" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🎯</span>
                      <span class="text-white font-medium">Goals</span>
                    </a>`
);

// Mobile menu
header = header.replace(
`                    <button id="arena-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-accent">⚔️</span>
                      <span class="text-white font-medium">Arena</span>
                    </button>`,
`                    <button id="arena-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-accent">⚔️</span>
                      <span class="text-white font-medium">Arena</span>
                    </button>
                    <a href="/goals" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🎯</span>
                      <span class="text-white font-medium">Goals</span>
                    </a>`
);

// We need to import Flag in header.tsx if it's not imported
if (!header.includes('Flag,')) {
    header = header.replace('import { Flame, Plus, Shield, Bell, MessageCircle, Settings, LogOut, CheckCircle2, ChevronRight, Users, Eye, Target, Map, Globe, Skull, ClipboardList, ScrollText } from \'lucide-react\';',
    'import { Flame, Plus, Shield, Bell, MessageCircle, Settings, LogOut, CheckCircle2, ChevronRight, Users, Eye, Target, Map, Globe, Skull, ClipboardList, ScrollText, Flag } from \'lucide-react\';');
}

fs.writeFileSync('src/components/header.tsx', header);
console.log('Patch complete.');
