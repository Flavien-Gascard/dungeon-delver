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
}

const SESSION_KEY = 'dd_session';

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [initialState, setInitialState] = useState<RoomPublicState | null>(null);
  const [rejoining, setRejoining] = useState(false);

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return;

    const s: SessionInfo = JSON.parse(saved);
    setRejoining(true);

    socket.connect();
    socket.emit('room:join', {
      roomId: s.roomId,
      dmPassword: s.dmPassword ?? '',
      playerName: s.playerName,
    });

    socket.once('room:state', (state: RoomPublicState) => {
      setSession(s);
      setInitialState(state);
      setRejoining(false);
    });

    socket.once('error', () => {
      // Room gone (server restarted) — clear saved session
      localStorage.removeItem(SESSION_KEY);
      setRejoining(false);
      socket.disconnect();
    });
  }, []);

  function handleJoined(s: SessionInfo, state: RoomPublicState) {
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
      <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-400">
        Reconnecting...
      </div>
    );
  }

  return session && initialState
    ? <GameRoom session={session} initialState={initialState} onLeave={handleLeave} />
    : <Lobby onJoined={handleJoined} />;
}
