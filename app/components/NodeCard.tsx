'use client';
import { useRef, useCallback } from 'react';
import { DiagramNode, Port, CONTAINER_TYPES, getContainerPortPosition, getNormalPortPosition } from '../types/diagram';
import { useDiagram } from '../store/diagramStore';

interface Props {
  node: DiagramNode;
  onDoubleClick: (id: string) => void;
}

export function NodeCard({ node, onDoubleClick }: Props) {
  const { state, dispatch, connectPorts } = useDiagram();
  const isSelected  = state.selectedNodeId === node.id;
  const isContainer = CONTAINER_TYPES.includes(node.type);
  const isNttCloud  = node.type === 'ntt-cloud';
  const isDragging  = useRef(false);
  const dragStart   = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });

  /* ---- drag: コンテナはヘッダのみ、通常ノードは全体 ---- */
  const startDrag = useCallback((e: React.MouseEvent) => {
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
  }, [state.scale, node, dispatch]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.mode === 'connect') return;
    if ((e.target as HTMLElement).closest('[data-port]')) return;
    if ((e.target as HTMLElement).closest('[data-resize]')) return;
    // コンテナは内部クリックを透過させ、ヘッダ([data-drag])のみドラッグ
    if (isContainer && !(e.target as HTMLElement).closest('[data-drag]')) return;
    startDrag(e);
  }, [state.mode, isContainer, startDrag]);

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

  const PortDot = ({ port }: { port: Port }) => {
    const isFrom = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
    return (
      <button data-port={port.id}
        className={['w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 transition-all',
          isConnectMode ? 'cursor-crosshair hover:scale-150' : 'cursor-default',
        ].join(' ')}
        style={{ borderColor: node.color, background: isFrom ? '#3b82f6' : 'white' }}
        onClick={e => handlePortClick(e, port)} title={port.label}
      />
    );
  };

  /* ---- コンテナのポート（絶対位置配置） ---- */
  const ContainerPorts = () => (
    <>
      {node.ports.map((port, idx) => {
        const sameSide = node.ports.filter(p => p.side === port.side);
        const sideIdx  = sameSide.findIndex(p => p.id === port.id);
        const rel = getContainerPortPosition(node, port, idx, sameSide.length, sideIdx);
        const isFrom = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
        return (
          <button key={port.id} data-port={port.id}
            className={['absolute w-3 h-3 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 transition-all z-20',
              isConnectMode ? 'cursor-crosshair hover:scale-150' : 'cursor-default',
            ].join(' ')}
            style={{ left: rel.x, top: rel.y, borderColor: node.color, background: isFrom ? '#3b82f6' : 'white' }}
            onClick={e => handlePortClick(e, port)} title={port.label}
          />
        );
      })}
    </>
  );

  /* ==== NTT雲 ==== */
  if (isNttCloud) {
    const w = node.width, h = node.height ?? 200;
    return (
      <div className={['absolute select-none', isSelected ? 'z-20' : 'z-0'].join(' ')}
        style={{ left: node.x, top: node.y, width: w, height: h }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
      >
        {/* ヘッダバー（ここだけドラッグ可能） */}
        <div data-drag className="absolute top-0 left-0 right-0 h-7 rounded-t-[36px] flex items-center px-4 cursor-move z-10">
          <span className="text-[11px] font-semibold" style={{ color: '#3C3489' }}>{node.label}</span>
        </div>
        <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}>
          <rect x="2" y="2" width={w-4} height={h-4} rx="36" ry="36"
            fill="#EEEDFE" fillOpacity="0.75"
            stroke={isSelected ? '#534AB7' : '#AFA9EC'}
            strokeWidth={isSelected ? 2 : 1.5} strokeDasharray="8,4" />
        </svg>
        <ContainerPorts />
        <div data-resize className="absolute bottom-2 right-3 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70 z-10" onMouseDown={handleResizeDown}>
          <svg viewBox="0 0 12 12"><path d="M2,10 L10,2 M6,10 L10,6" stroke="#534AB7" strokeWidth="1.5" /></svg>
        </div>
      </div>
    );
  }

  /* ==== 通常コンテナ (ラック/MDF/EPS/建物) ==== */
  if (isContainer) {
    return (
      <div className={['absolute rounded-lg border-2 select-none',
          isSelected ? 'border-blue-500' : 'border-dashed',
        ].join(' ')}
        style={{ left: node.x, top: node.y, width: node.width, height: node.height ?? 200,
          background: node.bg + '33', borderColor: isSelected ? '#3b82f6' : node.color + '66', zIndex: 0 }}
        onMouseDown={handleMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
      >
        {/* ヘッダバー: ここだけドラッグ可 */}
        <div data-drag
          className="flex items-center gap-1.5 px-2 py-1.5 cursor-move rounded-t select-none"
          style={{ background: node.bg + 'CC', color: node.color }}
        >
          {/* グリップインジケータ */}
          <div className="flex flex-col gap-0.5 opacity-50 flex-shrink-0">
            <div className="w-4 h-0.5 rounded" style={{ background: node.color }} />
            <div className="w-4 h-0.5 rounded" style={{ background: node.color }} />
            <div className="w-4 h-0.5 rounded" style={{ background: node.color }} />
          </div>
          <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0"
            style={{ background: node.color, color: node.bg }}>{node.label[0]}</span>
          <span className="text-[11px] font-semibold truncate">{node.label}</span>
          {node.floor && <span className="ml-auto text-[9px] opacity-60">{node.floor}</span>}
        </div>
        <ContainerPorts />
        <div data-resize className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70 z-10" onMouseDown={handleResizeDown}>
          <svg viewBox="0 0 12 12"><path d="M2,10 L10,2 M6,10 L10,6" stroke={node.color} strokeWidth="1.5" /></svg>
        </div>
      </div>
    );
  }

  /* ==== 通常ノード ==== */
  // ポートをsideごとに分類
  const topPorts    = node.ports.filter(p => p.side === 'top');
  const bottomPorts = node.ports.filter(p => p.side === 'bottom');
  const leftPorts   = node.ports.filter(p => p.side === 'left');
  const rightPorts  = node.ports.filter(p => p.side === 'right');
  const hasLR = leftPorts.length > 0 || rightPorts.length > 0;
  const maxLR = Math.max(leftPorts.length, rightPorts.length);

  return (
    <div className={['absolute rounded-lg border bg-white text-xs select-none transition-shadow duration-150',
        isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.25)]' : 'border-gray-300 shadow-sm hover:shadow-md',
        isConnectMode ? 'cursor-crosshair' : 'cursor-move',
        isFromNode ? 'ring-2 ring-blue-400 ring-offset-1' : '',
      ].join(' ')}
      style={{ left: node.x, top: node.y, minWidth: node.width, zIndex: isSelected ? 20 : 5 }}
      onMouseDown={handleMouseDown}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
    >
      {/* 上ポート */}
      {topPorts.length > 0 && (
        <div className="flex justify-around px-3 pt-1.5 pb-0 gap-2">
          {topPorts.map(port => (
            <div key={port.id} className="flex flex-col items-center gap-0.5">
              <PortDot port={port} />
              <span className="text-[8px] text-gray-400">{port.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ヘッダ */}
      <div className="px-2 py-1.5 flex items-center gap-1.5 font-semibold"
        style={{ background: node.bg, color: node.color, borderRadius: topPorts.length > 0 ? '0' : '6px 6px 0 0' }}>
        <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0"
          style={{ background: node.color, color: node.bg }}>{node.label[0]}</span>
        <span className="leading-tight truncate">{node.label}</span>
        {node.model && <span className="ml-auto text-[9px] opacity-70 truncate">{node.model}</span>}
      </div>

      {node.floor && (
        <div className="px-2 py-0.5 text-[9px] bg-gray-100 text-gray-500 border-b border-gray-200">{node.floor}</div>
      )}

      {/* 左右ポート（行ごとに左右を対応させる） */}
      {hasLR && (
        <div className="py-1">
          {Array.from({ length: maxLR }).map((_, i) => {
            const lp = leftPorts[i];
            const rp = rightPorts[i];
            return (
              <div key={i} className="flex items-center gap-1 px-1 py-0.5">
                {lp ? <PortDot port={lp} /> : <div className="w-2.5 flex-shrink-0" />}
                <span className="flex-1 text-gray-600 text-[10px] px-1 truncate text-left">
                  {lp?.label ?? ''}
                </span>
                <span className="flex-1 text-gray-600 text-[10px] px-1 truncate text-right">
                  {rp?.label ?? ''}
                </span>
                {rp ? <PortDot port={rp} /> : <div className="w-2.5 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* 下ポート */}
      {bottomPorts.length > 0 && (
        <div className="flex justify-around px-3 pb-1.5 pt-0.5 gap-2 border-t border-gray-100">
          {bottomPorts.map(port => (
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
            <div key={sfp.id} className="text-[9px] text-gray-400 flex gap-1 items-center">
              <span className="bg-gray-100 px-1 rounded font-medium">SFP</span>
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
