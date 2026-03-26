import { useState } from 'react';
import socket from '../socket';
import type { InitiativeEntry, Token } from '../types';

interface Props {
  entries: InitiativeEntry[];
  tokens: Token[];
  isDM: boolean;
}

export default function InitiativeTracker({ entries, tokens, isDM }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ tokenId: string; name: string; value: string }[]>([]);

  function startEdit() {
    setDraft(tokens.map(t => ({
      tokenId: t.id,
      name: t.name,
      value: String(entries.find(e => e.tokenId === t.id)?.value ?? ''),
    })));
    setEditing(true);
  }

  function submit() {
    const valid = draft
      .filter(d => d.value !== '')
      .map(d => ({ tokenId: d.tokenId, name: d.name, value: parseInt(d.value) }));
    socket.emit('initiative:set', { entries: valid });
    setEditing(false);
  }

  function clear() {
    socket.emit('initiative:clear');
  }

  return (
    <div className="p-3 border-b border-gray-700 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Initiative</h3>
        {isDM && (
          <div className="flex gap-1">
            <button onClick={startEdit} className="text-xs px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded">Set</button>
            {entries.length > 0 && <button onClick={clear} className="text-xs px-2 py-0.5 bg-gray-700 hover:bg-red-700 rounded">Clear</button>}
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-1">
          {draft.map((d, i) => (
            <div key={d.tokenId} className="flex items-center gap-2">
              <span className="text-xs flex-1 truncate">{d.name}</span>
              <input
                className="w-14 px-2 py-0.5 bg-gray-700 rounded text-xs text-right font-mono focus:outline-none"
                type="number"
                value={d.value}
                onChange={e => {
                  const next = [...draft];
                  next[i] = { ...d, value: e.target.value };
                  setDraft(next);
                }}
              />
            </div>
          ))}
          <button onClick={submit} className="w-full py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold mt-1">
            Apply
          </button>
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No initiative set</p>
      ) : (
        <ol className="space-y-1">
          {entries.map((e, i) => (
            <li key={e.tokenId} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 text-xs w-4">{i + 1}.</span>
              <span className="flex-1 truncate">{e.name}</span>
              <span className="font-bold text-yellow-400 font-mono">{e.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
