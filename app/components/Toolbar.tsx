'use client';
import { useRef, useEffect } from 'react';
import { MousePointer2, Hand, Cable, ZoomIn, ZoomOut, Maximize, Trash2, Download, Upload, FileText } from 'lucide-react';
import { useDiagram } from '../store/diagramStore';
import { CableType, CABLE_STYLES } from '../types/diagram';

interface Props { onTitleEdit: () => void; }

export function Toolbar({ onTitleEdit }: Props) {
  const { state, dispatch, exportJSON, importJSON } = useDiagram();
  const fileRef = useRef<HTMLInputElement>(null);
  const setMode = (m: typeof state.mode) => dispatch({ type: 'SET_MODE', mode: m });

  // キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'g') { e.preventDefault(); setMode('select'); }
        if (e.key === 'h') { e.preventDefault(); setMode('pan'); }
        if (e.key === 'j') { e.preventDefault(); setMode('connect'); }
        if (e.key === 's') { e.preventDefault(); exportJSON(); }
        if (e.key === '=') { e.preventDefault(); dispatch({ type: 'SET_SCALE', scale: state.scale * 1.2 }); }
        if (e.key === '-') { e.preventDefault(); dispatch({ type: 'SET_SCALE', scale: state.scale / 1.2 }); }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedNodeId) dispatch({ type: 'DELETE_NODE', id: state.selectedNodeId });
        if (state.selectedConnId) dispatch({ type: 'DELETE_CONN', id: state.selectedConnId });
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODE', mode: 'select' });
        dispatch({ type: 'SELECT_NODE', id: null });
        dispatch({ type: 'SELECT_CONN', id: null });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, dispatch, exportJSON]);

  const btnBase = 'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded text-[10px] border transition-all duration-150 min-w-[48px]';
  const btn = (active: boolean) => `${btnBase} ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`;
  const iconBtn = `${btnBase} bg-white text-gray-600 border-gray-300 hover:bg-gray-50`;

  const ModeBtn = ({ mode, label, shortcut, icon }: { mode: typeof state.mode; label: string; shortcut: string; icon: React.ReactNode }) => (
    <button className={btn(state.mode === mode)} onClick={() => setMode(mode)} title={`${label} (Ctrl+${shortcut.toUpperCase()})`}>
      {icon}
      <span className="leading-none">{label}</span>
      <span className="text-[8px] opacity-60">Ctrl+{shortcut}</span>
    </button>
  );

  const hasSelection = !!(state.selectedNodeId || state.selectedConnId);

  return (
    <header className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap">
      {/* ロゴ */}
      <div className="flex items-center gap-1.5 mr-2">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center"><Cable size={14} className="text-white" /></div>
        <span className="font-bold text-sm text-blue-700 tracking-tight">NetDiag</span>
      </div>
      {/* タイトル */}
      <button onClick={onTitleEdit} className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 px-1.5 py-1 rounded hover:bg-gray-100 transition-colors max-w-40 truncate border border-transparent hover:border-gray-200">
        <FileText size={12} className="flex-shrink-0" />
        <span className="truncate">{state.diagram.title}</span>
      </button>
      <div className="w-px h-6 bg-gray-200 mx-0.5" />
      {/* モード */}
      <ModeBtn mode="select" label="選択" shortcut="G" icon={<MousePointer2 size={13} />} />
      <ModeBtn mode="pan" label="パン" shortcut="H" icon={<Hand size={13} />} />
      <div className="w-px h-6 bg-gray-200 mx-0.5" />
      {/* ケーブル接続 */}
      <ModeBtn mode="connect" label="接続" shortcut="J" icon={<Cable size={13} />} />
      <select
        className="text-[11px] border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 hover:border-gray-400 focus:outline-none h-9"
        value={state.connectingCable}
        onChange={e => dispatch({ type: 'SET_CABLE', cable: e.target.value as CableType })}
      >
        {(Object.entries(CABLE_STYLES) as [CableType, typeof CABLE_STYLES[CableType]][]).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <div className="w-px h-6 bg-gray-200 mx-0.5" />
      {/* ズーム */}
      <button className={iconBtn} onClick={() => dispatch({ type: 'SET_SCALE', scale: state.scale * 1.2 })} title="ズームイン (Ctrl+=)">
        <ZoomIn size={13} /><span>拡大</span><span className="text-[8px] opacity-60">Ctrl+=</span>
      </button>
      <button className={iconBtn} onClick={() => dispatch({ type: 'SET_SCALE', scale: state.scale / 1.2 })} title="ズームアウト (Ctrl+-)">
        <ZoomOut size={13} /><span>縮小</span><span className="text-[8px] opacity-60">Ctrl+-</span>
      </button>
      <button className={iconBtn} onClick={() => { dispatch({ type: 'SET_SCALE', scale: 1 }); dispatch({ type: 'SET_PAN', x: 0, y: 0 }); }}>
        <Maximize size={13} /><span>リセット</span>
      </button>
      <span className="text-[10px] text-gray-400 w-8 text-center">{Math.round(state.scale * 100)}%</span>
      <div className="w-px h-6 bg-gray-200 mx-0.5" />
      {/* 削除 */}
      <button
        className={`${btnBase} border-gray-300 ${hasSelection ? 'bg-white text-red-500 hover:bg-red-50 hover:border-red-300' : 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'}`}
        onClick={() => {
          if (state.selectedNodeId) dispatch({ type: 'DELETE_NODE', id: state.selectedNodeId });
          if (state.selectedConnId) dispatch({ type: 'DELETE_CONN', id: state.selectedConnId });
        }}
        disabled={!hasSelection}
        title="削除 (Delete)"
      >
        <Trash2 size={13} /><span>削除</span><span className="text-[8px] opacity-60">Del</span>
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <button className={iconBtn} onClick={() => fileRef.current?.click()}>
          <Upload size={13} /><span>読込</span>
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files?.[0]) importJSON(e.target.files[0]); e.target.value = ''; }} />
        <button className={`${btnBase} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`} onClick={exportJSON} title="保存 (Ctrl+S)">
          <Download size={13} /><span>保存</span><span className="text-[8px] opacity-80">Ctrl+S</span>
        </button>
      </div>
    </header>
  );
}
