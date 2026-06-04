const fs = require('fs');
let header = fs.readFileSync('src/components/header.tsx', 'utf8');

// 1. Add Trophy to imports
if (!header.includes('Trophy,')) {
    header = header.replace('import { Flame, Plus, Shield, Bell, MessageCircle, Settings, LogOut, CheckCircle2, ChevronRight, Users, Eye, Target, Map, Globe, Skull, ClipboardList, ScrollText, Flag } from \\'lucide-react\\';',
    'import { Flame, Plus, Shield, Bell, MessageCircle, Settings, LogOut, CheckCircle2, ChevronRight, Users, Eye, Target, Map, Globe, Skull, ClipboardList, ScrollText, Flag, Trophy } from \\'lucide-react\\';');
}

// 2. Add to desktop nav
header = header.replace(
`          <Link href="/goals" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Flag className="w-4 h-4 group-hover:text-blue-500 transition-colors" /> <span className="relative">Goals <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 group-hover:w-full transition-all duration-300" /></span>
          </Link>`,
`          <Link href="/goals" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Flag className="w-4 h-4 group-hover:text-blue-500 transition-colors" /> <span className="relative">Goals <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 group-hover:w-full transition-all duration-300" /></span>
          </Link>

          <Link href="/achievements" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Trophy className="w-4 h-4 group-hover:text-amber-500 transition-colors" /> <span className="relative">Achievements <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-amber-500 group-hover:w-full transition-all duration-300" /></span>
          </Link>`
);

// 3. Add to desktop dropdown and mobile menu
header = header.replaceAll(
`                    <a href="/goals" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🎯</span>
                      <span class="text-white font-medium">Goals</span>
                    </a>`,
`                    <a href="/goals" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🎯</span>
                      <span class="text-white font-medium">Goals</span>
                    </a>
                    <a href="/achievements" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🏆</span>
                      <span class="text-white font-medium">Achievements</span>
                    </a>`
);

fs.writeFileSync('src/components/header.tsx', header);
console.log('Header patched.');
