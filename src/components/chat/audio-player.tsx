
'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  fileUrl: string;
  waveform?: number[];
  sender?: User;
  isOwnMessage: boolean;
}

const AudioPlayer = ({ fileUrl, waveform, sender, isOwnMessage }: AudioPlayerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: isOwnMessage ? 'rgba(0,0,0,0.3)' : 'hsl(var(--primary))',
      progressColor: isOwnMessage ? 'rgba(0,0,0,0.6)' : 'hsl(var(--primary))',
      height: 40,
      barWidth: 3,
      barGap: 3,
      barRadius: 2,
      cursorWidth: 0,
      url: fileUrl,
      peaks: waveform ? [waveform] : undefined,
    });
    wavesurferRef.current = ws;

    ws.on('ready', () => {
      const dur = ws.getDuration();
      setDuration(formatTime(dur));
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    return () => {
      ws.destroy();
    };
  }, [fileUrl, waveform, isOwnMessage]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  return (
    <div className="flex items-center gap-2 w-64">
      {isOwnMessage ? (
        <div className="relative h-10 w-10 shrink-0">
          <div className="absolute inset-0 rounded-full bg-gray-500 flex items-end justify-end">
            <Mic className="h-4 w-4 text-white/80 translate-x-1 -translate-y-1" />
          </div>
        </div>
      ) : (
        <Avatar className="h-10 w-10">
          <AvatarImage src={sender?.avatar} alt={sender?.name} />
          <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        className={cn(
          "rounded-full h-10 w-10 shrink-0",
          isOwnMessage ? "bg-black/10 hover:bg-black/20" : "bg-primary/10 hover:bg-primary/20"
        )}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <div ref={waveformRef} className="flex-1" />
      <span className="text-xs text-muted-foreground/80">{duration}</span>
    </div>
  );
};

export default AudioPlayer;
