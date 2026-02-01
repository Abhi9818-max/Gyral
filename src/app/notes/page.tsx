"use client";

import { useUserData } from "@/context/user-data-context";
import { ArrowLeft, MoreVertical, Plus, Calendar, Clock, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotesPage() {
    const { notes, addNote, updateNote, deleteNote } = useUserData();
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const router = useRouter();

    // Sort notes by updated at descending
    const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const activeNote = notes.find(n => n.id === activeNoteId);

    const handleCreate = () => {
        addNote();
        // After creating, we'll automatically select the newest note
        setTimeout(() => {
            const newest = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
            if (newest) setActiveNoteId(newest.id);
        }, 100);
    };

    const handleBackToList = () => {
        setActiveNoteId(null);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-sans)]">
            {/* Clean Header */}
            <div className="border-b border-white/5 bg-black/95 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => activeNote ? handleBackToList() : router.push('/')}
                            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-semibold">{activeNote ? activeNote.title || 'Untitled Note' : 'Notes'}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {!activeNote && (
                            <button
                                onClick={handleCreate}
                                className="w-9 h-9 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center transition-colors"
                                title="New Note"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                        <button className="w-9 h-9 rounded-full hover:bg-zinc-900 flex items-center justify-center transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 h-[calc(100vh-80px)]">

                {/* Show Note List OR Active Note (Full Screen) */}
                {!activeNote ? (
                    // Note List View
                    <div className="max-w-2xl mx-auto flex flex-col gap-4 h-full">
                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                            {sortedNotes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => setActiveNoteId(note.id)}
                                    className="w-full text-left p-5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 transition-all duration-200"
                                >
                                    <h3 className="font-semibold text-white text-lg mb-2">
                                        {note.title || 'Untitled Note'}
                                    </h3>
                                    <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                                        {note.content || 'No content...'}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                                        <span>{formatDate(note.updatedAt)}</span>
                                        <span>•</span>
                                        <span>{formatTime(note.updatedAt)}</span>
                                    </div>
                                </button>
                            ))}

                            {sortedNotes.length === 0 && (
                                <div className="text-center py-20 text-zinc-600">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    <p className="text-sm">No notes yet</p>
                                    <p className="text-xs text-zinc-700 mt-2">Create your first note to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Full Screen Editor View
                    <div className="max-w-4xl mx-auto h-full flex flex-col">
                        {/* Note Header */}
                        <div className="mb-6">
                            <input
                                type="text"
                                value={activeNote.title}
                                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                                placeholder="Note Title"
                                className="bg-transparent text-3xl font-semibold text-white placeholder:text-zinc-800 focus:outline-none w-full mb-4"
                            />

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-sm text-zinc-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(activeNote.updatedAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(activeNote.updatedAt)}</span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <Clock className="w-4 h-4" />
                                    <span>{activeNote.content.length} characters</span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 mb-6" />

                        {/* Content */}
                        <textarea
                            value={activeNote.content}
                            onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                            placeholder="Start writing..."
                            className="flex-1 bg-transparent resize-none focus:outline-none text-zinc-300 leading-relaxed custom-scrollbar placeholder:text-zinc-800 text-base"
                            autoFocus
                        />

                        {/* Footer */}
                        <div className="flex items-center justify-end pt-4 border-t border-white/5">
                            <button
                                onClick={() => {
                                    if (confirm('Delete this note?')) {
                                        deleteNote(activeNote.id);
                                        setActiveNoteId(null);
                                    }
                                }}
                                className="text-sm text-red-500/50 hover:text-red-500 transition-colors"
                            >
                                Delete Note
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
