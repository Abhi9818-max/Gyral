"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Video, StopCircle, PlayCircle } from 'lucide-react';

interface VideoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVideoSelected: (file: File, videoUrl: string) => void;
}

export function VideoUploadModal({ isOpen, onClose, onVideoSelected }: VideoUploadModalProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mode, setMode] = useState<'select' | 'record' | 'preview'>('select');

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_DURATION = 30; // 30 seconds

    useEffect(() => {
        if (!isOpen) {
            cleanup();
        }
    }, [isOpen]);

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setMode('select');
        setIsRecording(false);
        setRecordedBlob(null);
        setPreviewUrl(null);
        setRecordingTime(0);
        chunksRef.current = [];
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setMode('preview');

                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                    videoRef.current.src = url;
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= MAX_DURATION - 1) {
                        stopRecording();
                        return MAX_DURATION;
                    }
                    return prev + 1;
                });
            }, 1000);

            setMode('record');
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if it's a video
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file');
            return;
        }

        // Check duration (we'll validate on preview)
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setRecordedBlob(file);
        setMode('preview');

        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
            if (video.duration > MAX_DURATION) {
                alert(`Video must be ${MAX_DURATION} seconds or less. Please trim your video.`);
                // Could auto-open editor here
            }
        };
    };

    const handleUseVideo = () => {
        if (recordedBlob && previewUrl) {
            // Convert blob to file
            const file = new File([recordedBlob], `story-${Date.now()}.webm`, {
                type: recordedBlob.type
            });
            onVideoSelected(file, previewUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Mode: Select */}
            {mode === 'select' && (
                <div className="w-full max-w-md p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Create Video Story</h2>

                    <button
                        onClick={startRecording}
                        className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center gap-4 text-white transition-all group"
                    >
                        <div className="p-3 bg-red-500 rounded-full group-hover:scale-110 transition-transform">
                            <Video className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold">Record Video</div>
                            <div className="text-sm text-zinc-400">Max 30 seconds</div>
                        </div>
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center gap-4 text-white transition-all group"
                    >
                        <div className="p-3 bg-blue-500 rounded-full group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold">Upload Video</div>
                            <div className="text-sm text-zinc-400">From your device</div>
                        </div>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}

            {/* Mode: Recording */}
            {mode === 'record' && (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="max-w-full max-h-full object-contain"
                    />

                    {/* Recording indicator */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-bold">{recordingTime}s / {MAX_DURATION}s</span>
                    </div>

                    {/* Stop button */}
                    <button
                        onClick={stopRecording}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 p-4 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-xl"
                    >
                        <StopCircle className="w-8 h-8 text-white fill-white" />
                    </button>
                </div>
            )}

            {/* Mode: Preview */}
            {mode === 'preview' && previewUrl && (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <video
                        ref={videoRef}
                        controls
                        src={previewUrl}
                        className="max-w-full max-h-full object-contain"
                    />

                    {/* Action buttons */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                        <button
                            onClick={() => {
                                cleanup();
                                setMode('select');
                            }}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white font-semibold transition-colors"
                        >
                            Retake
                        </button>
                        <button
                            onClick={handleUseVideo}
                            className="px-6 py-3 bg-white hover:bg-zinc-200 rounded-full text-black font-semibold transition-colors"
                        >
                            Use Video
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
