import { LifeEvent } from '@/context/user-data-context';
import { format, parseISO } from 'date-fns';

type CardType = 'goals' | 'achievements';

export const downloadAestheticCard = async (
    items: LifeEvent[],
    type: CardType,
    filename: string
) => {
    const DPR = 2;
    const W = 720;
    const HERO_H = 460;
    const ITEM_H = 66;
    const ITEM_GAP = 10;
    const INFO_H = 150;
    const FOOTER_H = 100;
    const RADIUS = 36;
    const PADDING = 32;

    const count = Math.max(items.length, 1);
    const LIST_H = count * (ITEM_H + ITEM_GAP) + 24;
    const H = HERO_H + INFO_H + LIST_H + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(DPR, DPR);

    const isGoals = type === 'goals';

    // ── Color System ────────────────────────────────────────────────────────
    const CARD_BG     = '#18181b';
    const HERO_BG1    = isGoals ? '#1e1b4b' : '#1c1300';
    const HERO_BG2    = isGoals ? '#312e81' : '#292100';
    const HERO_BG3    = isGoals ? '#0ea5e9' : '#92400e';
    const ACCENT_A    = isGoals ? '#818cf8' : '#fbbf24';
    const ACCENT_B    = isGoals ? '#38bdf8' : '#34d399';
    const ACCENT_GLOW = isGoals ? '#4f46e5' : '#b45309';

    // ── Outer card clip ──────────────────────────────────────────────────────
    ctx.save();
    roundRectPath(ctx, 0, 0, W, H, RADIUS);
    ctx.clip();

    // ── Card Base Background ─────────────────────────────────────────────────
    ctx.fillStyle = CARD_BG;
    ctx.fillRect(0, 0, W, H);

    // ═══════════════════════════════════════════════════════════
    // HERO SECTION
    // ═══════════════════════════════════════════════════════════
    {
        ctx.save();
        roundRectPath(ctx, 0, 0, W, HERO_H, RADIUS);
        ctx.clip();

        // Hero base gradient
        const heroGrad = ctx.createLinearGradient(0, 0, W, HERO_H);
        heroGrad.addColorStop(0, HERO_BG1);
        heroGrad.addColorStop(0.5, HERO_BG2);
        heroGrad.addColorStop(1, HERO_BG1);
        ctx.fillStyle = heroGrad;
        ctx.fillRect(0, 0, W, HERO_H);

        // Large glow orb top-center
        const orb1 = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, W * 0.8);
        orb1.addColorStop(0, ACCENT_A + '55');
        orb1.addColorStop(0.4, ACCENT_A + '22');
        orb1.addColorStop(1, 'transparent');
        ctx.fillStyle = orb1;
        ctx.fillRect(0, 0, W, HERO_H);

        // Bottom-right accent glow
        const orb2 = ctx.createRadialGradient(W * 0.85, HERO_H * 0.85, 0, W * 0.85, HERO_H * 0.85, W * 0.6);
        orb2.addColorStop(0, HERO_BG3 + '55');
        orb2.addColorStop(0.5, HERO_BG3 + '18');
        orb2.addColorStop(1, 'transparent');
        ctx.fillStyle = orb2;
        ctx.fillRect(0, 0, W, HERO_H);

        // Fine dot grid on hero
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let x = 30; x < W; x += 30) {
            for (let y = 30; y < HERO_H; y += 30) {
                ctx.beginPath();
                ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Horizontal shimmer lines
        for (let i = 0; i < 4; i++) {
            const ly = HERO_H * (0.25 + i * 0.18);
            const lGrad = ctx.createLinearGradient(0, ly, W, ly);
            lGrad.addColorStop(0, 'transparent');
            lGrad.addColorStop(0.3, ACCENT_A + '14');
            lGrad.addColorStop(0.7, ACCENT_B + '14');
            lGrad.addColorStop(1, 'transparent');
            ctx.strokeStyle = lGrad;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, ly);
            ctx.lineTo(W, ly);
            ctx.stroke();
        }

        // Big glowing center ring
        const ringCX = W / 2;
        const ringCY = HERO_H * 0.48;
        const ringR = 100;
        for (let i = 3; i >= 1; i--) {
            ctx.beginPath();
            ctx.arc(ringCX, ringCY, ringR + i * 22, 0, Math.PI * 2);
            const alpha = ['18', '10', '08'][i - 1];
            ctx.strokeStyle = ACCENT_A + alpha;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Gradient circle fill
        const circleGrad = ctx.createLinearGradient(
            ringCX - ringR, ringCY - ringR,
            ringCX + ringR, ringCY + ringR
        );
        circleGrad.addColorStop(0, ACCENT_A + 'ee');
        circleGrad.addColorStop(1, ACCENT_B + 'cc');
        ctx.beginPath();
        ctx.arc(ringCX, ringCY, ringR, 0, Math.PI * 2);
        ctx.fillStyle = circleGrad;
        ctx.fill();

        // Inner highlight on circle
        const innerLight = ctx.createRadialGradient(
            ringCX - 30, ringCY - 30, 0,
            ringCX, ringCY, ringR
        );
        innerLight.addColorStop(0, 'rgba(255,255,255,0.35)');
        innerLight.addColorStop(0.6, 'rgba(255,255,255,0.05)');
        innerLight.addColorStop(1, 'transparent');
        ctx.fillStyle = innerLight;
        ctx.beginPath();
        ctx.arc(ringCX, ringCY, ringR, 0, Math.PI * 2);
        ctx.fill();

        // Emoji centered in circle
        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isGoals ? '🎯' : '🏆', ringCX, ringCY);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Bottom gradient fade into card
        const fadeGrad = ctx.createLinearGradient(0, HERO_H - 80, 0, HERO_H);
        fadeGrad.addColorStop(0, 'transparent');
        fadeGrad.addColorStop(1, CARD_BG);
        ctx.fillStyle = fadeGrad;
        ctx.fillRect(0, HERO_H - 80, W, 80);

        // ── Overlay pill (bottom-left of hero) ──────────────────────────────
        const pillText = `${items.length} ${isGoals ? (items.length === 1 ? 'Goal' : 'Goals') : (items.length === 1 ? 'Achievement' : 'Achievements')}`;
        ctx.font = '700 17px -apple-system, "Helvetica Neue", sans-serif';
        ctx.letterSpacing = '0.5px';
        const pillW = ctx.measureText(pillText).width + 44;
        const pillH = 42;
        const pillX = 24;
        const pillY = HERO_H - pillH - 28;

        // Pill glass bg
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(pillText, pillX + 22, pillY + pillH / 2 + 6);
        ctx.letterSpacing = '0px';

        // ── Top-right circle button ──────────────────────────────────────────
        const btnCX = W - 28 - 24;
        const btnCY = 28 + 24;
        ctx.beginPath();
        ctx.arc(btnCX, btnCY, 24, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.50)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.20)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Arrow icon
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(btnCX - 8, btnCY + 8);
        ctx.lineTo(btnCX + 8, btnCY - 8);
        ctx.moveTo(btnCX - 2, btnCY - 8);
        ctx.lineTo(btnCX + 8, btnCY - 8);
        ctx.lineTo(btnCX + 8, btnCY + 2);
        ctx.stroke();
        ctx.lineCap = 'butt';

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // INFO ROW (below hero)
    // ═══════════════════════════════════════════════════════════
    {
        const infoY = HERO_H + 10;

        // Left: Title + subtitle
        ctx.font = '800 32px -apple-system, "Helvetica Neue", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(isGoals ? 'Active Pursuits' : 'Hall of Legends', PADDING, infoY + 38);

        ctx.font = '400 16px -apple-system, "Helvetica Neue", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText(isGoals ? 'My Goals' : 'My Achievements', PADDING, infoY + 64);

        // Right: flower icon + level text + progress bar
        const rightX = W - PADDING - 220;

        // Flower / star badge
        ctx.font = '20px sans-serif';
        ctx.fillText(isGoals ? '🎯' : '⭐', rightX, infoY + 36);

        ctx.font = '600 15px -apple-system, "Helvetica Neue", sans-serif';
        ctx.fillStyle = ACCENT_A;
        ctx.fillText(
            isGoals ? `${items.length} in progress` : `${items.length} conquered`,
            rightX + 30, infoY + 36
        );

        // Progress bar
        const barX = rightX;
        const barY = infoY + 50;
        const barW = 220;
        const barH = 8;

        // Bar track
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, barH / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fill();

        // Bar fill
        const fillPct = Math.min(items.length / 10, 1); // 10 = "full"
        const fillGrad = ctx.createLinearGradient(barX, barY, barX + barW * fillPct, barY);
        fillGrad.addColorStop(0, ACCENT_A);
        fillGrad.addColorStop(1, ACCENT_B);
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * fillPct, barH, barH / 2);
        ctx.fillStyle = fillGrad;
        ctx.fill();
    }

    // ── Divider ──────────────────────────────────────────────────────────────
    const divY = HERO_H + INFO_H - 10;
    const divGrad = ctx.createLinearGradient(PADDING, divY, W - PADDING, divY);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.3, 'rgba(255,255,255,0.15)');
    divGrad.addColorStop(0.7, 'rgba(255,255,255,0.15)');
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, divY);
    ctx.lineTo(W - PADDING, divY);
    ctx.stroke();

    // ═══════════════════════════════════════════════════════════
    // ITEMS LIST
    // ═══════════════════════════════════════════════════════════
    {
        const listStartY = HERO_H + INFO_H + 8;

        if (items.length === 0) {
            ctx.font = 'italic 18px -apple-system, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.textAlign = 'center';
            ctx.fillText('No items yet.', W / 2, listStartY + 50);
            ctx.textAlign = 'left';
        } else {
            items.forEach((item, i) => {
                const yTop = listStartY + i * (ITEM_H + ITEM_GAP);
                const itemX = PADDING;
                const itemW = W - PADDING * 2;

                // Item glass background
                ctx.beginPath();
                ctx.roundRect(itemX, yTop, itemW, ITEM_H, 16);
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.07)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Left accent bar gradient
                const barGrad = ctx.createLinearGradient(itemX, yTop, itemX, yTop + ITEM_H);
                barGrad.addColorStop(0, ACCENT_A);
                barGrad.addColorStop(1, ACCENT_B);
                ctx.beginPath();
                ctx.roundRect(itemX, yTop, 4, ITEM_H, [16, 0, 0, 16]);
                ctx.fillStyle = barGrad;
                ctx.fill();

                // Item number
                const numCX = itemX + 28;
                const numCY = yTop + ITEM_H / 2;
                ctx.beginPath();
                ctx.arc(numCX, numCY, 16, 0, Math.PI * 2);
                ctx.fillStyle = ACCENT_A + '22';
                ctx.fill();
                ctx.strokeStyle = ACCENT_A + '44';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.font = '700 13px -apple-system, sans-serif';
                ctx.fillStyle = ACCENT_A;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(i + 1), numCX, numCY);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';

                // Title
                const titleX = itemX + 54;
                const maxTW = itemW - 54 - 130;
                ctx.font = '600 18px -apple-system, "Helvetica Neue", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(truncateText(ctx, item.title, maxTW), titleX, yTop + 28);

                // Date
                let dateStr = '';
                try { dateStr = format(parseISO(item.event_date), 'MMM d, yyyy'); }
                catch { dateStr = ''; }
                ctx.font = '400 13px -apple-system, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.38)';
                ctx.fillText(dateStr, titleX, yTop + 50);

                // Status pill (right)
                const pillLabel = isGoals ? 'In Progress' : 'Conquered';
                ctx.font = '600 12px -apple-system, sans-serif';
                ctx.letterSpacing = '0.5px';
                const pillW2 = ctx.measureText(pillLabel).width + 24;
                const pillX2 = itemX + itemW - pillW2 - 12;
                const pillY2 = yTop + ITEM_H / 2 - 13;
                ctx.beginPath();
                ctx.roundRect(pillX2, pillY2, pillW2, 26, 13);
                ctx.fillStyle = isGoals ? 'rgba(99,102,241,0.18)' : 'rgba(251,191,36,0.18)';
                ctx.fill();
                ctx.strokeStyle = isGoals ? 'rgba(129,140,248,0.35)' : 'rgba(251,191,36,0.35)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = ACCENT_A;
                ctx.fillText(pillLabel, pillX2 + 12, pillY2 + 17);
                ctx.letterSpacing = '0px';
            });
        }
    }

    // ── Second divider before footer ─────────────────────────────────────────
    const div2Y = HERO_H + INFO_H + LIST_H + 10;
    const div2Grad = ctx.createLinearGradient(PADDING, div2Y, W - PADDING, div2Y);
    div2Grad.addColorStop(0, 'transparent');
    div2Grad.addColorStop(0.3, 'rgba(255,255,255,0.12)');
    div2Grad.addColorStop(0.7, 'rgba(255,255,255,0.12)');
    div2Grad.addColorStop(1, 'transparent');
    ctx.strokeStyle = div2Grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, div2Y);
    ctx.lineTo(W - PADDING, div2Y);
    ctx.stroke();

    // ═══════════════════════════════════════════════════════════
    // FOOTER (like S.I.G.I.L. in reference)
    // ═══════════════════════════════════════════════════════════
    {
        const footerCY = div2Y + FOOTER_H / 2;

        ctx.font = '800 22px -apple-system, "Helvetica Neue", sans-serif';
        ctx.letterSpacing = '6px';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        ctx.fillText('G Y R A L', W / 2, footerCY - 4);

        ctx.font = '400 14px -apple-system, sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillStyle = 'rgba(255,255,255,0.30)';
        ctx.fillText(isGoals ? 'System of Personal Growth' : 'Hall of Legends', W / 2, footerCY + 22);
        ctx.letterSpacing = '0px';
        ctx.textAlign = 'left';
    }

    ctx.restore(); // card clip

    // ── Download ─────────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

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
