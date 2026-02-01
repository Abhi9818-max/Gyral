"use client";

import { useEffect, useRef } from 'react';

interface SigilProps {
    score: number; // 0 to 100
    size?: number;
    className?: string;
}

export function Sigil({ score, size = 64, className = "" }: SigilProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvas setup
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        let animationFrameId: number;
        let rotation = 0;

        // Generative Parameters based on Score
        // Low score (0-30): Simple, faint, slow
        // Med score (30-70): Moderate complexity, brighter
        // High score (70-100): Complex, glowing, fast, energetic

        const speed = 0.005 + (score / 100) * 0.04;
        const complexity = 3 + Math.floor((score / 100) * 5); // 3 to 8 sides/points
        const bloom = 5 + (score / 100) * 20; // Blur amount
        const colorIntensity = 0.3 + (score / 100) * 0.7; // Opacity base

        // Dynamic Color: Shift from Grey/Blue -> Purple -> Gold/White based on score
        const getStrokeStyle = (t: number) => {
            if (score < 30) return `rgba(100, 116, 139, ${colorIntensity})`; // Slate
            if (score < 70) return `rgba(168, 85, 247, ${colorIntensity})`; // Purple
            return `rgba(255, 255, 255, ${colorIntensity})`; // White/bright
        };

        const render = () => {
            ctx.clearRect(0, 0, size, size);

            const cx = size / 2;
            const cy = size / 2;
            const radius = (size / 2) * 0.7; // Leave room for glow

            rotation += speed;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);

            // GLOW EFFECT
            ctx.shadowBlur = bloom;
            ctx.shadowColor = getStrokeStyle(0);

            // DRAW SHAPE
            ctx.beginPath();
            ctx.strokeStyle = getStrokeStyle(0);
            ctx.lineWidth = 1.5 + (score / 100);

            // Procedural Polygon/Star
            const points = complexity;
            const innerRadius = radius * (0.3 + (Math.sin(Date.now() * 0.002) * 0.1 * (score / 100))); // Breathing effect

            for (let i = 0; i <= points * 2; i++) {
                const r = i % 2 === 0 ? radius : innerRadius;
                const a = (Math.PI * 2 * i) / (points * 2);
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            // INNER DETAILS (High Score Only)
            if (score > 50) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${colorIntensity * 0.5})`;
                ctx.lineWidth = 1;
                ctx.arc(0, 0, innerRadius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }

            // PARTICLES (Very High Score)
            if (score > 80) {
                const pCount = 4;
                for (let i = 0; i < pCount; i++) {
                    const pa = rotation * -2 + (Math.PI * 2 * i) / pCount;
                    const px = Math.cos(pa) * (radius * 1.2);
                    const py = Math.sin(pa) * (radius * 1.2);
                    ctx.fillStyle = "#fff";
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [score, size]);

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <canvas ref={canvasRef} className="w-full h-full" style={{ width: size, height: size }} />
            {/* Tooltip or overlay could go here */}
        </div>
    );
}
