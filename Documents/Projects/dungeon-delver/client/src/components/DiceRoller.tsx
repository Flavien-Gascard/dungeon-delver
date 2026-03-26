import { useState } from 'react';
import socket from '../socket';
import type { DiceRollResult } from '../types';

const QUICK_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

interface Props {
  diceLog: DiceRollResult[];
}

export default function DiceRoller({ diceLog }: Props) {
  const [expression, setExpression] = useState('');

  function roll(expr: string) {
    socket.emit('dice:roll', { expression: expr });
  }

  return (
    <div className="p-3 border-t border-gray-700 space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dice</h3>

      <div className="flex flex-wrap gap-1">
        {QUICK_DICE.map(d => (
          <button key={d} onClick={() => roll(`1${d}`)}
            className="px-2 py-1 bg-gray-700 hover:bg-purple-700 rounded text-xs font-mono">
            {d}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        <input
          className="flex-1 px-2 py-1 bg-gray-700 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
          placeholder="2d6+3"
          value={expression}
          onChange={e => setExpression(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && expression) { roll(expression); setExpression(''); } }}
        />
        <button onClick={() => { if (expression) { roll(expression); setExpression(''); } }}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold">
          Roll
        </button>
      </div>

      <div className="space-y-1 max-h-36 overflow-y-auto">
        {diceLog.map((r, i) => (
          <div key={i} className="text-xs bg-gray-900 rounded px-2 py-1">
            <span className="text-purple-400 font-semibold">{r.roller}</span>
            {' '}rolled <span className="font-mono">{r.expression}</span>
            {' → '}
            <span className="text-yellow-400 font-bold">{r.total}</span>
            <span className="text-gray-500"> [{r.rolls.join(', ')}]</span>
          </div>
        ))}
      </div>
    </div>
  );
}
