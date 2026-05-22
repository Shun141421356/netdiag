export type NodeType =
  | 'rack' | '対向装置' | 'patchpanel'
  | 'mdf' | 'eps' | 'pdboard' | 'idf'
  | 'rosette-1' | 'rosette-4'
  | 'cpe' | 'server'
  | 'ntt-cloud' | 'building' | 'custom';

export type CableType =
  | 'sc-lc-1'
  | 'lc-lc-1' | 'lc-lc-2'
  | 'patch-cat6' | 'patch-om3'
  | 'dark-fiber'
  | 'indoor';

export type PortSide = 'left' | 'right' | 'top' | 'bottom';

export const CONTAINER_TYPES: NodeType[] = ['rack', 'mdf', 'eps', 'building', 'ntt-cloud'];

export interface Port {
  id: string;
  label: string;
  side: PortSide; // ポートごとの向き
}

export interface SFP {
  id: string;
  portId: string;
  type: string;
  notes: string;
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  ports: Port[];
  sfps?: SFP[];
  color: string;
  bg: string;
  model?: string;
  floor?: string;
  notes?: string;
}

export interface Connection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
  cableType: CableType;
}

export interface DiagramData {
  schemaVersion?: number;
  id: string;
  title: string;
  nodes: DiagramNode[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
}

export const CABLE_STYLES: Record<CableType, {
  stroke: string; dash: string; width: number; label: string;
}> = {
  'sc-lc-1':    { stroke: '#185FA5', dash: '',    width: 2, label: 'SC-LC 1芯' },
  'lc-lc-1':    { stroke: '#1D9E75', dash: '',    width: 2, label: 'LC-LC 1芯' },
  'lc-lc-2':    { stroke: '#1D9E75', dash: '6,3', width: 2, label: 'LC-LC 2芯' },
  'patch-cat6': { stroke: '#D85A30', dash: '',    width: 2, label: 'LAN' },
  'patch-om3':  { stroke: '#D4537E', dash: '',    width: 2, label: 'OM3' },
  'dark-fiber': { stroke: '#2C2C2A', dash: '8,3', width: 2, label: 'ダークファイバ' },
  'indoor':     { stroke: '#888780', dash: '5,4', width: 2, label: 'インドア' },
};

export interface NodeTemplate {
  type: NodeType;
  label: string;
  defaultPorts: string[];
  color: string;
  bg: string;
  isContainer?: boolean;
  defaultPortSide?: PortSide;
}

export const NODE_CATEGORIES: { label: string; items: NodeTemplate[] }[] = [
  {
    label: 'NTT局舎',
    items: [
      { type: 'ntt-cloud',  label: 'NTT区間 (雲)',       defaultPorts: ['左','右'],    color: '#3C3489', bg: '#EEEDFE', isContainer: true, defaultPortSide: 'right' },
      { type: 'rack',       label: 'ラック',              defaultPorts: [],              color: '#0C447C', bg: '#B5D4F4', isContainer: true },
      { type: '対向装置',   label: '対向装置',            defaultPorts: ['Port1','Port2','Port3','Port4'], color: '#0C447C', bg: '#B5D4F4', defaultPortSide: 'right' },
      { type: 'patchpanel', label: 'パッチパネル',        defaultPorts: ['1'],           color: '#0C447C', bg: '#B5D4F4', defaultPortSide: 'right' },
    ],
  },
  {
    label: '加入者建物',
    items: [
      { type: 'building',  label: '建物 / フロア',        defaultPorts: [],              color: '#085041', bg: '#9FE1CB', isContainer: true },
      { type: 'mdf',       label: 'MDF（部屋）',          defaultPorts: [],              color: '#085041', bg: '#9FE1CB', isContainer: true },
      { type: 'eps',       label: 'EPS（部屋）',          defaultPorts: [],              color: '#085041', bg: '#9FE1CB', isContainer: true },
      { type: 'pdboard',   label: 'NTT PD板',             defaultPorts: ['出力1','出力2','出力3','出力4'], color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'idf',       label: 'IDF',                  defaultPorts: ['UP','系統1','系統2'],            color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'rosette-1', label: 'ローゼット（1P）',     defaultPorts: ['Port1'],       color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'rosette-4', label: 'ローゼット（4P）',     defaultPorts: ['Port1','Port2','Port3','Port4'], color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'cpe',       label: 'CPE（CRS / CCR等）',   defaultPorts: ['ether1','ether2','ether3','SFP1'], color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'server',    label: 'サーバ',               defaultPorts: ['eth0','eth1','MGMT'],            color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
    ],
  },
  {
    label: '共通',
    items: [
      { type: 'custom', label: 'カスタム機器', defaultPorts: ['Port1','Port2'], color: '#5F5E5A', bg: '#D3D1C7', defaultPortSide: 'right' },
    ],
  },
];

// ポートの相対座標を返す（コンテナ用: 辺の上に配置）
export function getContainerPortPosition(
  node: DiagramNode, port: Port, portIdx: number, portsOnSide: number, sideIdx: number,
): { x: number; y: number } {
  const w = node.width;
  const h = node.height ?? 200;
  const t = (sideIdx + 1) / (portsOnSide + 1);
  switch (port.side) {
    case 'left':   return { x: 0, y: h * t };
    case 'right':  return { x: w, y: h * t };
    case 'top':    return { x: w * t, y: 0 };
    case 'bottom': return { x: w * t, y: h };
  }
}

// 通常ノードのポート相対座標
export function getNormalPortPosition(node: DiagramNode, port: Port, sideIdx: number, portsOnSide: number): { x: number; y: number } {
  const w = node.width;
  const HEADER_H = 26 + (node.floor ? 18 : 0);
  const PORT_H   = 20;
  const t = (sideIdx + 1) / (portsOnSide + 1);

  switch (port.side) {
    case 'left':
    case 'right': {
      // 左右ポートは縦並び: sideIdx番目の行
      const y = HEADER_H + 4 + sideIdx * PORT_H + PORT_H / 2;
      return { x: port.side === 'left' ? 0 : w, y };
    }
    case 'top':    return { x: w * t, y: 0 };
    case 'bottom': {
      // bottom ポートは左右ポートの下に付く
      const leftRightCount  = node.ports.filter(p => p.side === 'left' || p.side === 'right').length;
      const bottomY = HEADER_H + 4 + leftRightCount * PORT_H + 8 + 14;
      return { x: w * t, y: bottomY };
    }
  }
}

// ノードの実高さ
export function getNodeHeight(node: DiagramNode): number {
  if (CONTAINER_TYPES.includes(node.type)) return node.height ?? 200;
  const HEADER_H = 26 + (node.floor ? 18 : 0);
  const lrPorts  = node.ports.filter(p => p.side === 'left' || p.side === 'right').length;
  const tbPorts  = node.ports.filter(p => p.side === 'top'  || p.side === 'bottom').length;
  const portsH   = lrPorts * 20 + (tbPorts > 0 ? 28 : 0) + 8;
  const sfpsH    = (node.sfps?.length ?? 0) * 20;
  const notesH   = node.notes ? 20 : 0;
  return HEADER_H + portsH + sfpsH + notesH;
}

// 絶対座標でのポート中心
export function getAbsolutePortCenter(node: DiagramNode, portId: string): { x: number; y: number } {
  const portIdx = node.ports.findIndex(p => p.id === portId);
  if (portIdx < 0) return { x: node.x + node.width / 2, y: node.y + 20 };
  const port = node.ports[portIdx];

  if (CONTAINER_TYPES.includes(node.type)) {
    const sameSide   = node.ports.filter(p => p.side === port.side);
    const sideIdx    = sameSide.findIndex(p => p.id === portId);
    const rel = getContainerPortPosition(node, port, portIdx, sameSide.length, sideIdx);
    return { x: node.x + rel.x, y: node.y + rel.y };
  }

  const sameSide = node.ports.filter(p => p.side === port.side);
  const sideIdx  = sameSide.findIndex(p => p.id === portId);
  const rel = getNormalPortPosition(node, port, sideIdx, sameSide.length);
  return { x: node.x + rel.x, y: node.y + rel.y };
}

// ポートの向きに応じたベジェ制御点オフセット
export function controlOffset(side: PortSide, dist = 60): { dx: number; dy: number } {
  switch (side) {
    case 'left':   return { dx: -dist, dy: 0 };
    case 'right':  return { dx:  dist, dy: 0 };
    case 'top':    return { dx: 0, dy: -dist };
    case 'bottom': return { dx: 0, dy:  dist };
  }
}
