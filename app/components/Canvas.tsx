'use client';
import { useRef, useCallback } from 'react';
import { useDiagram } from '../store/diagramStore';
import { NodeCard } from './NodeCard';
import { ConnectionLayer } from './ConnectionLayer';
import { PropPanel } from './PropPanel';
import { Legend } from './Legend';
import { NodeTemplate } from '../types/diagram';

interface Props { onNodeDoubleClick: (id: string) => void; }

export function Canvas({ onNodeDoubleClick }: Props) {
  const { state, dispatch, addNodeFromTemplate } = useDiagram();
  const wrapRef   = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart  = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const clientToCanvas = useCallback((cx: number, cy: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return { x: (cx - rect.left - state.panX) / state.scale, y: (cy - rect.top - state.panY) / state.scale };
  }, [state.panX, state.panY, state.scale]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/netdiag-node');
    if (!raw) return;
    const tmpl: NodeTemplate = JSON.parse(raw);
    const { x, y } = clientToCanvas(e.clientX, e.clientY);
    addNodeFromTemplate(tmpl, x - 80, y - 20);
  }, [clientToCanvas, addNodeFromTemplate]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.mode === 'pan') {
      isPanning.current = true;
      panStart.current  = { mx: e.clientX, my: e.clientY, px: state.panX, py: state.panY };
      e.preventDefault();
    }
  }, [state.mode, state.panX, state.panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    dispatch({ type: 'SET_PAN', x: panStart.current.px + (e.clientX - panStart.current.mx), y: panStart.current.py + (e.clientY - panStart.current.my) });
  }, [dispatch]);

  const handleMouseUp   = useCallback(() => { isPanning.current = false; }, []);
  const handleWheel     = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_SCALE', scale: state.scale * (e.deltaY > 0 ? 0.9 : 1.1) });
  }, [state.scale, dispatch]);

  const handleBgClick = useCallback(() => {
    if (state.mode === 'connect' && state.connectStep === 1) { dispatch({ type: 'SET_CONNECT_STEP', step: 0, from: null }); return; }
    dispatch({ type: 'SELECT_NODE', id: null });
    dispatch({ type: 'SELECT_CONN', id: null });
  }, [state.mode, state.connectStep, dispatch]);

  const isConnecting = state.mode === 'connect';

  return (
    <div ref={wrapRef} className="relative flex-1 overflow-hidden"
      style={{
        background: 'repeating-linear-gradient(0deg,transparent,transparent 19px,#e5e7eb 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,#e5e7eb 20px),#f9fafb',
        cursor: state.mode === 'pan' ? 'grab' : isConnecting ? 'crosshair' : 'default',
      }}
      onDrop={handleDrop} onDragOver={e => e.preventDefault()}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
      onWheel={handleWheel} onClick={handleBgClick}
    >
      {isConnecting && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-md pointer-events-none">
          {state.connectStep === 0 ? 'ケーブル接続モード — 起点ポートをクリック' : '→ 対向ポートをクリックして接続'}
        </div>
      )}
      {state.selectedConnId && !isConnecting && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-orange-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-md pointer-events-none">
          接続を選択中 — Deleteキーで削除
        </div>
      )}
      <div style={{ transform: `translate(${state.panX}px,${state.panY}px) scale(${state.scale})`, transformOrigin: '0 0', width: 3000, height: 3000, position: 'relative' }}
        onClick={e => e.stopPropagation()}>
        <ConnectionLayer />
        {state.diagram.nodes.map(node => <NodeCard key={node.id} node={node} onDoubleClick={onNodeDoubleClick} />)}
      </div>
      <Legend />
      <PropPanel />
      <div className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 z-10">
        {Math.round(state.scale * 100)}%
      </div>
    </div>
  );
}
