'use client';
import { useRef, useCallback } from 'react';
import { DiagramNode, Port, CONTAINER_TYPES, PortSide, getPortPosition } from '../types/diagram';
import { useDiagram } from '../store/diagramStore';

interface Props {
  node: DiagramNode;
  onDoubleClick: (id: string) => void;
}

export function NodeCard({ node, onDoubleClick }: Props) {
  const { state, dispatch, connectPorts } = useDiagram();
  const isSelected   = state.selectedNodeId === node.id;
  const isContainer  = CONTAINER_TYPES.includes(node.type);
  const isNttCloud   = node.type === 'ntt-cloud';
  const isPatchPanel = node.type === 'patchpanel';
  const isDragging   = useRef(false);
  const dragStart    = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });

  /* ---- drag ---- */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.mode === 'connect') return;
    if ((e.target as HTMLElement).closest('[data-port]')) return;
    if ((e.target as HTMLElement).closest('[data-resize]')) return;
    e.stopPropagation();
    dispatch({ type: 'SELECT_NODE', id: node.id });
    isDragging.current = true;
    dragStart.current  = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };
    const onMove = (me: MouseEvent) => {
      if (!isDragging.current) return;
      dispatch({ type: 'MOVE_NODE', id: node.id,
        x: dragStart.current.nx + (me.clientX - dragStart.current.mx) / state.scale,
        y: dragStart.current.ny + (me.clientY - dragStart.current.my) / state.scale });
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [state.mode, state.scale, node, dispatch]);

  /* ---- resize ---- */
  const handleResizeDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sw = node.width, sh = node.height ?? 200;
    const onMove = (me: MouseEvent) => dispatch({ type: 'RESIZE_NODE', id: node.id,
      width: Math.max(160, sw + (me.clientX - sx) / state.scale),
      height: Math.max(80,  sh + (me.clientY - sy) / state.scale) });
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [node, state.scale, dispatch]);

  /* ---- port click ---- */
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
  const isFromNode    = state.connectFrom?.nodeId === node.id;

  /* ---- port dot (汎用) ---- */
  const PortDot = ({ port }: { port: Port }) => {
    const isFrom = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
    return (
      <button data-port={port.id}
        className={['w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 transition-all',
          isConnectMode ? 'cursor-crosshair hover:scale-150' : 'cursor-default',
          isFrom ? 'scale-150' : 'bg-white',
        ].join(' ')}
        style={{ borderColor: node.color, background: isFrom ? '#3b82f6' : 'white' }}
        onClick={e => handlePortClick(e, port)} title={port.label}
      />
    );
  };

  /* ---- コンテナポート (絶対位置) ---- */
  const ContainerPorts = () => (
    <>
      {node.ports.map((port, idx) => {
        const rel   = getPortPosition(node, idx, node.ports.length);
        const isFrom = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
        return (
          <button key={port.id} data-port={port.id}
            className={['absolute w-3 h-3 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 transition-all z-10',
              isConnectMode ? 'cursor-crosshair hover:scale-150' : 'cursor-default',
              isFrom ? 'scale-150' : 'bg-white',
            ].join(' ')}
            style={{ left: rel.x, top: rel.y, borderColor: node.color, background: isFrom ? '#3b82f6' : 'white' }}
            onClick={e => handlePortClick(e, port)} title={port.label}
          />
        );
      })}
    </>
  );

  /* ---- PPポートドット (グリッド内) ---- */
  const PPPortBtn = ({ port }: { port: Port }) => {
    const isFrom = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
    return (
      <button data-port={port.id}
        className={['w-5 h-5 rounded border-2 text-[8px] font-bold transition-all flex items-center justify-center',
          isConnectMode ? 'cursor-crosshair hover:scale-125' : 'cursor-default',
          isFrom ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white',
        ].join(' ')}
        style={{ borderColor: node.color, color: isFrom ? 'white' : node.color }}
        onClick={e => handlePortClick(e, port)} title={port.label}
      >{port.label}</button>
    );
  };

  const baseClass = [
    'absolute select-none',
    isSelected ? 'z-20' : 'z-1',
  ].join(' ');

  /* ==== NTT雲 ==== */
  if (isNttCloud) {
    const w = node.width, h = node.height ?? 200;
    return (
      <div className={baseClass} style={{ left: node.x, top: node.y, width: w, height: h }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}>
        <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
          <rect x="2" y="2" width={w - 4} height={h - 4} rx="36" ry="36"
            fill="#EEEDFE" fillOpacity="0.75"
            stroke={isSelected ? '#534AB7' : '#AFA9EC'}
            strokeWidth={isSelected ? 2 : 1.5} strokeDasharray="8,4" />
          <text x="14" y="20" fontSize="11" fontWeight="600" fill="#3C3489">{node.label}</text>
        </svg>
        <ContainerPorts />
        <div data-resize className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70" onMouseDown={handleResizeDown}>
          <svg viewBox="0 0 12 12"><path d="M2,10 L10,2 M6,10 L10,6" stroke="#534AB7" strokeWidth="1.5" /></svg>
        </div>
      </div>
    );
  }

  /* ==== コンテナ (ラック/MDF/EPS/建物) ==== */
  if (isContainer) {
    const w = node.width, h = node.height ?? 200;
    return (
      <div className={[baseClass, 'rounded-lg border-2',
        isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.2)]' : 'border-dashed',
        isConnectMode ? 'cursor-crosshair' : 'cursor-move',
      ].join(' ')}
        style={{ left: node.x, top: node.y, width: w, height: h, background: node.bg + '44', borderColor: isSelected ? '#3b82f6' : node.color + '77' }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}>
        <div className="px-2 py-1 text-[11px] font-semibold flex items-center gap-1.5" style={{ color: node.color, background: node.bg + 'AA', borderRadius: '6px 6px 0 0' }}>
          <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: node.color, color: node.bg }}>{node.label[0]}</span>
          {node.label}
          {node.floor && <span className="ml-auto text-[9px] opacity-60">{node.floor}</span>}
        </div>
        <ContainerPorts />
        <div data-resize className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70" onMouseDown={handleResizeDown}>
          <svg viewBox="0 0 12 12"><path d="M2,10 L10,2 M6,10 L10,6" stroke={node.color} strokeWidth="1.5" /></svg>
        </div>
      </div>
    );
  }

  /* ==== パッチパネル ==== */
  if (isPatchPanel) {
    const side  = node.portSide;
    const isVert = side === 'top' || side === 'bottom';
    return (
      <div className={['absolute rounded-lg border bg-white text-xs select-none transition-shadow',
        isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.25)]' : 'border-gray-300 shadow-sm hover:shadow-md',
        isConnectMode ? 'cursor-crosshair' : 'cursor-move',
        isFromNode ? 'ring-2 ring-blue-400 ring-offset-1' : '',
      ].join(' ')}
        style={{ left: node.x, top: node.y, minWidth: node.width, zIndex: isSelected ? 20 : 1 }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}>
        <div className="px-2 py-1 rounded-t-lg flex items-center gap-1.5 font-semibold" style={{ background: node.bg, color: node.color }}>
          <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center" style={{ background: node.color, color: node.bg }}>P</span>
          {node.label}
          {node.model && <span className="ml-auto text-[9px] opacity-70">{node.model}</span>}
        </div>
        <div className="p-2">
          {/* 上段 */}
          <div className="flex gap-1 mb-1">
            {node.ports.filter((_, i) => i % 2 === 0).map(port => <PPPortBtn key={port.id} port={port} />)}
          </div>
          {/* 下段 */}
          <div className="flex gap-1">
            {node.ports.filter((_, i) => i % 2 === 1).map(port => <PPPortBtn key={port.id} port={port} />)}
          </div>
        </div>
      </div>
    );
  }

  /* ==== 通常ノード ==== */
  const side   = node.portSide;
  const isVert = side === 'top' || side === 'bottom';

  return (
    <div className={['absolute rounded-lg border bg-white text-xs select-none transition-shadow duration-150',
      isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.25)]' : 'border-gray-300 shadow-sm hover:shadow-md',
      isConnectMode ? 'cursor-crosshair' : 'cursor-move',
      isFromNode ? 'ring-2 ring-blue-400 ring-offset-1' : '',
    ].join(' ')}
      style={{ left: node.x, top: node.y, minWidth: node.width, zIndex: isSelected ? 20 : 1 }}
      onMouseDown={handleMouseDown}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}>

      {/* 上ポート */}
      {side === 'top' && (
        <div className="flex justify-around px-2 pt-1 pb-0">
          {node.ports.map(port => (
            <div key={port.id} className="flex flex-col items-center gap-0.5">
              <PortDot port={port} />
              <span className="text-[8px] text-gray-400">{port.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ヘッダ */}
      <div className="px-2 py-1.5 rounded-t-lg flex items-center gap-1.5 font-semibold" style={{ background: node.bg, color: node.color }}>
        <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: node.color, color: node.bg }}>{node.label[0]}</span>
        <span className="leading-tight truncate">{node.label}</span>
        {node.model && <span className="ml-auto text-[9px] opacity-70 truncate">{node.model}</span>}
      </div>

      {node.floor && <div className="px-2 py-0.5 text-[9px] bg-gray-100 text-gray-500 border-b border-gray-200">{node.floor}</div>}

      {/* 左右ポート */}
      {(side === 'left' || side === 'right') && node.ports.length > 0 && (
        <div className="py-1">
          {node.ports.map(port => (
            <div key={port.id} className="flex items-center gap-1 px-1 py-0.5">
              {side === 'left'  && <PortDot port={port} />}
              <span className="flex-1 text-gray-600 text-[10px] px-1 truncate">{port.label}</span>
              {side === 'right' && <PortDot port={port} />}
            </div>
          ))}
        </div>
      )}

      {/* 下ポート */}
      {side === 'bottom' && (
        <div className="flex justify-around px-2 pb-1 pt-0">
          {node.ports.map(port => (
            <div key={port.id} className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-gray-400">{port.label}</span>
              <PortDot port={port} />
            </div>
          ))}
        </div>
      )}

      {/* SFP */}
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
      {node.notes && <div className="px-2 py-1 text-[9px] text-gray-400 border-t border-gray-100 italic truncate">{node.notes}</div>}
    </div>
  );
}
