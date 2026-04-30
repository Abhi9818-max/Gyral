"use client";

import dynamic from "next/dynamic";

const StreakSuccessModal = dynamic(() => import("@/components/modals/streak-success-modal").then(mod => mod.StreakSuccessModal), { ssr: false });
const StreakLossModal = dynamic(() => import("@/components/modals/streak-loss-modal").then(mod => mod.StreakLossModal), { ssr: false });
const MissedVowModal = dynamic(() => import("@/components/modals/missed-vow-modal").then(mod => mod.MissedVowModal), { ssr: false });
const ArtifactUnlockModal = dynamic(() => import("@/components/modals/artifact-unlock-modal").then(mod => mod.ArtifactUnlockModal), { ssr: false });

export function HomeModals() {
    return (
        <>
            <StreakSuccessModal />
            <StreakLossModal />
            <MissedVowModal />
            <ArtifactUnlockModal />
        </>
    );
}
