'use client';
import { useRef, useCallback } from 'react';
import { DiagramNode, Port } from '../types/diagram';
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.mode === 'connect') return;
    if ((e.target as HTMLElement).closest('[data-port]')) return;
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
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [state.mode, state.scale, node, dispatch]);

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

  return (
    <div
      className={[
        'absolute rounded-lg border bg-white text-xs select-none',
        'transition-shadow duration-150',
        isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(24,95,165,0.25)]' : 'border-gray-300 shadow-sm hover:shadow-md',
        isConnectMode ? 'cursor-crosshair' : 'cursor-move',
        isFromNode ? 'ring-2 ring-blue-400 ring-offset-1' : '',
      ].join(' ')}
      style={{ left: node.x, top: node.y, minWidth: node.width, zIndex: isSelected ? 10 : 1 }}
      onMouseDown={handleMouseDown}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(node.id); }}
    >
      {/* Header */}
      <div
        className="px-2 py-1.5 rounded-t-lg flex items-center gap-1.5 font-semibold"
        style={{ background: node.bg, color: node.color }}
      >
        <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: node.color, color: node.bg }}>
          {node.label[0]}
        </span>
        <span className="leading-tight truncate">{node.label}</span>
        {node.model && <span className="ml-auto text-[9px] opacity-70 truncate">{node.model}</span>}
      </div>

      {/* Floor badge */}
      {node.floor && (
        <div className="px-2 py-0.5 text-[9px] bg-gray-100 text-gray-500 border-b border-gray-200">{node.floor}</div>
      )}

      {/* Ports */}
      {node.ports.length > 0 && (
        <div className="py-1">
          {node.ports.map(port => {
            const isFromPort = state.connectFrom?.nodeId === node.id && state.connectFrom?.portId === port.id;
            return (
              <div key={port.id} className="flex items-center gap-1 px-1 py-0.5 group/port">
                {/* Left port dot */}
                <button
                  data-port={port.id}
                  className={[
                    'w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 -ml-1.5 transition-all',
                    isConnectMode ? 'cursor-crosshair hover:scale-150' : 'cursor-default',
                    isFromPort ? 'scale-150 bg-blue-500 border-blue-500' : 'bg-white',
                  ].join(' ')}
                  style={{ borderColor: node.color }}
                  onClick={e => handlePortClick(e, port)}
                  title={`${port.label} (左)`}
                />
                <span className="flex-1 text-gray-600 text-[10px] px-1 truncate">{port.label}</span>
                {/* Right port dot */}
                <button
                  data-port={port.id}
                  className={[
                    'w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 -mr-1.5 transition-all',
                    isConnectMode ? 'cursor-crosshair hover:scale-150' : 'cursor-default',
                    isFromPort ? 'scale-150 bg-blue-500 border-blue-500' : 'bg-white',
                  ].join(' ')}
                  style={{ borderColor: node.color }}
                  onClick={e => handlePortClick(e, port)}
                  title={`${port.label} (右)`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Notes */}
      {node.notes && (
        <div className="px-2 py-1 text-[9px] text-gray-400 border-t border-gray-100 italic truncate">{node.notes}</div>
      )}
    </div>
  );
}
