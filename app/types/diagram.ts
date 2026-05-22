export type NodeType =
  | 'rack' | 'mux' | 'patchpanel' | 'df' | 'sfp'
  | 'mdf' | 'eps' | 'pdboard' | 'idf'
  | 'rosette-1' | 'rosette-4'
  | 'cpe' | 'server' | 'indoor-cable'
  | 'building' | 'custom';

export type CableType =
  | 'sc-lc-1' | 'sc-lc-2'
  | 'lc-lc-1' | 'lc-lc-2'
  | 'patch-cat6' | 'patch-om3'
  | 'indoor';

export interface Port {
  id: string;
  label: string;
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  ports: Port[];
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
  'sc-lc-1': { stroke: '#185FA5', dash: '', width: 2, label: 'SC-LC 1芯' },
  'sc-lc-2': { stroke: '#185FA5', dash: '6,3', width: 2, label: 'SC-LC 2芯' },
  'lc-lc-1': { stroke: '#1D9E75', dash: '', width: 2, label: 'LC-LC 1芯' },
  'lc-lc-2': { stroke: '#1D9E75', dash: '6,3', width: 2, label: 'LC-LC 2芯' },
  'patch-cat6': { stroke: '#D85A30', dash: '', width: 2, label: 'パッチ Cat6' },
  'patch-om3': { stroke: '#D4537E', dash: '', width: 2, label: 'パッチ OM3' },
  'indoor': { stroke: '#888780', dash: '5,4', width: 2, label: 'インドア' },
};

export interface NodeTemplate {
  type: NodeType;
  label: string;
  defaultPorts: string[];
  color: string;
  bg: string;
  darkColor: string;
  darkBg: string;
}

export const NODE_CATEGORIES: { label: string; items: NodeTemplate[] }[] = [
  {
    label: 'NTT局舎',
    items: [
      { type: 'rack', label: 'ラック', defaultPorts: ['上段', '中段', '下段'], color: '#0C447C', bg: '#B5D4F4', darkColor: '#B5D4F4', darkBg: '#0C447C' },
      { type: 'mux', label: 'Mux / 対向装置', defaultPorts: ['Port1', 'Port2', 'Port3', 'Port4'], color: '#0C447C', bg: '#B5D4F4', darkColor: '#B5D4F4', darkBg: '#0C447C' },
      { type: 'patchpanel', label: 'パッチパネル', defaultPorts: ['1', '2', '3', '4', '5', '6', '7', '8'], color: '#0C447C', bg: '#B5D4F4', darkColor: '#B5D4F4', darkBg: '#0C447C' },
      { type: 'df', label: 'DF（成端箱）', defaultPorts: ['A1', 'A2', 'B1', 'B2'], color: '#0C447C', bg: '#B5D4F4', darkColor: '#B5D4F4', darkBg: '#0C447C' },
      { type: 'sfp', label: 'SFP', defaultPorts: ['TX', 'RX'], color: '#0C447C', bg: '#B5D4F4', darkColor: '#B5D4F4', darkBg: '#0C447C' },
    ],
  },
  {
    label: '加入者建物',
    items: [
      { type: 'mdf', label: 'MDF', defaultPorts: ['系統1', '系統2', '系統3'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'eps', label: 'EPS', defaultPorts: ['PD板1', 'PD板2'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'pdboard', label: 'NTT PD板', defaultPorts: ['出力1', '出力2', '出力3', '出力4'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'idf', label: 'IDF', defaultPorts: ['UP', '系統1', '系統2'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'rosette-1', label: 'ローゼット（1P）', defaultPorts: ['Port1'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'rosette-4', label: 'ローゼット（4P）', defaultPorts: ['Port1', 'Port2', 'Port3', 'Port4'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'cpe', label: 'CPE（CRS / CCR等）', defaultPorts: ['ether1', 'ether2', 'ether3', 'SFP1'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'server', label: 'サーバ', defaultPorts: ['eth0', 'eth1', 'MGMT'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
      { type: 'indoor-cable', label: 'インドアケーブル', defaultPorts: ['A端', 'B端'], color: '#085041', bg: '#9FE1CB', darkColor: '#9FE1CB', darkBg: '#085041' },
    ],
  },
  {
    label: '共通',
    items: [
      { type: 'building', label: '建物 / フロア', defaultPorts: [], color: '#3C3489', bg: '#CECBF6', darkColor: '#CECBF6', darkBg: '#3C3489' },
      { type: 'custom', label: 'カスタム機器', defaultPorts: ['Port1', 'Port2'], color: '#5F5E5A', bg: '#D3D1C7', darkColor: '#D3D1C7', darkBg: '#444441' },
    ],
  },
];
