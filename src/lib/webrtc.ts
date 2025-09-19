
import type { User } from './types';

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

  // --- Signaling methods below must be implemented using MongoDB Realm or another backend ---

  async setOfferInDB(callId: string, offer: RTCSessionDescriptionInit) {
    // TODO: Implement signaling using MongoDB Realm or another backend
    throw new Error('setOfferInDB not implemented');
  }

  async setAnswerInDB(callId: string, answer: RTCSessionDescriptionInit) {
    // TODO: Implement signaling using MongoDB Realm or another backend
    throw new Error('setAnswerInDB not implemented');
  }

  async addIceCandidateToDB(callId: string, userId: string, candidate: RTCIceCandidate) {
    // TODO: Implement signaling using MongoDB Realm or another backend
    throw new Error('addIceCandidateToDB not implemented');
  }

  onIceCandidates(callId: string, userId: string, callback: (candidate: RTCIceCandidateInit) => void) {
    // TODO: Implement signaling using MongoDB Realm or another backend
    throw new Error('onIceCandidates not implemented');
  }

  close() {
    this.peerConnection.close();
  }
}
