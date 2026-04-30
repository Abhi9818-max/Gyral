import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatsCard } from '../components/stats-card';

// Mock the user data context
vi.mock('@/context/user-data-context', () => ({
  useUserData: () => ({
    records: {
      '2026-04-30': [{ taskId: 'test-1' }, { taskId: 'test-2' }],
    },
    activeFilterTaskId: null,
    showStatsCard: true,
    getTaskAnalytics: vi.fn(),
  })
}));

describe('StatsCard Component', () => {
  it('renders correctly and shows the total for the last 30 days', () => {
    render(<StatsCard />);
    
    // We expect "Total Last 30 Days" text
    expect(screen.getByText('Total Last 30 Days')).toBeInTheDocument();
    
    // We expect the count to be 2
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // We expect it to say "across all tasks"
    expect(screen.getByText(/across all tasks/i)).toBeInTheDocument();
  });
});
