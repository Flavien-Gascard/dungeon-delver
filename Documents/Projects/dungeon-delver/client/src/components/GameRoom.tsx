import { useEffect, useState } from 'react';
import socket from '../socket';
import type { RoomPublicState, DiceRollResult, Token, InitiativeEntry } from '../types';
import type { SessionInfo } from '../App';
import MapCanvas from './MapCanvas';
import DiceRoller from './DiceRoller';
import InitiativeTracker from './InitiativeTracker';

interface Props {
  session: SessionInfo;
  initialState: RoomPublicState;
  onLeave: () => void;
}

export default function GameRoom({ session, initialState, onLeave }: Props) {
  const [roomState, setRoomState] = useState<RoomPublicState>(initialState);
  const [diceLog, setDiceLog] = useState<DiceRollResult[]>([]);

  useEffect(() => {
    socket.on('room:state', setRoomState);

    socket.on('token:added', (token: Token) => {
      setRoomState(prev => prev ? { ...prev, tokens: [...prev.tokens, token] } : prev);
    });
    socket.on('token:moved', ({ tokenId, x, y }: { tokenId: string; x: number; y: number }) => {
      setRoomState(prev => prev ? {
        ...prev,
        tokens: prev.tokens.map(t => t.id === tokenId ? { ...t, x, y } : t),
      } : prev);
    });
    socket.on('token:updated', (updated: Token) => {
      setRoomState(prev => prev ? {
        ...prev,
        tokens: prev.tokens.map(t => t.id === updated.id ? updated : t),
      } : prev);
    });
    socket.on('token:removed', ({ tokenId }: { tokenId: string }) => {
      setRoomState(prev => prev ? {
        ...prev,
        tokens: prev.tokens.filter(t => t.id !== tokenId),
      } : prev);
    });
    socket.on('fog:updated', (cells: { row: number; col: number; revealed: boolean }[]) => {
      setRoomState(prev => {
        if (!prev) return prev;
        const fog = prev.fog.map(row => [...row]);
        cells.forEach(({ row, col, revealed }) => { fog[row][col] = revealed; });
        return { ...prev, fog };
      });
    });
    socket.on('dice:rolled', (result: DiceRollResult) => {
      setDiceLog(prev => [result, ...prev].slice(0, 20));
    });
    socket.on('initiative:updated', (entries: InitiativeEntry[]) => {
      setRoomState(prev => prev ? { ...prev, initiative: entries } : prev);
    });

    return () => {
      socket.off('room:state');
      socket.off('token:added');
      socket.off('token:moved');
      socket.off('token:updated');
      socket.off('token:removed');
      socket.off('fog:updated');
      socket.off('dice:rolled');
      socket.off('initiative:updated');
    };
  }, []);

  function handleLeave() {
    socket.disconnect();
    onLeave();
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Main canvas area */}
      <div className="flex-1 relative">
        <MapCanvas
          roomState={roomState}
          session={session}
          socketId={socket.id ?? ''}
        />
      </div>

      {/* Right sidebar */}
      <div className="w-64 flex flex-col bg-gray-800 border-l border-gray-700 overflow-y-auto">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <div className="font-bold text-purple-400 truncate">{roomState.name || session.roomId}</div>
          <div className="text-xs text-gray-400">{session.playerName} · {session.isDM ? 'DM' : 'Player'}</div>
          <div className="text-xs text-gray-500 mt-1">ID: {session.roomId}</div>
        </div>

        {/* Initiative */}
        <InitiativeTracker
          entries={roomState.initiative}
          tokens={roomState.tokens}
          isDM={session.isDM}
        />

        {/* Dice roller */}
        <DiceRoller diceLog={diceLog} />

        {/* Leave button */}
        <div className="p-3 mt-auto border-t border-gray-700">
          <button
            onClick={handleLeave}
            className="w-full py-2 bg-red-700 hover:bg-red-800 rounded-lg text-sm font-semibold"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
