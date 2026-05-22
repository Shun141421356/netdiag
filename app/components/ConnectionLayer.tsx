'use client';
import { useMemo } from 'react';
import { useDiagram } from '../store/diagramStore';
import { CABLE_STYLES, getAbsolutePortCenter, controlOffset } from '../types/diagram';

export function ConnectionLayer() {
  const { state, dispatch } = useDiagram();
  const { diagram, selectedConnId } = state;

  const paths = useMemo(() => {
    return diagram.connections.map(conn => {
      const fromNode = diagram.nodes.find(n => n.id === conn.fromNode);
      const toNode   = diagram.nodes.find(n => n.id === conn.toNode);
      if (!fromNode || !toNode) return null;

      const fromPort = fromNode.ports.find(p => p.id === conn.fromPort);
      const toPort   = toNode.ports.find(p => p.id === conn.toPort);
      if (!fromPort || !toPort) return null;

      const fp = getAbsolutePortCenter(fromNode, conn.fromPort);
      const tp = getAbsolutePortCenter(toNode,   conn.toPort);
      const fo = controlOffset(fromPort.side);
      const to = controlOffset(toPort.side);

      const d = `M${fp.x},${fp.y} C${fp.x+fo.dx},${fp.y+fo.dy} ${tp.x+to.dx},${tp.y+to.dy} ${tp.x},${tp.y}`;
      const style = CABLE_STYLES[conn.cableType];
      const isSel = conn.id === selectedConnId;
      const midX  = (fp.x + tp.x) / 2;
      const midY  = (fp.y + tp.y) / 2 - 10;

      return { conn, d, style, isSel, midX, midY };
    }).filter(Boolean);
  }, [diagram.connections, diagram.nodes, selectedConnId]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        {Object.entries(CABLE_STYLES).map(([k, v]) => (
          <marker key={k} id={`arr-${k}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={v.stroke} />
          </marker>
        ))}
      </defs>
      {paths.map(p => {
        if (!p) return null;
        const { conn, d, style, isSel, midX, midY } = p;
        return (
          <g key={conn.id} style={{ pointerEvents: 'all' }}>
            <path d={d} fill="none" stroke="transparent" strokeWidth={12} className="cursor-pointer"
              onClick={() => dispatch({ type: 'SELECT_CONN', id: conn.id })} />
            <path d={d} fill="none"
              stroke={isSel ? '#D85A30' : style.stroke}
              strokeWidth={isSel ? 3 : style.width}
              strokeDasharray={style.dash || undefined}
              markerEnd={`url(#arr-${conn.cableType})`} />
            <text x={midX} y={midY} textAnchor="middle" fontSize={9} fill={style.stroke} opacity={0.75}
              style={{ pointerEvents: 'none', userSelect: 'none' }}>{style.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
