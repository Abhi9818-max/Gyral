"use client";

import { useUserData } from "@/context/user-data-context";
import { OnboardingModal } from "./modals/onboarding-modal";

export function OnboardingWrapper() {
    const { onboardingCompleted, user, profile } = useUserData();

    // Don't show anything until profile is loaded to prevent flash
    if (user && !profile) {
        return null; // Still loading profile data
    }

    // Only show onboarding if user is logged in and hasn't completed it
    const showOnboarding = user && profile && !onboardingCompleted;

    return <OnboardingModal isOpen={!!showOnboarding} />;
}
