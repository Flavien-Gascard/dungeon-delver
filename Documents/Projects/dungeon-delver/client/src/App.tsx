import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import socket from './socket';
import type { RoomPublicState } from './types';

export interface SessionInfo {
  roomId: string;
  roomName: string;
  playerName: string;
  isDM: boolean;
  dmPassword?: string;
  playerPassword?: string;
}

const SESSION_KEY = 'dd_session';

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [initialState, setInitialState] = useState<RoomPublicState | null>(null);
  const [rejoining, setRejoining] = useState(false);

  // Read ?room=ID from URL for shareable links
  const urlRoomId = new URLSearchParams(window.location.search).get('room') ?? undefined;

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return;

    const s: SessionInfo = JSON.parse(saved);
    setRejoining(true);

    socket.connect();
    socket.emit('room:join', {
      roomId: s.roomId,
      dmPassword: s.dmPassword,
      playerPassword: s.playerPassword,
      playerName: s.playerName,
    });

    socket.once('room:state', (state: RoomPublicState) => {
      setSession(s);
      setInitialState(state);
      setRejoining(false);
    });

    socket.once('error', () => {
      localStorage.removeItem(SESSION_KEY);
      setRejoining(false);
      socket.disconnect();
    });
  }, []);

  function handleJoined(s: SessionInfo, state: RoomPublicState) {
    // Clear room param from URL without reload
    if (urlRoomId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    setInitialState(state);
  }

  function handleLeave() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setInitialState(null);
  }

  if (rejoining) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-amber-600"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, #1a0f0a 0%, #0a0a0f 100%)' }}>
        <div className="text-center space-y-3">
          <div className="text-4xl">⚔️</div>
          <p className="uppercase tracking-widest text-sm">Returning to the realm...</p>
        </div>
      </div>
    );
  }

  return session && initialState
    ? <GameRoom session={session} initialState={initialState} onLeave={handleLeave} />
    : <Lobby onJoined={handleJoined} preselectedRoomId={urlRoomId} />;
}
