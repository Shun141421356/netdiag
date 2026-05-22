'use client';
import { useRef, useCallback } from 'react';
import { DiagramNode, Port, CONTAINER_TYPES } from '../types/diagram';
import { useDiagram } from '../store/diagramStore';

interface Props {
  node: DiagramNode;
  onDoubleClick: (id: string) => void;
}

export function NodeCard({ node, onDoubleClick }: Props) {
  const { state, dispatch, connectPorts } = useDiagram();
  const isSelected = state.selectedNodeId === node.id;
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const isContainer = CONTAINER_TYPES.includes(node.type);
  const isNttCloud = node.type === 'ntt-cloud';
  const isPatchPanel = node.type === 'patchpanel';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.mode === 'connect') return;
    if ((e.target as HTMLElement).closest('[data-port]')) return;
    if ((e.target as HTMLElement).closest('[data-resize]')) return;
    e.stopPropagation();
    dispatch({ type: 'SELECT_NODE', id: node.id });
    isDragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };
    const onMove = (me: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = (me.clientX - dragStart.current.mx) / state.scale;
      const dy = (me.clientY - dragStart.current.my) / state.scale;
      dispatch({ type: 'MOVE_NODE', id: node.id, x: dragStart.current.nx + dx, y: dragStart.current.ny + dy });
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [state.mode, state.scale, node, dispatch]);

  // Resize handle
  const handleResizeDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = node.width;
    const startH = node.height ?? 180;
    const onMove = (me: MouseEvent) => {
      const nw = Math.max(160, startW + (me.clientX - startX) / state.scale);
      const nh = Math.max(80, startH + (me.clientY - startY) / state.scale);
      dispatch({ type: 'RESIZE_NODE', id: node.id, width: nw, height: nh });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [node, state.scale, dispatch]);

  const handlePortClick = useCallback((e: React.MouseEvent, port: Port) => {
    if (state.mode !== 'connect') return;
    e.stopPropagation();
    if (state.connectStep === 0) {
      dispatch({ type: 'SET_CONNECT_STEP', step: 1, from: { nodeId: node.id, portId: port.id } });
    } else if (state.connectStep === 1 && state.connectFrom) {
      if (state.connectFrom.nodeId === node.id && state.connectFrom.portId === port.id) return;
      connectPorts(state.connectFrom.nodeId, state.connectFrom.portId, node.id, port.id, state.connectingCable);
      dispatch({ type: 'SET_CONNECT_STEP', step: 0, from: null });
    }
  }, [state, node.id, dispatch, connectPorts]);

  const isConnectMode = state.mode === 'connect';
  const isFromNode = state.connectFrom?.nodeId === node.id;

  const PortDot = ({ port, side }: { port: Port; side: 'left' | 'right' }) => {
    const isFromPort = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
    return (
      <button
        data-port={port.id}
        className={[
          'w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 transition-all',
          side === 'left' ? '-ml-1.5' : '-mr-1.5',
          isConnectMode ? 'cursor-crosshair hover:scale-150' : 'cursor-default',
          isFromPort ? 'scale-150 border-blue-500' : 'bg-white',
        ].join(' ')}
        style={{ borderColor: node.color, background: isFromPort ? '#3b82f6' : 'white' }}
        onClick={e => handlePortClick(e, port)}
        title={port.label}
      />
    );
  };

  // NTT雲コンテナ
  if (isNttCloud) {
    return (
      <div
        className={['absolute select-none', isSelected ? 'z-10' : 'z-0'].join(' ')}
        style={{ left: node.x, top: node.y, width: node.width, height: node.height ?? 180 }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
          <defs>
            <filter id="cloud-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
            </filter>
          </defs>
          {/* 雲の形をrectで近似 */}
          <rect x="2" y="2" width={node.width - 4} height={(node.height ?? 180) - 4}
            rx="40" ry="40"
            fill="#EEEDFE" fillOpacity="0.7"
            stroke={isSelected ? '#534AB7' : '#AFA9EC'}
            strokeWidth={isSelected ? 2 : 1.5}
            strokeDasharray="8,4"
            filter="url(#cloud-shadow)"
          />
          <text x="10" y="18" fontSize="10" fontWeight="600" fill="#3C3489">{node.label}</text>
        </svg>
        {/* リサイズハンドル */}
        <div data-resize className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize opacity-40 hover:opacity-80" onMouseDown={handleResizeDown}>
          <svg viewBox="0 0 12 12"><path d="M2,10 L10,2 M6,10 L10,6" stroke="#534AB7" strokeWidth="1.5" /></svg>
        </div>
      </div>
    );
  }

  // コンテナ型（ラック、MDF、EPS、building）
  if (isContainer) {
    return (
      <div
        className={[
          'absolute rounded-lg border-2 select-none',
          isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.2)]' : 'border-dashed',
          isConnectMode ? 'cursor-crosshair' : 'cursor-move',
        ].join(' ')}
        style={{
          left: node.x, top: node.y,
          width: node.width, height: node.height ?? 180,
          background: node.bg + '55',
          borderColor: isSelected ? '#3b82f6' : node.color + '88',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
      >
        <div className="px-2 py-1 text-[11px] font-semibold rounded-t flex items-center gap-1.5"
          style={{ color: node.color, background: node.bg + 'AA' }}>
          <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0"
            style={{ background: node.color, color: node.bg }}>
            {node.label[0]}
          </span>
          {node.label}
          {node.floor && <span className="ml-auto text-[9px] opacity-60">{node.floor}</span>}
        </div>
        {/* リサイズハンドル */}
        <div data-resize className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70" onMouseDown={handleResizeDown}>
          <svg viewBox="0 0 12 12"><path d="M2,10 L10,2 M6,10 L10,6" stroke={node.color} strokeWidth="1.5" /></svg>
        </div>
      </div>
    );
  }

  // パッチパネル専用レイアウト
  if (isPatchPanel) {
    const cols = Math.ceil(node.ports.length / 2);
    return (
      <div
        className={[
          'absolute rounded-lg border bg-white text-xs select-none transition-shadow',
          isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.25)]' : 'border-gray-300 shadow-sm hover:shadow-md',
          isConnectMode ? 'cursor-crosshair' : 'cursor-move',
          isFromNode ? 'ring-2 ring-blue-400 ring-offset-1' : '',
        ].join(' ')}
        style={{ left: node.x, top: node.y, minWidth: Math.max(node.width, cols * 28 + 16), zIndex: isSelected ? 10 : 1 }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
      >
        <div className="px-2 py-1 rounded-t-lg flex items-center gap-1.5 font-semibold"
          style={{ background: node.bg, color: node.color }}>
          <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center" style={{ background: node.color, color: node.bg }}>{node.label[0]}</span>
          {node.label}
          {node.model && <span className="ml-auto text-[9px] opacity-70">{node.model}</span>}
        </div>
        {/* ポートグリッド: 上段・下段 */}
        <div className="p-2">
          <div className="flex gap-1 mb-1">
            {node.ports.filter((_, i) => i % 2 === 0).map((port) => {
              const isFrom = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
              return (
                <div key={port.id} className="flex flex-col items-center gap-0.5">
                  <button
                    data-port={port.id}
                    className={['w-5 h-5 rounded border-2 text-[8px] font-bold transition-all flex items-center justify-center',
                      isConnectMode ? 'cursor-crosshair hover:scale-125' : 'cursor-default',
                      isFrom ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white',
                    ].join(' ')}
                    style={{ borderColor: node.color, color: isFrom ? 'white' : node.color }}
                    onClick={e => handlePortClick(e, port)}
                    title={port.label}
                  >{port.label}</button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-1">
            {node.ports.filter((_, i) => i % 2 === 1).map((port) => {
              const isFrom = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
              return (
                <div key={port.id} className="flex flex-col items-center gap-0.5">
                  <button
                    data-port={port.id}
                    className={['w-5 h-5 rounded border-2 text-[8px] font-bold transition-all flex items-center justify-center',
                      isConnectMode ? 'cursor-crosshair hover:scale-125' : 'cursor-default',
                      isFrom ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white',
                    ].join(' ')}
                    style={{ borderColor: node.color, color: isFrom ? 'white' : node.color }}
                    onClick={e => handlePortClick(e, port)}
                    title={port.label}
                  >{port.label}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 通常ノード
  return (
    <div
      className={[
        'absolute rounded-lg border bg-white text-xs select-none transition-shadow duration-150',
        isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.25)]' : 'border-gray-300 shadow-sm hover:shadow-md',
        isConnectMode ? 'cursor-crosshair' : 'cursor-move',
        isFromNode ? 'ring-2 ring-blue-400 ring-offset-1' : '',
      ].join(' ')}
      style={{ left: node.x, top: node.y, minWidth: node.width, zIndex: isSelected ? 10 : 1 }}
      onMouseDown={handleMouseDown}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
    >
      <div className="px-2 py-1.5 rounded-t-lg flex items-center gap-1.5 font-semibold"
        style={{ background: node.bg, color: node.color }}>
        <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: node.color, color: node.bg }}>
          {node.label[0]}
        </span>
        <span className="leading-tight truncate">{node.label}</span>
        {node.model && <span className="ml-auto text-[9px] opacity-70 truncate">{node.model}</span>}
      </div>
      {node.floor && (
        <div className="px-2 py-0.5 text-[9px] bg-gray-100 text-gray-500 border-b border-gray-200">{node.floor}</div>
      )}
      {node.ports.length > 0 && (
        <div className="py-1">
          {node.ports.map(port => (
            <div key={port.id} className="flex items-center gap-1 px-1 py-0.5">
              <PortDot port={port} side="left" />
              <span className="flex-1 text-gray-600 text-[10px] px-1 truncate">{port.label}</span>
              <PortDot port={port} side="right" />
            </div>
          ))}
        </div>
      )}
      {/* SFP情報 */}
      {node.sfps && node.sfps.length > 0 && (
        <div className="px-2 py-1 border-t border-gray-100">
          {node.sfps.map(sfp => (
            <div key={sfp.id} className="text-[9px] text-gray-400 flex gap-1">
              <span className="bg-gray-100 px-1 rounded">SFP</span>
              <span>{sfp.type}</span>
              {sfp.notes && <span className="opacity-60">{sfp.notes}</span>}
            </div>
          ))}
        </div>
      )}
      {node.notes && (
        <div className="px-2 py-1 text-[9px] text-gray-400 border-t border-gray-100 italic truncate">{node.notes}</div>
      )}
    </div>
  );
}
