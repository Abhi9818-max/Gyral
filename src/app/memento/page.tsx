"use client";

import { useUserData, LifeEvent } from '@/context/user-data-context';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Skull, ArrowLeft, Calendar, Settings, Plus, Star, Flag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SettingsModal } from '@/components/modals/settings-modal';
import { AddLifeEventModal } from '@/components/modals/add-life-event-modal';

export default function MementoPage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                isOpen={selectedId !== null}
                onClose={() => setSelectedId(null)}
                weekIndex={selectedId || 0}
                birthDate={birthDate || new Date().toISOString()}
            />
        </main>
    );
}
