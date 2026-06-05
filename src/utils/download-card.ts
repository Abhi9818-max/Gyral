import { LifeEvent } from '@/context/user-data-context';
import { format, parseISO } from 'date-fns';

type CardType = 'goals' | 'achievements';

export const downloadAestheticCard = async (
    items: LifeEvent[],
    type: CardType,
    filename: string
) => {
    const DPR = 2;
    const W = 800;
    const PADDING = 56;
    const isGoals = type === 'goals';

    // ── Pinterest Palette ──────────────────────────────────────────────────
    // Goals:       warm terracotta / dusty rose / cream
    // Achievements: rich chocolate / antique gold / warm ivory
    const BG_DARK    = isGoals ? '#110b09' : '#0d0900';
    const BG_MID     = isGoals ? '#1c110d' : '#150e03';
    const ORB_A      = isGoals ? '#8b3a2a' : '#7a5018';  // terracotta / dark gold
    const ORB_B      = isGoals ? '#6b2d3e' : '#5c3a10';  // dusty plum / chocolate
    const ACCENT     = isGoals ? '#d4a090' : '#d4aa6a';  // dusty rose / antique gold
    const ACCENT2    = isGoals ? '#a05060' : '#b88a40';  // muted rose / warm gold
    const TEXT_MAIN  = '#f5f0e8';                         // warm cream
    const TEXT_SUB   = isGoals ? '#c4a49a' : '#c4a86a';  // warm muted
    const TEXT_DIM   = 'rgba(245,240,232,0.35)';
    const ITEM_BG    = isGoals ? 'rgba(139,58,42,0.08)' : 'rgba(122,80,24,0.10)';
    const ITEM_BDR   = isGoals ? 'rgba(212,160,144,0.15)' : 'rgba(212,170,106,0.18)';
    const BAR_A      = isGoals ? '#d4a090' : '#d4aa6a';
    const BAR_B      = isGoals ? '#a05060' : '#8b6020';

    const ITEM_H  = 80;
    const ITEM_GAP = 14;
    const HERO_H  = 440;
    const INFO_H  = 130;
    const LIST_H  = Math.max(items.length, 1) * (ITEM_H + ITEM_GAP) + 20;
    const FOOTER_H = 110;
    const H = HERO_H + INFO_H + LIST_H + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(DPR, DPR);

    // ── Full card clipping with soft radius ────────────────────────────────
    ctx.save();
    cardClip(ctx, 0, 0, W, H, 28);

    // ═══════════════════════════════════════════════════════
    // BACKGROUND
    // ═══════════════════════════════════════════════════════
    // Deep warm background
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.6, H);
    bgGrad.addColorStop(0, BG_DARK);
    bgGrad.addColorStop(0.6, BG_MID);
    bgGrad.addColorStop(1, BG_DARK);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Warm glow top-left
    const gl1 = ctx.createRadialGradient(W * 0.15, H * 0.1, 0, W * 0.15, H * 0.1, W * 0.7);
    gl1.addColorStop(0, ORB_A + '40');
    gl1.addColorStop(0.45, ORB_A + '18');
    gl1.addColorStop(1, 'transparent');
    ctx.fillStyle = gl1;
    ctx.fillRect(0, 0, W, H);

    // Warm glow bottom-right
    const gl2 = ctx.createRadialGradient(W * 0.88, H * 0.88, 0, W * 0.88, H * 0.88, W * 0.65);
    gl2.addColorStop(0, ORB_B + '45');
    gl2.addColorStop(0.45, ORB_B + '18');
    gl2.addColorStop(1, 'transparent');
    ctx.fillStyle = gl2;
    ctx.fillRect(0, 0, W, H);

    // Grain / film noise overlay
    addGrain(ctx, W, H, 0.038);

    // ═══════════════════════════════════════════════════════
    // HERO SECTION — warm editorial art
    // ═══════════════════════════════════════════════════════
    {
        ctx.save();
        // Slightly tinted hero zone
        const heroZone = ctx.createLinearGradient(0, 0, W, HERO_H);
        heroZone.addColorStop(0, ORB_A + '28');
        heroZone.addColorStop(0.5, 'transparent');
        heroZone.addColorStop(1, ORB_B + '18');
        ctx.fillStyle = heroZone;
        ctx.fillRect(0, 0, W, HERO_H);

        // Organic arch shape (like a decorative moon / frame)
        drawOrganicFrame(ctx, W, HERO_H, ACCENT + '20', ACCENT2 + '15');

        // Large elegant text as hero element
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.font = `900 200px Georgia, serif`;
        ctx.fillStyle = ACCENT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isGoals ? '◎' : '✦', W / 2, HERO_H * 0.46);
        ctx.restore();

        // Central glowing ring
        const cx = W / 2, cy = HERO_H * 0.46;
        const rings = [100, 72, 48];
        rings.forEach((r, i) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = ACCENT + ['30', '22', '18'][i];
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Inner filled circle
        const circGrad = ctx.createRadialGradient(cx - 18, cy - 18, 0, cx, cy, 48);
        circGrad.addColorStop(0, ACCENT + 'ee');
        circGrad.addColorStop(0.6, ACCENT2 + 'cc');
        circGrad.addColorStop(1, ORB_A + 'aa');
        ctx.beginPath();
        ctx.arc(cx, cy, 48, 0, Math.PI * 2);
        ctx.fillStyle = circGrad;
        ctx.fill();
        // Inner highlight
        const ihl = ctx.createRadialGradient(cx - 16, cy - 16, 0, cx, cy, 48);
        ihl.addColorStop(0, 'rgba(255,255,255,0.3)');
        ihl.addColorStop(1, 'transparent');
        ctx.fillStyle = ihl;
        ctx.fill();
        // Emoji
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isGoals ? '🎯' : '🏆', cx, cy + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Decorative fine lines (horizontal etching)
        for (let i = 0; i < 6; i++) {
            const ly = HERO_H * 0.74 + i * 8;
            const lg = ctx.createLinearGradient(PADDING, ly, W - PADDING, ly);
            lg.addColorStop(0, 'transparent');
            lg.addColorStop(0.35, ACCENT + '28');
            lg.addColorStop(0.65, ACCENT + '28');
            lg.addColorStop(1, 'transparent');
            ctx.strokeStyle = lg;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(PADDING, ly);
            ctx.lineTo(W - PADDING, ly);
            ctx.stroke();
        }

        // Bottom vignette fade into card bg
        const vig = ctx.createLinearGradient(0, HERO_H - 100, 0, HERO_H);
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, BG_MID + 'ff');
        ctx.fillStyle = vig;
        ctx.fillRect(0, HERO_H - 100, W, 100);

        // HERO TITLE — large editorial type
        ctx.font = `300 16px Georgia, "Times New Roman", serif`;
        ctx.fillStyle = TEXT_SUB;
        ctx.letterSpacing = '5px';
        ctx.textAlign = 'center';
        ctx.fillText(isGoals ? 'ACTIVE PURSUITS' : 'HALL OF LEGENDS', W / 2, HERO_H * 0.80);

        ctx.font = `700 52px Georgia, "Times New Roman", serif`;
        ctx.letterSpacing = '-1px';
        ctx.fillStyle = TEXT_MAIN;
        ctx.fillText(isGoals ? 'My Goals' : 'My Victories', W / 2, HERO_H * 0.80 + 60);

        ctx.textAlign = 'left';
        ctx.letterSpacing = '0px';

        // Small item count badge (bottom-left, frosted)
        const badge = `${items.length} ${isGoals ? (items.length === 1 ? 'goal' : 'goals') : (items.length === 1 ? 'triumph' : 'triumphs')}`;
        ctx.font = `600 15px -apple-system, "Helvetica Neue", sans-serif`;
        const bW = ctx.measureText(badge).width + 36;
        const bH = 38;
        const bX = PADDING;
        const bY = HERO_H - bH - 20;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, bH / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fill();
        ctx.strokeStyle = ACCENT + '40';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = TEXT_MAIN;
        ctx.fillText(badge, bX + 18, bY + 25);

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════
    // INFO ROW
    // ═══════════════════════════════════════════════════════
    {
        const iy = HERO_H + 18;

        // Left: title + caption
        ctx.font = `700 28px Georgia, serif`;
        ctx.fillStyle = TEXT_MAIN;
        ctx.fillText(isGoals ? 'Active Pursuits' : 'Legendary Triumphs', PADDING, iy + 32);

        ctx.font = `400 14px -apple-system, sans-serif`;
        ctx.fillStyle = TEXT_DIM;
        ctx.letterSpacing = '0.5px';
        ctx.fillText(isGoals ? 'Commitments in motion' : 'Victories carved in stone', PADDING, iy + 58);
        ctx.letterSpacing = '0px';

        // Right: count + warm bar
        const bX = W - PADDING - 200;
        ctx.font = `700 13px -apple-system, sans-serif`;
        ctx.fillStyle = ACCENT;
        ctx.letterSpacing = '1px';
        ctx.textAlign = 'right';
        ctx.fillText(
            isGoals ? `${items.length} IN PROGRESS` : `${items.length} CONQUERED`,
            W - PADDING, iy + 32
        );
        ctx.letterSpacing = '0px';
        ctx.textAlign = 'left';

        // Progress bar
        const barY = iy + 48;
        const barW = 200;
        ctx.beginPath();
        ctx.roundRect(bX, barY, barW, 5, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();

        const fillW = barW * Math.min(items.length / 10, 1);
        const barGrad = ctx.createLinearGradient(bX, barY, bX + fillW, barY);
        barGrad.addColorStop(0, BAR_A);
        barGrad.addColorStop(1, BAR_B);
        ctx.beginPath();
        ctx.roundRect(bX, barY, fillW, 5, 3);
        ctx.fillStyle = barGrad;
        ctx.fill();
    }

    // ── Elegant divider ─────────────────────────────────────────────────────
    const divY = HERO_H + INFO_H - 4;
    const dg = ctx.createLinearGradient(PADDING, divY, W - PADDING, divY);
    dg.addColorStop(0, 'transparent');
    dg.addColorStop(0.5, ACCENT + '35');
    dg.addColorStop(1, 'transparent');
    ctx.strokeStyle = dg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, divY);
    ctx.lineTo(W - PADDING, divY);
    ctx.stroke();

    // ═══════════════════════════════════════════════════════
    // ITEMS LIST
    // ═══════════════════════════════════════════════════════
    {
        const listY0 = HERO_H + INFO_H + 8;
        if (items.length === 0) {
            ctx.font = 'italic 18px Georgia, serif';
            ctx.fillStyle = TEXT_DIM;
            ctx.textAlign = 'center';
            ctx.fillText('Nothing yet. The page is blank.', W / 2, listY0 + 55);
            ctx.textAlign = 'left';
        } else {
            items.forEach((item, i) => {
                const yT = listY0 + i * (ITEM_H + ITEM_GAP);
                const iW = W - PADDING * 2;

                // Glass card bg
                ctx.beginPath();
                ctx.roundRect(PADDING, yT, iW, ITEM_H, 14);
                ctx.fillStyle = ITEM_BG;
                ctx.fill();
                ctx.strokeStyle = ITEM_BDR;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Inner top shimmer
                const shim = ctx.createLinearGradient(PADDING, yT, PADDING, yT + 2);
                shim.addColorStop(0, 'rgba(255,255,255,0.07)');
                shim.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.roundRect(PADDING, yT, iW, 2, [14, 14, 0, 0]);
                ctx.fillStyle = shim;
                ctx.fill();

                // Left accent bar gradient
                const lb = ctx.createLinearGradient(PADDING, yT, PADDING, yT + ITEM_H);
                lb.addColorStop(0, BAR_A);
                lb.addColorStop(1, BAR_B);
                ctx.beginPath();
                ctx.roundRect(PADDING, yT, 4, ITEM_H, [14, 0, 0, 14]);
                ctx.fillStyle = lb;
                ctx.fill();

                // Number
                const nCX = PADDING + 30, nCY = yT + ITEM_H / 2;
                ctx.beginPath();
                ctx.arc(nCX, nCY, 15, 0, Math.PI * 2);
                ctx.fillStyle = ACCENT + '22';
                ctx.fill();
                ctx.strokeStyle = ACCENT + '50';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.font = '600 13px -apple-system, sans-serif';
                ctx.fillStyle = ACCENT;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(i + 1), nCX, nCY);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';

                // Title
                const tx = PADDING + 58;
                const maxTW = iW - 58 - 120;
                ctx.font = `600 19px Georgia, "Times New Roman", serif`;
                ctx.fillStyle = TEXT_MAIN;
                ctx.fillText(truncate(ctx, item.title, maxTW), tx, yT + 31);

                // Date
                let ds = '';
                try { ds = format(parseISO(item.event_date), 'MMM d, yyyy'); } catch { ds = ''; }
                ctx.font = '400 13px -apple-system, sans-serif';
                ctx.fillStyle = TEXT_DIM;
                ctx.fillText(ds, tx, yT + 56);

                // Status pill right
                const pl = isGoals ? 'Ongoing' : 'Done ✦';
                ctx.font = '600 12px -apple-system, sans-serif';
                const pW = ctx.measureText(pl).width + 24;
                const pX = PADDING + iW - pW - 10;
                const pY = yT + ITEM_H / 2 - 13;
                ctx.beginPath();
                ctx.roundRect(pX, pY, pW, 26, 13);
                ctx.fillStyle = ACCENT + '1a';
                ctx.fill();
                ctx.strokeStyle = ACCENT + '38';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = ACCENT;
                ctx.fillText(pl, pX + 12, pY + 17);
            });
        }
    }

    // ── Second divider ───────────────────────────────────────────────────────
    const d2Y = HERO_H + INFO_H + LIST_H + 8;
    const dg2 = ctx.createLinearGradient(PADDING, d2Y, W - PADDING, d2Y);
    dg2.addColorStop(0, 'transparent');
    dg2.addColorStop(0.5, ACCENT + '28');
    dg2.addColorStop(1, 'transparent');
    ctx.strokeStyle = dg2;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, d2Y);
    ctx.lineTo(W - PADDING, d2Y);
    ctx.stroke();

    // ═══════════════════════════════════════════════════════
    // FOOTER — like S.I.G.I.L.
    // ═══════════════════════════════════════════════════════
    {
        const fY = d2Y + FOOTER_H / 2 + 10;
        ctx.font = `800 20px Georgia, serif`;
        ctx.letterSpacing = '8px';
        ctx.fillStyle = 'rgba(245,240,232,0.75)';
        ctx.textAlign = 'center';
        ctx.fillText('G Y R A L', W / 2, fY - 4);

        ctx.font = `300 13px -apple-system, "Helvetica Neue", sans-serif`;
        ctx.letterSpacing = '2px';
        ctx.fillStyle = TEXT_DIM;
        ctx.fillText(isGoals ? 'System of Personal Growth' : 'Hall of Legends', W / 2, fY + 22);
        ctx.letterSpacing = '0px';
        ctx.textAlign = 'left';
    }

    ctx.restore();

    // ── Download ─────────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cardClip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
    ctx.clip();
}

function drawOrganicFrame(ctx: CanvasRenderingContext2D, W: number, H: number, stroke1: string, stroke2: string) {
    // Decorative arc at the top — like an editorial arch shape
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.05, W * 0.75, 0, Math.PI);
    ctx.strokeStyle = stroke1;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(W / 2, H * 0.05, W * 0.58, 0, Math.PI);
    ctx.strokeStyle = stroke2;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
}

function addGrain(ctx: CanvasRenderingContext2D, W: number, H: number, intensity: number) {
    // Lightweight film grain using tiny random dots
    const imageData = ctx.getImageData(0, 0, W * 2, H * 2);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity * 255;
        data[i]     = Math.min(255, Math.max(0, data[i]     + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (ctx.measureText(t + '…').width > maxW && t.length > 0) t = t.slice(0, -1);
    return t + '…';
}
