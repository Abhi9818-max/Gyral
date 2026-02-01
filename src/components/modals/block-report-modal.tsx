"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Ban, Flag } from 'lucide-react';

interface BlockReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

export function BlockReportModal({ isOpen, onClose, userId, userName }: BlockReportModalProps) {
    const [action, setAction] = useState<'block' | 'report' | null>(null);
    const [reportType, setReportType] = useState<'harassment' | 'spam' | 'inappropriate' | 'other'>('harassment');
    const [reportContent, setReportContent] = useState('');
    const [blockReason, setBlockReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const supabase = createClient();

    const handleBlock = async () => {
        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('blocked_users')
                .insert({
                    blocker_id: user.id,
                    blocked_id: userId,
                    reason: blockReason.trim() || null
                });

            // Also remove friendship if exists
            await supabase
                .from('friendships')
                .delete()
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

            alert(`${userName} has been blocked`);
            onClose();
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Failed to block user');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReport = async () => {
        if (!reportContent.trim()) {
            alert('Please provide details about the report');
            return;
        }

        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('reports')
                .insert({
                    reporter_id: user.id,
                    reported_id: userId,
                    type: reportType,
                    content: reportContent.trim()
                });

            alert('Report submitted successfully');
            onClose();
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/20 rounded-2xl w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {action ? (action === 'block' ? 'Block User' : 'Report User') : 'User Actions'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!action ? (
                        <div className="space-y-3">
                            <p className="text-sm text-zinc-400 mb-4">
                                Choose an action for <span className="font-bold text-white">{userName}</span>
                            </p>

                            <button
                                onClick={() => setAction('block')}
                                className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-3"
                            >
                                <Ban className="w-5 h-5 text-red-500" />
                                <div className="text-left">
                                    <div className="font-bold text-white">Block User</div>
                                    <div className="text-xs text-zinc-400">They won't be able to message you</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setAction('report')}
                                className="w-full p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors flex items-center gap-3"
                            >
                                <Flag className="w-5 h-5 text-orange-500" />
                                <div className="text-left">
                                    <div className="font-bold text-white">Report User</div>
                                    <div className="text-xs text-zinc-400">Report inappropriate behavior</div>
                                </div>
                            </button>
                        </div>
                    ) : action === 'block' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-sm text-red-200">
                                    <strong>{userName}</strong> will no longer be able to:
                                </p>
                                <ul className="text-xs text-red-300 mt-2 ml-4 space-y-1">
                                    <li>• Send you messages</li>
                                    <li>• See your profile or activities</li>
                                    <li>• Send you friend requests</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Why are you blocking this user?"
                                    rows={3}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors placeholder:text-zinc-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAction(null)}
                                    className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlock}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? 'Blocking...' : 'Block User'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Report Type
                                </label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value as any)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
                                >
                                    <option value="harassment">Harassment</option>
                                    <option value="spam">Spam</option>
                                    <option value="inappropriate">Inappropriate Content</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Details *
                                </label>
                                <textarea
                                    value={reportContent}
                                    onChange={(e) => setReportContent(e.target.value)}
                                    placeholder="Please describe what happened..."
                                    rows={4}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors placeholder:text-zinc-500 resize-none"
                                />
                            </div>

                            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-xs text-blue-200">
                                    Reports are reviewed by our team. Thank you for helping keep the community safe.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAction(null)}
                                    className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReport}
                                    disabled={isProcessing || !reportContent.trim()}
                                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
