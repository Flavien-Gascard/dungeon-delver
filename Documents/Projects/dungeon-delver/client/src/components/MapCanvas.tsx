import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Text, Group, Line, Arc } from 'react-konva';
import useImage from 'use-image';
import socket from '../socket';
import type { RoomPublicState, Token } from '../types';
import type { SessionInfo } from '../App';

interface Props {
  roomState: RoomPublicState;
  session: SessionInfo & { dmPassword?: string };
  socketId: string;
}

function TokenShape({ token, gridSize, isDM, socketId, onMoveEnd }: {
  token: Token;
  gridSize: number;
  isDM: boolean;
  socketId: string;
  onMoveEnd: (id: string, x: number, y: number) => void;
}) {
  const [img] = useImage(token.imageUrl ? `http://localhost:3001${token.imageUrl}` : '');
  const canDrag = isDM || token.ownerId === socketId;
  const r = gridSize / 2;
  const cx = r;
  const cy = r;
  const hpRatio = token.hp / token.maxHp;
  const hpColor = hpRatio > 0.5 ? '#16a34a' : hpRatio > 0.25 ? '#ca8a04' : '#dc2626';

  return (
    <Group
      x={token.x * gridSize}
      y={token.y * gridSize}
      draggable={canDrag}
      onDragEnd={e => {
        const col = Math.round(e.target.x() / gridSize);
        const row = Math.round(e.target.y() / gridSize);
        e.target.x(col * gridSize);
        e.target.y(row * gridSize);
        onMoveEnd(token.id, col, row);
      }}
    >
      {/* Token circle — image clipped or solid fill */}
      {img
        ? <KonvaImage
            image={img}
            width={gridSize}
            height={gridSize}
            clipFunc={ctx => { ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); }}
          />
        : <Circle x={cx} y={cy} radius={r - 2} fill="#7c3aed" />
      }
      {/* Border ring */}
      <Circle x={cx} y={cy} radius={r - 2} stroke="#a78bfa" strokeWidth={2} />
      {/* HP arc (background) */}
      <Arc x={cx} y={cy} innerRadius={r - 6} outerRadius={r - 2} angle={360} fill="#1f2937" />
      {/* HP arc (fill) */}
      <Arc x={cx} y={cy} innerRadius={r - 6} outerRadius={r - 2} angle={hpRatio * 360} fill={hpColor} rotation={-90} />
      {/* Name */}
      <Text
        text={token.name}
        fontSize={9}
        fill="white"
        width={gridSize}
        align="center"
        y={gridSize - 14}
      />
    </Group>
  );
}

function FogLayer({ fog, gridSize }: { fog: boolean[][]; gridSize: number }) {
  const cells: JSX.Element[] = [];
  fog.forEach((row, r) =>
    row.forEach((revealed, c) => {
      if (!revealed) {
        cells.push(
          <Rect key={`${r}-${c}`} x={c * gridSize} y={r * gridSize}
            width={gridSize} height={gridSize} fill="rgba(0,0,0,0.85)" />
        );
      }
    })
  );
  return <>{cells}</>;
}

export default function MapCanvas({ roomState, session, socketId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [mapImg] = useImage(
    roomState.mapImage ? `http://localhost:3001/uploads/maps/${roomState.mapImage}` : ''
  );

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  function handleTokenMove(tokenId: string, x: number, y: number) {
    socket.emit('token:move', { tokenId, x, y });
  }

  // Grid lines
  const gs = roomState.gridSize || 50;
  const cols = Math.ceil(size.width / gs);
  const rows = Math.ceil(size.height / gs);
  const gridLines: JSX.Element[] = [];
  for (let c = 0; c <= cols; c++) {
    gridLines.push(<Line key={`v${c}`} points={[c * gs, 0, c * gs, size.height]} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />);
  }
  for (let r = 0; r <= rows; r++) {
    gridLines.push(<Line key={`h${r}`} points={[0, r * gs, size.width, r * gs]} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />);
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-950">
      <Stage width={size.width} height={size.height}>
        {/* Map image */}
        <Layer>
          {mapImg && <KonvaImage image={mapImg} width={size.width} height={size.height} />}
          {gridLines}
        </Layer>

        {/* Tokens */}
        <Layer>
          {roomState.tokens.map(token => (
            <TokenShape
              key={token.id}
              token={token}
              gridSize={gs}
              isDM={session.isDM}
              socketId={socketId}
              onMoveEnd={handleTokenMove}
            />
          ))}
        </Layer>

        {/* Fog of war (players see fog; DM sees dimmed version) */}
        <Layer opacity={session.isDM ? 0.3 : 1}>
          <FogLayer fog={roomState.fog} gridSize={gs} />
        </Layer>
      </Stage>

      {/* DM controls overlay */}
      {session.isDM && <DMControls roomState={roomState} dmPassword={session.dmPassword ?? ''} />}
    </div>
  );
}

function DMControls({ roomState, dmPassword }: { roomState: RoomPublicState; dmPassword: string }) {
  const [showAddToken, setShowAddToken] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenHp, setTokenHp] = useState('10');
  const [tokenX, setTokenX] = useState('0');
  const [tokenY, setTokenY] = useState('0');
  const fileRef = useRef<HTMLInputElement>(null);

  function addToken() {
    socket.emit('token:add', {
      name: tokenName,
      x: parseInt(tokenX),
      y: parseInt(tokenY),
      hp: parseInt(tokenHp),
      maxHp: parseInt(tokenHp),
    });
    setShowAddToken(false);
    setTokenName('');
  }

  async function uploadMap() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('map', file);
    fd.append('dmPassword', dmPassword);
    await fetch(`/api/upload/${roomState.id}/map`, { method: 'POST', body: fd });
  }

  return (
    <div className="absolute top-3 left-3 flex gap-2">
      <button
        onClick={() => setShowAddToken(v => !v)}
        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-semibold shadow"
      >
        + Token
      </button>
      <label className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold shadow cursor-pointer">
        Upload Map
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadMap} />
      </label>

      {showAddToken && (
        <div className="absolute top-10 left-0 bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 w-56 shadow-xl z-10">
          <input className="w-full px-3 py-1.5 rounded bg-gray-700 text-sm" placeholder="Name" value={tokenName} onChange={e => setTokenName(e.target.value)} />
          <input className="w-full px-3 py-1.5 rounded bg-gray-700 text-sm" placeholder="HP" type="number" value={tokenHp} onChange={e => setTokenHp(e.target.value)} />
          <div className="flex gap-2">
            <input className="w-full px-3 py-1.5 rounded bg-gray-700 text-sm" placeholder="Col" type="number" value={tokenX} onChange={e => setTokenX(e.target.value)} />
            <input className="w-full px-3 py-1.5 rounded bg-gray-700 text-sm" placeholder="Row" type="number" value={tokenY} onChange={e => setTokenY(e.target.value)} />
          </div>
          <button onClick={addToken} className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold">Add</button>
        </div>
      )}
    </div>
  );
}
