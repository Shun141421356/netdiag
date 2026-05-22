'use client';
import { useMemo } from 'react';
import { useDiagram } from '../store/diagramStore';
import { CABLE_STYLES, DiagramNode, getPortPosition, getDefaultNodeHeight } from '../types/diagram';

function getAbsolutePortPos(node: DiagramNode, portId: string) {
  const idx = node.ports.findIndex(p => p.id === portId);
  if (idx < 0) return { x: node.x + node.width / 2, y: node.y + 20 };
  const rel = getPortPosition(node, idx, node.ports.length);
  return { x: node.x + rel.x, y: node.y + rel.y };
}

// ポートの向きに応じたベジェ制御点の方向ベクトル
function controlOffset(node: DiagramNode): { dx: number; dy: number } {
  const side = node.portSide;
  const dist = 60;
  if (side === 'left')   return { dx: -dist, dy: 0 };
  if (side === 'right')  return { dx:  dist, dy: 0 };
  if (side === 'top')    return { dx: 0, dy: -dist };
  if (side === 'bottom') return { dx: 0, dy:  dist };
  return { dx: dist, dy: 0 };
}

export function ConnectionLayer() {
  const { state, dispatch } = useDiagram();
  const { diagram, selectedConnId } = state;

  const paths = useMemo(() => {
    return diagram.connections.map(conn => {
      const fromNode = diagram.nodes.find(n => n.id === conn.fromNode);
      const toNode   = diagram.nodes.find(n => n.id === conn.toNode);
      if (!fromNode || !toNode) return null;

      const fp = getAbsolutePortPos(fromNode, conn.fromPort);
      const tp = getAbsolutePortPos(toNode,   conn.toPort);
      const fo = controlOffset(fromNode);
      const to = controlOffset(toNode);

      // ベジェ: 接続元の向きから出て、接続先の向きに入る
      const d = `M${fp.x},${fp.y} C${fp.x + fo.dx},${fp.y + fo.dy} ${tp.x + to.dx},${tp.y + to.dy} ${tp.x},${tp.y}`;

      const style    = CABLE_STYLES[conn.cableType];
      const isSel    = conn.id === selectedConnId;
      const midX     = (fp.x + tp.x) / 2;
      const midY     = (fp.y + tp.y) / 2 - 10;

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
              markerEnd={`url(#arr-${conn.cableType})`}
              className="transition-all duration-150" />
            <text x={midX} y={midY} textAnchor="middle" fontSize={9} fill={style.stroke} opacity={0.75}
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {style.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
