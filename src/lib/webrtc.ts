
import type { User } from './types';
import io from 'socket.io-client';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export type Call = {
  id: string;
  type: 'audio' | 'video';
  from: User;
  to: User;
  status: 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'unanswered';
  startedAt: number;
  participants: string[];
}

export class WebRTCManager {
  peerConnection: RTCPeerConnection;
  private onRemoteStream: (stream: MediaStream) => void;
  private onIceCandidate: (candidate: RTCIceCandidate) => void;
  private onConnectionFailed: () => void;

  constructor(
    onRemoteStream: (stream: MediaStream) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onConnectionFailed: () => void
  ) {
    this.peerConnection = new RTCPeerConnection(servers);
    this.onRemoteStream = onRemoteStream;
    this.onIceCandidate = onIceCandidate;
    this.onConnectionFailed = onConnectionFailed;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
         this.onRemoteStream(event.streams[0]);
      });
    };
    
    this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection.connectionState === 'failed') {
            this.onConnectionFailed();
        }
    }
  }


  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (this.peerConnection.signalingState !== 'stable') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }


    // --- Socket.io signaling implementation ---
    private static socket: ReturnType<typeof io> | null = null;

    static getSocket() {
      if (!WebRTCManager.socket) {
        WebRTCManager.socket = io('http://localhost:4000'); // Update if server runs elsewhere
      }
      return WebRTCManager.socket;
    }

    async setOfferInDB(callId: string, offer: RTCSessionDescriptionInit) {
      const socket = WebRTCManager.getSocket();
      socket.emit('signal', {
        callId,
        from: 'offer',
        data: offer,
      });
    }

    async setAnswerInDB(callId: string, answer: RTCSessionDescriptionInit) {
      const socket = WebRTCManager.getSocket();
      socket.emit('signal', {
        callId,
        from: 'answer',
        data: answer,
      });
    }

    async addIceCandidateToDB(callId: string, userId: string, candidate: RTCIceCandidate) {
      const socket = WebRTCManager.getSocket();
      socket.emit('signal', {
        callId,
        from: 'ice',
        data: candidate,
      });
    }

    onIceCandidates(callId: string, userId: string, callback: (candidate: RTCIceCandidateInit) => void) {
      const socket = WebRTCManager.getSocket();
      socket.on('signal', (payload: any) => {
        if (payload.callId === callId && payload.from === 'ice') {
          callback(payload.data);
        }
      });
      // Return unsubscribe function
      return () => {
        socket.off('signal');
      };
    }

    // Listen for offer/answer
    static onSignal(callId: string, type: 'offer' | 'answer', callback: (data: RTCSessionDescriptionInit) => void) {
      const socket = WebRTCManager.getSocket();
      socket.on('signal', (payload: any) => {
        if (payload.callId === callId && payload.from === type) {
          callback(payload.data);
        }
      });
      return () => {
        socket.off('signal');
      };
    }

  close() {
    this.peerConnection.close();
  }
}
