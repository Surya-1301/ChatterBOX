
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Sparkles, X, Loader2, Mic, Square } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { getIntelligentResponseSuggestions } from '@/ai/flows/intelligent-response-suggestions';
import type { Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

type MessageInputProps = {
  onSend: (text: string, file?: File | Blob, options?: {fileName?: string, audioWaveform?: number[]}) => void;
  onTyping: (isTyping: boolean) => void;
  messages: Message[];
  isDisabled?: boolean;
  placeholder?: string;
};

export default function MessageInput({ onSend, onTyping, messages, isDisabled, placeholder = "Type a message" }: MessageInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformDataRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  }, []);

  const handleSend = () => {
    if (text.trim() || file) {
      onSend(text, file || undefined, { fileName: file?.name });
      setText('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1200);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSuggestReplies = async () => {
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const conversationHistory = messages
        .map((m) => `${m.from}: ${m.content}`)
        .join('\n');
  const result = await getIntelligentResponseSuggestions({ conversationHistory, numberOfSuggestions: 3 });
      setSuggestions(result.suggestions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not generate suggestions.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media Devices API not supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context and analyser for waveform
      audioContextRef.current = new window.AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      waveformDataRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fileName = `voice-message-${new Date().toISOString()}.webm`;
        onSend('', audioBlob, { fileName, audioWaveform: waveformDataRef.current });
        
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
      };

      audioChunksRef.current = [];
      mediaRecorderRef.current.start(100); // Collect data in chunks for waveform
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);

        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const value = dataArray.reduce((a, b) => a + b) / bufferLength;
          waveformDataRef.current.push(value / 255); // Normalize to 0-1
        }
      }, 100);

    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  return (
    <div className="p-4 pt-2 bg-card/80 backdrop-blur-sm">
      {suggestions.length > 0 && (
         <div className="flex gap-2 mb-2 flex-wrap">
            {suggestions.map((s, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => setText(s)} disabled={isDisabled}>
                    {s}
                </Button>
            ))}
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button
            variant="ghost"
            size="icon"
            onClick={handleSuggestReplies}
            disabled={isSuggesting || isDisabled || isRecording}
          >
            {isSuggesting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-yellow-500" />}
          </Button>
        {!isRecording && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              disabled={isDisabled}
            />
          </>
        )}
        <div className="relative flex-1">
          {isRecording ? (
            <div className="flex items-center justify-center bg-muted h-10 rounded-full">
              <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 mr-2" />
              <p className="text-sm font-mono">{formatTime(recordingTime)}</p>
            </div>
          ) : (
            <Input
              value={text}
              onChange={handleInputChange}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="rounded-full px-4"
              disabled={isDisabled}
            />
          )}
        </div>
        {text || file ? (
            <Button onClick={handleSend} size="icon" className="rounded-full" disabled={isDisabled}>
                <Send className="h-5 w-5" />
            </Button>
        ) : (
            <Button onClick={handleMicClick} size="icon" className="rounded-full" disabled={isDisabled}>
                {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
        )}
      </div>
      {file && !isRecording && (
        <div className="flex items-center text-sm mt-2 text-muted-foreground bg-muted p-2 rounded-md">
          <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate flex-1">{file.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}>
            <X className="h-4 w-4"/>
          </Button>
        </div>
      )}
    </div>
  );
}
