
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { User } from '@/lib/types';
import type { Call } from '@/lib/webrtc';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { WebRTCManager } from '@/lib/webrtc';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export type CallStatus = 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'unanswered';
export type CallType = 'audio' | 'video';

type CallDialogProps = {
  call: Call;
  currentUser: User;
  onAccept: (call: Call) => void;
  onReject: (call: Call) => void;
  onEnd: (call: Call) => void;
};

export default function CallDialog({ call, currentUser, onAccept, onReject, onEnd }: CallDialogProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(call.type === 'audio');
  const [callDuration, setCallDuration] = useState(0);
  const { toast } = useToast();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  const isIncoming = call.to.id === currentUser.id && call.status === 'ringing';
  const isOutgoing = call.from.id === currentUser.id;
  const otherUser = isOutgoing ? call.to : call.from;

  useEffect(() => {
    const initWebRTC = async () => {
      const manager = new WebRTCManager(
        (stream) => setRemoteStream(stream),
        (candidate) => manager.addIceCandidateToDB(call.id, currentUser.id, candidate),
        () => toast({ title: 'Connection failed', description: 'Failed to connect peer.', variant: 'destructive'})
      );
      webrtcManagerRef.current = manager;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: call.type === 'video', audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach(track => manager.peerConnection.addTrack(track, stream));
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing media devices.', error);
        setHasCameraPermission(false);
        toast({
          title: 'Media Access Denied',
          description: 'Could not access camera or microphone. Please check permissions.',
          variant: 'destructive',
        });
        onEnd(call);
        return;
      }
      
      // TODO: Replace Firestore signaling with MongoDB Realm or custom signaling
      if (isOutgoing) {
        // Create offer
        const offer = await manager.createOffer();
        await manager.setOfferInDB(call.id, offer);
      }

      // Set up ICE candidate listeners (implement with Realm or custom backend)
      // Always assign a function for unsubscribe, even if onIceCandidates returns void
      const toUnsub = (fn: unknown) => (typeof fn === 'function' ? fn : () => {});
      const selfCandidatesUnsubRaw = manager.onIceCandidates(call.id, currentUser.id, (candidate) => {
        manager.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
  const otherUserId = call.participants.find((p: string) => p !== currentUser.id)!;
      const otherCandidatesUnsubRaw = manager.onIceCandidates(call.id, otherUserId, (candidate) => {
        manager.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
      const selfCandidatesUnsub = toUnsub(selfCandidatesUnsubRaw);
      const otherCandidatesUnsub = toUnsub(otherCandidatesUnsubRaw);

      // Return cleanup function
      return () => {
        selfCandidatesUnsub();
        otherCandidatesUnsub();
        manager.close();
        localStream?.getTracks().forEach(track => track.stop());
      };
    };

    if (call.status === 'connected' || (isIncoming && call.status === 'ringing')) {
       initWebRTC();
    }
    
    return () => {
      webrtcManagerRef.current?.close();
      localStream?.getTracks().forEach(track => track.stop());
    }

  }, [call.id, call.status, currentUser.id, isOutgoing, isIncoming, call.type, onEnd, toast]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (call.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [call.status]);

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    localStream?.getAudioTracks().forEach(track => track.enabled = !newMutedState);
    setIsMuted(newMutedState);
  }

  const handleToggleCamera = () => {
    if(call.type === 'audio') return;
    const newCameraState = !isCameraOff;
    localStream?.getVideoTracks().forEach(track => track.enabled = !newCameraState);
    setIsCameraOff(newCameraState);
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  const getStatusText = () => {
    if (isIncoming) return 'Incoming call...';
    switch (call.status) {
      case 'ringing': return 'Ringing...';
      case 'connecting': return 'Connecting...';
      case 'connected': return formatDuration(callDuration);
      case 'ended': return 'Call Ended';
      case 'rejected': return 'Call Rejected';
      case 'unanswered': return 'Call Unanswered';
      default: return '';
    }
  };
  
  const showVideo = call.type === 'video' && (call.status === 'connected' || call.status === 'connecting');

  return (
    <Dialog open={true} onOpenChange={() => onEnd(call)}>
      <DialogContent className="max-w-2xl bg-card text-card-foreground p-0 border-none flex flex-col h-[90vh]" hideCloseButton>
        <DialogTitle className="sr-only">Call with {otherUser.name}</DialogTitle>
        <div className="flex-1 relative flex items-center justify-center bg-black/80 overflow-hidden">
          {showVideo ? (
             <>
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <video ref={localVideoRef} autoPlay playsInline muted className={cn(
                  "absolute w-32 h-44 object-cover rounded-md bottom-4 right-4 border-2 border-white/50",
                  isCameraOff && 'hidden'
                )} />
             </>
          ) : (
            <div className="flex flex-col items-center">
              <Avatar className="h-28 w-28 mb-4 border-4 border-background shadow-lg">
                  <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                  <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-white">{otherUser.name}</h2>
              <p className="text-lg text-muted-foreground mt-1">{getStatusText()}</p>
            </div>
          )}
          { !hasCameraPermission && (
            <Alert variant="destructive" className="absolute top-4 left-4 right-4 w-auto">
              <AlertTitle>Camera/Mic Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera and microphone access to use this feature.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="bg-muted flex justify-center items-center p-4 gap-4 min-h-[100px]">
           {isIncoming && (
            <>
              <div className="flex flex-col items-center">
                <Button variant="destructive" size="icon" className="rounded-full h-16 w-16" onClick={() => onReject(call)}>
                  <PhoneOff className="h-7 w-7" />
                </Button>
                <span className="mt-2 text-sm">Decline</span>
              </div>
              <div className="flex flex-col items-center">
                <Button size="icon" className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600" onClick={() => onAccept(call)}>
                  <Phone className="h-7 w-7" />
                </Button>
                 <span className="mt-2 text-sm">Accept</span>
              </div>
            </>
           )}
           {(call.status === 'connected' || call.status === 'connecting' || (isOutgoing && call.status === 'ringing')) && (
             <>
              <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 bg-background/50" onClick={handleToggleMute}>
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
               <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 bg-background/50" onClick={handleToggleCamera} disabled={call.type === 'audio'}>
                  {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </Button>
              <Button variant="destructive" size="icon" className="rounded-full h-16 w-16" onClick={() => onEnd(call)}>
                  <PhoneOff className="h-7 w-7" />
              </Button>
            </>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
