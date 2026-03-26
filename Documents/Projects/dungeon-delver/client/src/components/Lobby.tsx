import { useState, useEffect } from 'react';
import socket from '../socket';
import type { SessionInfo } from '../App';
import type { RoomPublicState } from '../types';

interface RoomSummary {
  id: string;
  name: string;
}

interface Props {
  onJoined: (session: SessionInfo, state: RoomPublicState) => void;
}

type Panel = 'none' | 'create' | 'join';

export default function Lobby({ onJoined }: Props) {
  const [panel, setPanel] = useState<Panel>('none');
  const [playerName, setPlayerName] = useState('');
  const [dmPassword, setDmPassword] = useState('');

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPass, setNewRoomPass] = useState('');

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  async function createRoom() {
    if (!playerName || !newRoomName || !newRoomPass) {
      setError('You must fill all the fields, brave Dungeon Master.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName, dmPassword: newRoomPass }),
      });
      const room = await res.json();
      setRooms(prev => [...prev, { id: room.id, name: room.name }]);
      joinRoom(room.id, newRoomPass, true, room.name, newRoomPass);
    } catch {
      setError('The realm could not be forged. Try again.');
      setLoading(false);
    }
  }

  function joinRoom(roomId: string, pass: string, isDM: boolean, roomName: string, dmPassword?: string) {
    socket.connect();
    socket.emit('room:join', { roomId, dmPassword: pass, playerName });

    socket.once('room:state', (state: RoomPublicState) => {
      setLoading(false);
      onJoined({ roomId, roomName, playerName, isDM, dmPassword }, state);
    });

    socket.once('error', (err: { message: string }) => {
      setError(err.message);
      setLoading(false);
      socket.disconnect();
    });
  }

  function handleJoin() {
    if (!playerName || !joinRoomId) {
      setError('Speak your name and choose your realm, adventurer.');
      return;
    }
    setLoading(true);
    setError('');
    const room = rooms.find(r => r.id === joinRoomId);
    joinRoom(joinRoomId, dmPassword, !!dmPassword, room?.name ?? joinRoomId, dmPassword || undefined);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-amber-100"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, #1a0f0a 0%, #0a0a0f 100%)' }}>

      {/* Crest / Title */}
      <div className="text-center mb-10 select-none">
        <div className="text-6xl mb-2">⚔️</div>
        <h1 className="text-5xl font-black tracking-widest text-amber-400 drop-shadow-lg uppercase"
          style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 30px rgba(251,191,36,0.4)' }}>
          Dungeon Delver
        </h1>
        <p className="text-amber-600 tracking-widest text-xs uppercase mt-2">Virtual Tabletop</p>
        <div className="mt-3 flex items-center justify-center gap-3 text-amber-700">
          <span className="h-px w-20 bg-amber-700 block" />
          <span className="text-xs tracking-widest">✦ Enter the Realm ✦</span>
          <span className="h-px w-20 bg-amber-700 block" />
        </div>
      </div>

      {/* Adventurer name — always visible */}
      <div className="w-full max-w-sm mb-6">
        <label className="block text-xs uppercase tracking-widest text-amber-600 mb-1 ml-1">Your Name</label>
        <input
          className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-amber-900 text-amber-100 placeholder-amber-800 focus:outline-none focus:border-amber-500 text-center tracking-wide"
          placeholder="Enter your name, adventurer..."
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
        />
      </div>

      {/* Two action buttons */}
      {panel === 'none' && (
        <div className="flex gap-4">
          <button
            onClick={() => setPanel('create')}
            className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm border-2 border-red-800 bg-red-950 hover:bg-red-900 hover:border-red-600 text-red-300 hover:text-red-100 transition-all shadow-lg"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            🔮 Forge a Realm
          </button>
          <button
            onClick={() => setPanel('join')}
            className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm border-2 border-blue-800 bg-blue-950 hover:bg-blue-900 hover:border-blue-500 text-blue-300 hover:text-blue-100 transition-all shadow-lg"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            🗺️ Enter a Realm
          </button>
        </div>
      )}

      {/* Create Room Panel */}
      {panel === 'create' && (
        <div className="w-full max-w-sm rounded-2xl border border-red-900 bg-gray-900 shadow-2xl overflow-hidden">
          <div className="bg-red-950 px-6 py-4 border-b border-red-900 flex items-center justify-between">
            <h2 className="text-red-300 font-bold uppercase tracking-widest text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              🔮 Forge a Realm
            </h2>
            <button onClick={() => { setPanel('none'); setError(''); }}
              className="text-red-700 hover:text-red-400 text-lg leading-none">✕</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-amber-700 mb-1">Realm Name</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-amber-100 placeholder-gray-600 focus:outline-none focus:border-red-700"
                placeholder="The Underdark, Baldur's Gate..."
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-amber-700 mb-1">Master's Seal (Password)</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-amber-100 placeholder-gray-600 focus:outline-none focus:border-red-700"
                placeholder="Known only to the Dungeon Master..."
                type="password"
                value={newRoomPass}
                onChange={e => setNewRoomPass(e.target.value)}
              />
            </div>
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full py-3 bg-red-900 hover:bg-red-800 border border-red-700 rounded-lg font-bold uppercase tracking-widest text-sm text-red-200 disabled:opacity-50 transition-all"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {loading ? 'Forging...' : '⚔️ Forge & Enter'}
            </button>
          </div>
        </div>
      )}

      {/* Join Room Panel */}
      {panel === 'join' && (
        <div className="w-full max-w-sm rounded-2xl border border-blue-900 bg-gray-900 shadow-2xl overflow-hidden">
          <div className="bg-blue-950 px-6 py-4 border-b border-blue-900 flex items-center justify-between">
            <h2 className="text-blue-300 font-bold uppercase tracking-widest text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              🗺️ Enter a Realm
            </h2>
            <button onClick={() => { setPanel('none'); setError(''); }}
              className="text-blue-700 hover:text-blue-400 text-lg leading-none">✕</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-amber-700 mb-1">Choose Your Realm</label>
              <select
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-amber-100 focus:outline-none focus:border-blue-600 disabled:text-gray-600"
                value={joinRoomId}
                onChange={e => setJoinRoomId(e.target.value)}
                disabled={rooms.length === 0}
              >
                {rooms.length === 0
                  ? <option value="">— No Realms Available —</option>
                  : <>
                      <option value="">— Select a realm —</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </>
                }
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-amber-700 mb-1">Master's Seal (optional)</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-amber-100 placeholder-gray-600 focus:outline-none focus:border-blue-600"
                placeholder="Only if claiming the DM throne..."
                type="password"
                value={dmPassword}
                onChange={e => setDmPassword(e.target.value)}
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={loading || rooms.length === 0}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg font-bold uppercase tracking-widest text-sm text-blue-200 disabled:opacity-50 transition-all"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {loading ? 'Entering...' : '🗺️ Enter Realm'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-400 text-sm text-center italic max-w-sm">⚠ {error}</p>
      )}

      <p className="mt-12 text-amber-900 text-xs tracking-widest uppercase">May the dice roll in your favour</p>
    </div>
  );
}
