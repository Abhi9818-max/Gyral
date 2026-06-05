import { LifeEvent } from '@/context/user-data-context';
import { format, parseISO } from 'date-fns';

type CardType = 'goals' | 'achievements';

export const downloadAestheticCard = async (
    items: LifeEvent[],
    type: CardType,
    filename: string
) => {
    const DPR = 2; // Retina
    const W = 1080;
    const PADDING = 72;
    const HEADER_H = 320;
    const ITEM_H = 110;
    const ITEM_GAP = 18;
    const FOOTER_H = 130;
    const count = Math.max(items.length, 1);
    const H = HEADER_H + count * (ITEM_H + ITEM_GAP) + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(DPR, DPR);

    const isGoals = type === 'goals';

    // ─── Color Palettes ──────────────────────────────────────────────────────
    // Goals: deep indigo → violet → blue
    // Achievements: rich deep gold → amber → emerald
    const bg1 = isGoals ? '#0a0a1a' : '#0d0a00';
    const bg2 = isGoals ? '#0f0f2e' : '#110900';
    const bg3 = isGoals ? '#0a0a1a' : '#0d0a00';
    const orb1Color = isGoals ? '#4f46e5' : '#b45309';
    const orb2Color = isGoals ? '#7c3aed' : '#065f46';
    const accentA = isGoals ? '#818cf8' : '#fbbf24'; // soft indigo / gold
    const accentB = isGoals ? '#c084fc' : '#f59e0b';
    const accentC = isGoals ? '#38bdf8' : '#10b981'; // sky / emerald
    const itemBg = isGoals ? 'rgba(99, 102, 241, 0.07)' : 'rgba(251, 191, 36, 0.07)';
    const itemBorder = isGoals ? 'rgba(129, 140, 248, 0.18)' : 'rgba(251, 191, 36, 0.2)';
    const barGradA = isGoals ? '#818cf8' : '#fbbf24';
    const barGradB = isGoals ? '#38bdf8' : '#34d399';

    // ─── Background ──────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.7, H);
    bgGrad.addColorStop(0, bg1);
    bgGrad.addColorStop(0.5, bg2);
    bgGrad.addColorStop(1, bg3);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Glowing orb – top left corner
    const g1 = ctx.createRadialGradient(W * 0.1, H * 0.08, 0, W * 0.1, H * 0.08, W * 0.55);
    g1.addColorStop(0, orb1Color + '38');
    g1.addColorStop(0.5, orb1Color + '14');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    // Glowing orb – bottom right corner
    const g2 = ctx.createRadialGradient(W * 0.92, H * 0.95, 0, W * 0.92, H * 0.95, W * 0.55);
    g2.addColorStop(0, orb2Color + '38');
    g2.addColorStop(0.5, orb2Color + '12');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // Subtle mid-glow
    const g3 = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, W * 0.4);
    g3.addColorStop(0, accentA + '0c');
    g3.addColorStop(1, 'transparent');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    // Fine dot grid
    ctx.fillStyle = 'rgba(255,255,255,0.028)';
    for (let x = 36; x < W; x += 36) {
        for (let y = 36; y < H; y += 36) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Outer glow border
    const borderGrad = ctx.createLinearGradient(0, 0, W, H);
    borderGrad.addColorStop(0, accentA + '55');
    borderGrad.addColorStop(0.5, accentB + '22');
    borderGrad.addColorStop(1, accentC + '55');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, W - 2, H - 2, 0);
    ctx.stroke();

    // ─── Top bar accent line ─────────────────────────────────────────────────
    const topBar = ctx.createLinearGradient(PADDING, 0, W - PADDING, 0);
    topBar.addColorStop(0, 'transparent');
    topBar.addColorStop(0.3, accentA + 'aa');
    topBar.addColorStop(0.7, accentC + 'aa');
    topBar.addColorStop(1, 'transparent');
    ctx.strokeStyle = topBar;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING, 0);
    ctx.lineTo(W - PADDING, 0);
    ctx.stroke();

    // ─── LOGO ────────────────────────────────────────────────────────────────
    ctx.font = '700 16px "Helvetica Neue", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.letterSpacing = '8px';
    ctx.fillText('GYRAL', PADDING, 58);
    ctx.letterSpacing = '0px';

    // Badge pill top-right
    const badgeLabel = isGoals ? 'ACTIVE PURSUITS' : 'LEGENDARY TRIUMPHS';
    ctx.font = '700 13px "Helvetica Neue", sans-serif';
    ctx.letterSpacing = '2px';
    const badgeW = ctx.measureText(badgeLabel).width + 40;
    const badgeX = W - PADDING - badgeW;
    const badgeY = 36;
    const badgeH = 32;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    const badgeFill = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    badgeFill.addColorStop(0, accentA + '22');
    badgeFill.addColorStop(1, accentC + '22');
    ctx.fillStyle = badgeFill;
    ctx.fill();
    ctx.strokeStyle = accentA + '55';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = accentA;
    ctx.fillText(badgeLabel, badgeX + 20, badgeY + 20);
    ctx.letterSpacing = '0px';

    // ─── Icon Circle ─────────────────────────────────────────────────────────
    const iconCX = W / 2;
    const iconCY = 185;
    const iconR = 62;

    // Outer glow ring
    for (let i = 4; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(iconCX, iconCY, iconR + i * 8, 0, Math.PI * 2);
        ctx.strokeStyle = accentA + `${Math.round(14 / i).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Circle gradient fill
    const circleGrad = ctx.createLinearGradient(iconCX - iconR, iconCY - iconR, iconCX + iconR, iconCY + iconR);
    circleGrad.addColorStop(0, accentA + 'dd');
    circleGrad.addColorStop(1, accentC + 'cc');
    ctx.beginPath();
    ctx.arc(iconCX, iconCY, iconR, 0, Math.PI * 2);
    ctx.fillStyle = circleGrad;
    ctx.fill();

    // Inner glow
    const innerGlow = ctx.createRadialGradient(iconCX - 15, iconCY - 15, 0, iconCX, iconCY, iconR);
    innerGlow.addColorStop(0, 'rgba(255,255,255,0.35)');
    innerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(iconCX, iconCY, iconR, 0, Math.PI * 2);
    ctx.fill();

    // Emoji icon
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isGoals ? '🎯' : '🏆', iconCX, iconCY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // ─── Main Title ───────────────────────────────────────────────────────────
    ctx.font = '800 52px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    const titleGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
    titleGrad.addColorStop(0, accentA);
    titleGrad.addColorStop(0.5, '#ffffff');
    titleGrad.addColorStop(1, accentC);
    ctx.fillStyle = titleGrad;
    ctx.fillText(isGoals ? 'Active Pursuits' : 'Hall of Legends', W / 2, 284);
    ctx.textAlign = 'left';

    // ─── Subtitle ────────────────────────────────────────────────────────────
    ctx.font = '400 18px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fillText(
        isGoals ? 'The path to your future legacy' : 'A chronicle of your greatest victories',
        W / 2, 316
    );
    ctx.textAlign = 'left';

    // ─── Divider ─────────────────────────────────────────────────────────────
    const divGrad = ctx.createLinearGradient(PADDING, 0, W - PADDING, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.2, accentA + '66');
    divGrad.addColorStop(0.5, accentC + '88');
    divGrad.addColorStop(0.8, accentA + '66');
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, HEADER_H - 8);
    ctx.lineTo(W - PADDING, HEADER_H - 8);
    ctx.stroke();

    // ─── Items ───────────────────────────────────────────────────────────────
    if (items.length === 0) {
        ctx.font = 'italic 22px "Helvetica Neue", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.textAlign = 'center';
        ctx.fillText('No items yet.', W / 2, HEADER_H + 80);
        ctx.textAlign = 'left';
    } else {
        items.forEach((item, i) => {
            const yTop = HEADER_H + i * (ITEM_H + ITEM_GAP);

            // Card glass bg
            roundRect(ctx, PADDING, yTop, W - PADDING * 2, ITEM_H, 20);
            ctx.fillStyle = itemBg;
            ctx.fill();
            ctx.strokeStyle = itemBorder;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Inner highlight (top edge shimmer)
            const shimmer = ctx.createLinearGradient(PADDING, yTop, PADDING, yTop + 2);
            shimmer.addColorStop(0, 'rgba(255,255,255,0.10)');
            shimmer.addColorStop(1, 'transparent');
            roundRect(ctx, PADDING, yTop, W - PADDING * 2, 2, [20, 20, 0, 0]);
            ctx.fillStyle = shimmer;
            ctx.fill();

            // Left accent gradient bar
            const barGrad = ctx.createLinearGradient(PADDING, yTop, PADDING, yTop + ITEM_H);
            barGrad.addColorStop(0, barGradA);
            barGrad.addColorStop(1, barGradB);
            roundRect(ctx, PADDING, yTop, 5, ITEM_H, [20, 0, 0, 20]);
            ctx.fillStyle = barGrad;
            ctx.fill();

            // Number badge
            const numX = PADDING + 28;
            const numY = yTop + ITEM_H / 2;
            ctx.beginPath();
            ctx.arc(numX, numY, 18, 0, Math.PI * 2);
            const numBgGrad = ctx.createRadialGradient(numX, numY, 0, numX, numY, 18);
            numBgGrad.addColorStop(0, accentA + '40');
            numBgGrad.addColorStop(1, accentA + '15');
            ctx.fillStyle = numBgGrad;
            ctx.fill();
            ctx.strokeStyle = accentA + '55';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.font = '700 14px "Helvetica Neue", sans-serif';
            ctx.fillStyle = accentA;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), numX, numY);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';

            // Goal title
            const titleX = PADDING + 62;
            const titleY = yTop + 44;
            const maxW = W - PADDING * 2 - 62 - 180;
            ctx.font = '700 22px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(truncateText(ctx, item.title, maxW), titleX, titleY);

            // Date
            let dateStr = '';
            try { dateStr = format(parseISO(item.event_date), 'MMM d, yyyy'); }
            catch { dateStr = item.event_date || ''; }
            ctx.font = '400 15px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.38)';
            ctx.fillText('📅  ' + dateStr, titleX, titleY + 30);

            // Status pill (right side)
            const pillLabel = isGoals ? 'In Progress' : 'Conquered';
            ctx.font = '600 13px "Helvetica Neue", sans-serif';
            ctx.letterSpacing = '1px';
            const pillW = ctx.measureText(pillLabel).width + 28;
            const pillX = W - PADDING - pillW - 12;
            const pillY = yTop + ITEM_H / 2 - 14;
            roundRect(ctx, pillX, pillY, pillW, 28, 14);
            ctx.fillStyle = isGoals ? 'rgba(99,102,241,0.2)' : 'rgba(251,191,36,0.2)';
            ctx.fill();
            ctx.strokeStyle = isGoals ? 'rgba(129,140,248,0.4)' : 'rgba(251,191,36,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = isGoals ? '#a5b4fc' : '#fcd34d';
            ctx.fillText(pillLabel, pillX + 14, pillY + 18);
            ctx.letterSpacing = '0px';
        });
    }

    // ─── Footer ──────────────────────────────────────────────────────────────
    const footerY = HEADER_H + count * (ITEM_H + ITEM_GAP) + 30;

    const footDivGrad = ctx.createLinearGradient(PADDING, footerY, W - PADDING, footerY);
    footDivGrad.addColorStop(0, 'transparent');
    footDivGrad.addColorStop(0.3, accentA + '55');
    footDivGrad.addColorStop(0.7, accentC + '55');
    footDivGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = footDivGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, footerY);
    ctx.lineTo(W - PADDING, footerY);
    ctx.stroke();

    // Count badge
    const countLabel = `${items.length} ${isGoals ? (items.length === 1 ? 'Goal' : 'Goals') : (items.length === 1 ? 'Achievement' : 'Achievements')}`;
    ctx.font = '700 15px "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillText(countLabel, W / 2, footerY + 38);

    ctx.font = '500 13px "Helvetica Neue", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillText('FORGED IN THE HALL OF LEGENDS', W / 2, footerY + 68);
    ctx.letterSpacing = '0px';
    ctx.textAlign = 'left';

    // Bottom gradient fade
    const fadeGrad = ctx.createLinearGradient(0, H - 60, 0, H);
    fadeGrad.addColorStop(0, 'transparent');
    fadeGrad.addColorStop(1, bg1 + 'cc');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, H - 60, W, 60);

    // ─── Download ────────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    r: number | [number, number, number, number] = 12
) {
    const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (ctx.measureText(t + '…').width > maxW && t.length > 0) t = t.slice(0, -1);
    return t + '…';
}
