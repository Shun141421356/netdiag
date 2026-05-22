'use client';
import { useMemo } from 'react';
import { useDiagram } from '../store/diagramStore';
import { CABLE_STYLES, DiagramNode } from '../types/diagram';

function getPortCenter(node: DiagramNode, portId: string, side: 'left' | 'right'): { x: number; y: number } {
  const headerH = 28;
  const floorH = node.floor ? 18 : 0;
  const portH = 18;
  const portIdx = node.ports.findIndex(p => p.id === portId);
  if (portIdx < 0) return { x: node.x + node.width / 2, y: node.y + headerH };
  const y = node.y + headerH + floorH + 4 + portIdx * portH + portH / 2;
  const x = side === 'left' ? node.x : node.x + node.width;
  return { x, y };
}

export function ConnectionLayer() {
  const { state, dispatch } = useDiagram();
  const { diagram, selectedConnId } = state;

  const paths = useMemo(() => {
    return diagram.connections.map(conn => {
      const fromNode = diagram.nodes.find(n => n.id === conn.fromNode);
      const toNode = diagram.nodes.find(n => n.id === conn.toNode);
      if (!fromNode || !toNode) return null;

      const fp = getPortCenter(fromNode, conn.fromPort, 'right');
      const tp = getPortCenter(toNode, conn.toPort, 'left');
      const mx = (fp.x + tp.x) / 2;
      const d = `M${fp.x},${fp.y} C${mx},${fp.y} ${mx},${tp.y} ${tp.x},${tp.y}`;

      const style = CABLE_STYLES[conn.cableType];
      const isSel = conn.id === selectedConnId;
      const midX = (fp.x + tp.x) / 2;
      const midY = (fp.y + tp.y) / 2 - 8;

      return { conn, d, style, isSel, midX, midY };
    }).filter(Boolean);
  }, [diagram.connections, diagram.nodes, selectedConnId]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
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
            {/* Invisible hit area */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              className="cursor-pointer"
              onClick={() => dispatch({ type: 'SELECT_CONN', id: conn.id })}
            />
            {/* Visible line */}
            <path
              d={d}
              fill="none"
              stroke={isSel ? '#D85A30' : style.stroke}
              strokeWidth={isSel ? 3 : style.width}
              strokeDasharray={style.dash || undefined}
              markerEnd={`url(#arr-${conn.cableType})`}
              className="transition-all duration-150"
            />
            {/* Cable label */}
            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              fontSize={9}
              fill={style.stroke}
              opacity={0.8}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {style.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
