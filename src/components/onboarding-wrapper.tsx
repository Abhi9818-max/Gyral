"use client";

import { useUserData } from "@/context/user-data-context";
import { OnboardingModal } from "./modals/onboarding-modal";
import { NotificationPermissionModal } from "./modals/notification-permission-modal";
import { useState, useEffect } from "react";

export function OnboardingWrapper() {
    const { onboardingCompleted, user, profile } = useUserData();

    // Don't show anything until profile is loaded to prevent flash
    if (user && !profile) {
        return null; // Still loading profile data
    }

    // Only show onboarding if user is logged in and hasn't completed it
    const showOnboarding = user && profile && !onboardingCompleted;

    const [showNotificationModal, setShowNotificationModal] = useState(false);

    useEffect(() => {
        // Show notification modal if:
        // 1. User is fully onboarded
        // 2. User hasn't made a choice yet (check localStorage)
        // 3. User hasn't already granted permissions (native check)
        if (onboardingCompleted && user) {
            const hasChoice = localStorage.getItem('diogenes-notification-choice');
            if (!hasChoice && Notification.permission === 'default') {
                // Small delay to not overwhelm immediately after loading
                const timer = setTimeout(() => setShowNotificationModal(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [onboardingCompleted, user]);

    return (
        <>
            <OnboardingModal isOpen={!!showOnboarding} />
            <NotificationPermissionModal
                isOpen={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
            />
        </>
    );
}
