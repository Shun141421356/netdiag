export type NodeType =
  | 'rack' | '対向装置' | 'patchpanel' | 'df'
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
  portSide: PortSide; // ポートが出る方向
  sfps?: SFP[];
  color: string;
  bg: string;
  model?: string;
  floor?: string;
  notes?: string;
  parentId?: string;
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
  id: string;
  title: string;
  nodes: DiagramNode[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
}

export const CABLE_STYLES: Record<CableType, {
  stroke: string;
  dash: string;
  width: number;
  label: string;
}> = {
  'sc-lc-1':    { stroke: '#185FA5', dash: '',    width: 2, label: 'SC-LC 1芯' },
  'lc-lc-1':    { stroke: '#1D9E75', dash: '',    width: 2, label: 'LC-LC 1芯' },
  'lc-lc-2':    { stroke: '#1D9E75', dash: '6,3', width: 2, label: 'LC-LC 2芯' },
  'patch-cat6': { stroke: '#D85A30', dash: '',    width: 2, label: 'パッチ Cat6' },
  'patch-om3':  { stroke: '#D4537E', dash: '',    width: 2, label: 'パッチ OM3' },
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
      { type: 'ntt-cloud',  label: 'NTT区間 (雲)',   defaultPorts: ['左', '右'], color: '#3C3489', bg: '#EEEDFE', isContainer: true, defaultPortSide: 'right' },
      { type: 'rack',       label: 'ラック',          defaultPorts: [],           color: '#0C447C', bg: '#B5D4F4', isContainer: true },
      { type: '対向装置',   label: '対向装置',        defaultPorts: ['Port1','Port2','Port3','Port4'], color: '#0C447C', bg: '#B5D4F4', defaultPortSide: 'right' },
      { type: 'patchpanel', label: 'パッチパネル',    defaultPorts: ['1','2','3','4','5','6','7','8'], color: '#0C447C', bg: '#B5D4F4', defaultPortSide: 'bottom' },
      { type: 'df',         label: 'DF（ダークファイバ）', defaultPorts: ['A1','A2','B1','B2'], color: '#0C447C', bg: '#B5D4F4', defaultPortSide: 'right' },
    ],
  },
  {
    label: '加入者建物',
    items: [
      { type: 'building',   label: '建物 / フロア',   defaultPorts: [],           color: '#085041', bg: '#9FE1CB', isContainer: true },
      { type: 'mdf',        label: 'MDF（部屋）',     defaultPorts: [],           color: '#085041', bg: '#9FE1CB', isContainer: true },
      { type: 'eps',        label: 'EPS（部屋）',     defaultPorts: [],           color: '#085041', bg: '#9FE1CB', isContainer: true },
      { type: 'pdboard',    label: 'NTT PD板',        defaultPorts: ['出力1','出力2','出力3','出力4'], color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'idf',        label: 'IDF',             defaultPorts: ['UP','系統1','系統2'],           color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'rosette-1',  label: 'ローゼット（1P）',defaultPorts: ['Port1'],    color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'rosette-4',  label: 'ローゼット（4P）',defaultPorts: ['Port1','Port2','Port3','Port4'], color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'cpe',        label: 'CPE（CRS / CCR等）',defaultPorts: ['ether1','ether2','ether3','SFP1'], color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
      { type: 'server',     label: 'サーバ',          defaultPorts: ['eth0','eth1','MGMT'],           color: '#085041', bg: '#9FE1CB', defaultPortSide: 'right' },
    ],
  },
  {
    label: '共通',
    items: [
      { type: 'custom', label: 'カスタム機器', defaultPorts: ['Port1','Port2'], color: '#5F5E5A', bg: '#D3D1C7', defaultPortSide: 'right' },
    ],
  },
];

// ポート位置を計算するユーティリティ
export function getPortPosition(
  node: DiagramNode,
  portIdx: number,
  portCount: number,
): { x: number; y: number } {
  const w = node.width;
  const h = node.height ?? getDefaultNodeHeight(node);
  const side = node.portSide;

  // コンテナはサイドバーのポートを端に並べる
  if (CONTAINER_TYPES.includes(node.type)) {
    if (side === 'left')   return { x: 0,   y: h * (portIdx + 1) / (portCount + 1) };
    if (side === 'right')  return { x: w,   y: h * (portIdx + 1) / (portCount + 1) };
    if (side === 'top')    return { x: w * (portIdx + 1) / (portCount + 1), y: 0 };
    if (side === 'bottom') return { x: w * (portIdx + 1) / (portCount + 1), y: h };
  }

  const headerH = 24 + (node.floor ? 18 : 0);
  const portH = 18;
  const portY = headerH + 4 + portIdx * portH + portH / 2;

  if (side === 'left')   return { x: 0, y: portY };
  if (side === 'right')  return { x: w, y: portY };
  if (side === 'top')    return { x: w * (portIdx + 1) / (portCount + 1), y: 0 };
  if (side === 'bottom') return { x: w * (portIdx + 1) / (portCount + 1), y: h };
  return { x: w, y: portY };
}

export function getDefaultNodeHeight(node: DiagramNode): number {
  if (CONTAINER_TYPES.includes(node.type)) return node.height ?? 180;
  const headerH = 24 + (node.floor ? 18 : 0);
  const portsH  = node.ports.length * 18 + 8;
  const sfpsH   = (node.sfps?.length ?? 0) * 20;
  const notesH  = node.notes ? 20 : 0;
  return headerH + portsH + sfpsH + notesH;
}
