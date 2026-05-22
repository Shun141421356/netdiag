'use client';
import { useRef } from 'react';
import { MousePointer2, Hand, Cable, ZoomIn, ZoomOut, Maximize, Trash2, Download, Upload, FileText } from 'lucide-react';
import { useDiagram } from '../store/diagramStore';
import { CableType, CABLE_STYLES } from '../types/diagram';

interface Props {
  onTitleEdit: () => void;
}

export function Toolbar({ onTitleEdit }: Props) {
  const { state, dispatch, exportJSON, importJSON } = useDiagram();
  const fileRef = useRef<HTMLInputElement>(null);

  const setMode = (m: typeof state.mode) => dispatch({ type: 'SET_MODE', mode: m });
  const btnBase = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs border transition-all duration-150 font-medium';
  const btn = (active: boolean) => `${btnBase} ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`;

  const deleteSelected = () => {
    if (state.selectedNodeId) dispatch({ type: 'DELETE_NODE', id: state.selectedNodeId });
    if (state.selectedConnId) dispatch({ type: 'DELETE_CONN', id: state.selectedConnId });
  };

  return (
    <header className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap">
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-2">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
          <Cable size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm text-blue-700 tracking-tight">NetDiag</span>
      </div>

      {/* Title */}
      <button onClick={onTitleEdit} className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 px-1 rounded hover:bg-gray-100 transition-colors max-w-48 truncate">
        <FileText size={13} className="flex-shrink-0" />
        <span className="truncate">{state.diagram.title}</span>
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Mode */}
      <button className={btn(state.mode === 'select')} onClick={() => setMode('select')}>
        <MousePointer2 size={13} />選択
      </button>
      <button className={btn(state.mode === 'pan')} onClick={() => setMode('pan')}>
        <Hand size={13} />パン
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Cable connect */}
      <button className={btn(state.mode === 'connect')} onClick={() => setMode('connect')}>
        <Cable size={13} />接続
      </button>
      <select
        className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 hover:border-gray-400 focus:outline-none"
        value={state.connectingCable}
        onChange={e => dispatch({ type: 'SET_CABLE', cable: e.target.value as CableType })}
      >
        {(Object.entries(CABLE_STYLES) as [CableType, typeof CABLE_STYLES[CableType]][]).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Zoom */}
      <button className={btnBase + ' bg-white text-gray-600 border-gray-300 hover:bg-gray-50'} onClick={() => dispatch({ type: 'SET_SCALE', scale: state.scale * 1.2 })}><ZoomIn size={13} /></button>
      <button className={btnBase + ' bg-white text-gray-600 border-gray-300 hover:bg-gray-50'} onClick={() => dispatch({ type: 'SET_SCALE', scale: state.scale / 1.2 })}><ZoomOut size={13} /></button>
      <button className={btnBase + ' bg-white text-gray-600 border-gray-300 hover:bg-gray-50'} onClick={() => { dispatch({ type: 'SET_SCALE', scale: 1 }); dispatch({ type: 'SET_PAN', x: 0, y: 0 }); }}><Maximize size={13} /></button>
      <span className="text-xs text-gray-400 min-w-8 text-center">{Math.round(state.scale * 100)}%</span>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Actions */}
      <button
        className={`${btnBase} bg-white border-gray-300 hover:bg-gray-50 ${state.selectedNodeId || state.selectedConnId ? 'text-red-500 hover:border-red-300' : 'text-gray-300 cursor-not-allowed'}`}
        onClick={deleteSelected}
        disabled={!state.selectedNodeId && !state.selectedConnId}
      >
        <Trash2 size={13} />削除
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button className={`${btnBase} bg-white text-gray-600 border-gray-300 hover:bg-gray-50`} onClick={() => fileRef.current?.click()}>
          <Upload size={13} />読込
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files?.[0]) importJSON(e.target.files[0]); e.target.value = ''; }} />
        <button className={`${btnBase} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`} onClick={exportJSON}>
          <Download size={13} />保存
        </button>
      </div>
    </header>
  );
}
