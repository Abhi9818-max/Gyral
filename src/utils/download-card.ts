import { LifeEvent } from '@/context/user-data-context';
import { format, parseISO } from 'date-fns';

type CardType = 'goals' | 'achievements';

export const downloadAestheticCard = async (
    items: LifeEvent[],
    type: CardType,
    filename: string
) => {
    const W = 900;
    const HEADER_H = 280;
    const ITEM_H = 130;
    const FOOTER_H = 120;
    const GAP = 24;
    const PADDING = 64;
    const totalItems = items.length > 0 ? items.length : 1;
    const H = HEADER_H + totalItems * (ITEM_H + GAP) + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2); // retina

    const isGoals = type === 'goals';
    const accentColor = isGoals ? '#3b82f6' : '#f59e0b';
    const accentLight = isGoals ? '#60a5fa' : '#fcd34d';
    const accentGlow = isGoals ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)';

    // ── Background ──────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#09090b');
    bgGrad.addColorStop(0.5, '#18181b');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Glowing orb - top left
    const orb1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 400);
    orb1.addColorStop(0, accentGlow);
    orb1.addColorStop(1, 'transparent');
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, W, H);

    // Glowing orb - bottom right
    const orb2 = ctx.createRadialGradient(W, H, 0, W, H, 500);
    orb2.addColorStop(0, accentGlow);
    orb2.addColorStop(1, 'transparent');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, W, H);

    // Subtle dot grid
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 32; x < W; x += 32) {
        for (let y = 32; y < H; y += 32) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Border glow ─────────────────────────────────────────────────────────
    ctx.strokeStyle = isGoals ? 'rgba(59,130,246,0.25)' : 'rgba(245,158,11,0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

    // ── Header - Gyral logo ──────────────────────────────────────────────────
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.letterSpacing = '6px';
    ctx.fillText('GYRAL', PADDING, 56);

    // Pill badge
    const badge = isGoals ? 'ACTIVE PURSUITS' : 'LEGENDARY TRIUMPHS';
    ctx.font = 'bold 13px sans-serif';
    const badgeW = ctx.measureText(badge).width + 36;
    const badgeX = W - PADDING - badgeW;
    roundRect(ctx, badgeX, 32, badgeW, 34, 17);
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = accentColor + '25';
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillText(badge, badgeX + 18, 54);

    // ── Hero icon circle ────────────────────────────────────────────────────
    const cx = W / 2;
    const cy = 160;
    const r = 56;

    // Glow behind circle
    const iconGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
    iconGlow.addColorStop(0, accentColor + '55');
    iconGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = iconGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Circle background
    const circleGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    circleGrad.addColorStop(0, accentLight);
    circleGrad.addColorStop(1, accentColor);
    ctx.fillStyle = circleGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Icon text in circle
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isGoals ? '◎' : '★', cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // ── Title ────────────────────────────────────────────────────────────────
    ctx.font = 'bold 42px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(isGoals ? 'Active Pursuits' : 'Hall of Legends', cx, 252);
    ctx.textAlign = 'left';

    // ── Divider ──────────────────────────────────────────────────────────────
    const divY = HEADER_H - 20;
    const divGrad = ctx.createLinearGradient(PADDING, divY, W - PADDING, divY);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, divY);
    ctx.lineTo(W - PADDING, divY);
    ctx.stroke();

    // ── Items ────────────────────────────────────────────────────────────────
    if (items.length === 0) {
        ctx.font = 'italic 20px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('No items yet.', cx, HEADER_H + 80);
        ctx.textAlign = 'left';
    } else {
        items.forEach((item, i) => {
            const yTop = HEADER_H + i * (ITEM_H + GAP);
            const cardH = ITEM_H;

            // Card background
            roundRect(ctx, PADDING, yTop, W - PADDING * 2, cardH, 20);
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Left accent bar
            roundRect(ctx, PADDING, yTop, 4, cardH, [2, 0, 0, 2]);
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Goal title
            ctx.font = 'bold 22px sans-serif';
            ctx.fillStyle = '#ffffff';
            const titleX = PADDING + 28;
            const titleY = yTop + 44;
            const maxTitleW = W - PADDING * 2 - 28 - 100;
            const truncated = truncateText(ctx, item.title, maxTitleW);
            ctx.fillText(truncated, titleX, titleY);

            // Date
            ctx.font = '16px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            let dateStr = '';
            try {
                dateStr = format(parseISO(item.event_date), 'MMM d, yyyy');
            } catch { dateStr = item.event_date; }
            ctx.fillText(dateStr, titleX, titleY + 36);

            // Checkmark / circle icon
            const iconX = W - PADDING - 48;
            const iconY = yTop + cardH / 2;
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(iconX, iconY, 16, 0, Math.PI * 2);
            ctx.stroke();
            if (!isGoals) {
                // checkmark
                ctx.strokeStyle = accentColor;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(iconX - 8, iconY);
                ctx.lineTo(iconX - 2, iconY + 7);
                ctx.lineTo(iconX + 8, iconY - 7);
                ctx.stroke();
            }
        });
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = HEADER_H + totalItems * (ITEM_H + GAP) + 20;
    const footDivGrad = ctx.createLinearGradient(PADDING, footerY, W - PADDING, footerY);
    footDivGrad.addColorStop(0, 'transparent');
    footDivGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    footDivGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = footDivGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, footerY);
    ctx.lineTo(W - PADDING, footerY);
    ctx.stroke();

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.letterSpacing = '4px';
    ctx.textAlign = 'center';
    ctx.fillText('FORGED IN THE HALL OF LEGENDS', cx, footerY + 50);
    ctx.textAlign = 'left';

    // ── Trigger download ─────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
};

// Helpers
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
    let truncated = text;
    while (ctx.measureText(truncated + '…').width > maxW && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
    }
    return truncated + '…';
}
