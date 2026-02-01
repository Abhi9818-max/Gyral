export interface LedgerEntry {
    id: string;
    user: string;
    action: string;
    detail: string;
    timestamp: string;
    witnessCount: number;
}

export const MOCK_LEDGER_ENTRIES: LedgerEntry[] = [
    {
        id: '1',
        user: 'Seeker_92',
        action: 'Endured',
        detail: '45 minutes of heavy lifting.',
        timestamp: '2m ago',
        witnessCount: 12
    },
    {
        id: '2',
        user: 'Marcus_A',
        action: 'Reflected',
        detail: 'Journaled on the brevity of life.',
        timestamp: '5m ago',
        witnessCount: 24
    },
    {
        id: '3',
        user: 'Kynic',
        action: 'Abstained',
        detail: 'Resisted impulse. Day 14.',
        timestamp: '12m ago',
        witnessCount: 8
    },
    {
        id: '4',
        user: 'Anon_User',
        action: 'Created',
        detail: 'Deep work session. 2 hours.',
        timestamp: '28m ago',
        witnessCount: 45
    },
    {
        id: '5',
        user: 'Sisyphus_Happy',
        action: 'Repeated',
        detail: 'Morning run. The hill remains.',
        timestamp: '1h ago',
        witnessCount: 156
    },
    {
        id: '6',
        user: 'Diogenes_Fan',
        action: 'Simplified',
        detail: 'Decluttered workspace.',
        timestamp: '2h ago',
        witnessCount: 3
    },
    {
        id: '7',
        user: 'Stoic_Dev',
        action: 'Built',
        detail: 'Shipped a new feature.',
        timestamp: '3h ago',
        witnessCount: 89
    }
];
