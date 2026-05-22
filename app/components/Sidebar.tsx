'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NODE_CATEGORIES, NodeTemplate } from '../types/diagram';

export function Sidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (label: string) => setOpen(o => ({ ...o, [label]: !o[label] }));
  // デフォルト全開
  const isOpen = (label: string) => label in open ? open[label] : true;

  const handleDragStart = (e: React.DragEvent, tmpl: NodeTemplate) => {
    e.dataTransfer.setData('application/netdiag-node', JSON.stringify(tmpl));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-48 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0 select-none">
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">オブジェクト</p>
        <p className="text-[10px] text-gray-300">ドラッグしてキャンバスへ</p>
      </div>
      {NODE_CATEGORIES.map(cat => (
        <div key={cat.label}>
          <button
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
            onClick={() => toggle(cat.label)}
          >
            <span>{cat.label}</span>
            {isOpen(cat.label) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          {isOpen(cat.label) && cat.items.map(item => (
            <div
              key={item.type}
              draggable
              onDragStart={e => handleDragStart(e, item)}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 border-b border-gray-100 cursor-grab hover:bg-blue-50 hover:text-blue-700 active:cursor-grabbing transition-colors group"
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: item.bg, color: item.color }}
              >
                {item.label[0]}
              </div>
              <span className="leading-tight">{item.label}</span>
              {item.isContainer && <span className="ml-auto text-[8px] text-gray-300">枠</span>}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
