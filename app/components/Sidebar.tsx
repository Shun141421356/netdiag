'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NODE_CATEGORIES, NodeTemplate } from '../types/diagram';

export function Sidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ 'NTT局舎': true, '加入者建物': true, '共通': true });

  const handleDragStart = (e: React.DragEvent, tmpl: NodeTemplate) => {
    e.dataTransfer.setData('application/netdiag-node', JSON.stringify(tmpl));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0 select-none">
      <div className="px-3 py-2 border-b border-gray-200">
        <p className="text-xs text-gray-400 font-medium">オブジェクト</p>
        <p className="text-xs text-gray-400">ドラッグしてキャンバスへ</p>
      </div>
      {NODE_CATEGORIES.map(cat => (
        <div key={cat.label}>
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(o => ({ ...o, [cat.label]: !o[cat.label] }))}
          >
            <span>{cat.label}</span>
            {open[cat.label] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {open[cat.label] && cat.items.map(item => (
            <div
              key={item.type}
              draggable
              onDragStart={e => handleDragStart(e, item)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 border-b border-gray-100 cursor-grab hover:bg-blue-50 hover:text-blue-700 active:cursor-grabbing transition-colors group"
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: item.bg, color: item.color }}
              >
                {item.label[0]}
              </div>
              <span className="leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
