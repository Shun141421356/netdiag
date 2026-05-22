'use client';
import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { v4 as uuid } from 'uuid';
import { DiagramNode, Connection, DiagramData, NodeTemplate, CableType, PortSide } from '../types/diagram';
import { migrateJSON, CURRENT_SCHEMA_VERSION } from '../lib/migrate';

interface State {
  diagram: DiagramData;
  selectedNodeId: string | null;
  selectedConnId: string | null;
  mode: 'select' | 'pan' | 'connect';
  connectingCable: CableType;
  connectStep: 0 | 1;
  connectFrom: { nodeId: string; portId: string } | null;
  scale: number;
  panX: number;
  panY: number;
}

type Action =
  | { type: 'ADD_NODE'; node: DiagramNode }
  | { type: 'UPDATE_NODE'; node: DiagramNode }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'RESIZE_NODE'; id: string; width: number; height: number }
  | { type: 'ADD_CONN'; conn: Connection }
  | { type: 'DELETE_CONN'; id: string }
  | { type: 'SELECT_NODE'; id: string | null }
  | { type: 'SELECT_CONN'; id: string | null }
  | { type: 'SET_MODE'; mode: State['mode'] }
  | { type: 'SET_CABLE'; cable: CableType }
  | { type: 'SET_CONNECT_STEP'; step: 0 | 1; from?: { nodeId: string; portId: string } | null }
  | { type: 'SET_SCALE'; scale: number }
  | { type: 'SET_PAN'; x: number; y: number }
  | { type: 'LOAD_DIAGRAM'; diagram: DiagramData }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'CLEAR_ALL' };

function newDiagram(): DiagramData {
  return {
    id: uuid(), title: '新しい構成図', nodes: [], connections: [],
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

function reducer(state: State, action: Action): State {
  const touch = (d: DiagramData): DiagramData => ({ ...d, updatedAt: new Date().toISOString() });
  switch (action.type) {
    case 'ADD_NODE':
      return { ...state, diagram: touch({ ...state.diagram, nodes: [...state.diagram.nodes, action.node] }) };
    case 'UPDATE_NODE':
      return { ...state, diagram: touch({ ...state.diagram, nodes: state.diagram.nodes.map(n => n.id === action.node.id ? action.node : n) }) };
    case 'DELETE_NODE':
      return { ...state, selectedNodeId: state.selectedNodeId === action.id ? null : state.selectedNodeId,
        diagram: touch({ ...state.diagram,
          nodes: state.diagram.nodes.filter(n => n.id !== action.id),
          connections: state.diagram.connections.filter(c => c.fromNode !== action.id && c.toNode !== action.id),
        })};
    case 'MOVE_NODE':
      return { ...state, diagram: touch({ ...state.diagram, nodes: state.diagram.nodes.map(n => n.id === action.id ? { ...n, x: action.x, y: action.y } : n) }) };
    case 'RESIZE_NODE':
      return { ...state, diagram: touch({ ...state.diagram, nodes: state.diagram.nodes.map(n => n.id === action.id ? { ...n, width: action.width, height: action.height } : n) }) };
    case 'ADD_CONN':
      return { ...state, diagram: touch({ ...state.diagram, connections: [...state.diagram.connections, action.conn] }) };
    case 'DELETE_CONN':
      return { ...state, selectedConnId: state.selectedConnId === action.id ? null : state.selectedConnId,
        diagram: touch({ ...state.diagram, connections: state.diagram.connections.filter(c => c.id !== action.id) }) };
    case 'SELECT_NODE': return { ...state, selectedNodeId: action.id, selectedConnId: null };
    case 'SELECT_CONN': return { ...state, selectedConnId: action.id, selectedNodeId: null };
    case 'SET_MODE':    return { ...state, mode: action.mode, connectStep: 0, connectFrom: null };
    case 'SET_CABLE':   return { ...state, connectingCable: action.cable };
    case 'SET_CONNECT_STEP': return { ...state, connectStep: action.step, connectFrom: action.from !== undefined ? action.from : state.connectFrom };
    case 'SET_SCALE':   return { ...state, scale: Math.max(0.3, Math.min(3, action.scale)) };
    case 'SET_PAN':     return { ...state, panX: action.x, panY: action.y };
    case 'LOAD_DIAGRAM':return { ...state, diagram: action.diagram, selectedNodeId: null, selectedConnId: null };
    case 'SET_TITLE':   return { ...state, diagram: touch({ ...state.diagram, title: action.title }) };
    case 'CLEAR_ALL':   return { ...state, diagram: newDiagram(), selectedNodeId: null, selectedConnId: null };
    default: return state;
  }
}

const initState: State = {
  diagram: newDiagram(), selectedNodeId: null, selectedConnId: null,
  mode: 'select', connectingCable: 'sc-lc-1', connectStep: 0, connectFrom: null,
  scale: 1, panX: 0, panY: 0,
};

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);
export function DiagramProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useDiagram() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDiagram must be used within DiagramProvider');
  const { state, dispatch } = ctx;

  const addNodeFromTemplate = useCallback((tmpl: NodeTemplate, x: number, y: number) => {
    const isContainer = tmpl.isContainer ?? false;
    const defaultSide: PortSide = tmpl.defaultPortSide ?? 'right';
    const node: DiagramNode = {
      id: uuid(), type: tmpl.type, label: tmpl.label, x, y,
      width: isContainer ? 260 : 160,
      height: isContainer ? 200 : undefined,
      ports: tmpl.defaultPorts.map(p => ({ id: uuid(), label: p, side: defaultSide })),
      color: tmpl.color, bg: tmpl.bg, sfps: [],
    };
    dispatch({ type: 'ADD_NODE', node });
    return node.id;
  }, [dispatch]);

  const connectPorts = useCallback((fromNode: string, fromPort: string, toNode: string, toPort: string, cableType: CableType) => {
    dispatch({ type: 'ADD_CONN', conn: { id: uuid(), fromNode, fromPort, toNode, toPort, cableType } });
  }, [dispatch]);

  const exportJSON = useCallback(() => {
    const data = { ...state.diagram, schemaVersion: CURRENT_SCHEMA_VERSION };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.diagram.title}.json`;
    a.click();
  }, [state.diagram]);

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const migrated = migrateJSON(raw); // マイグレーション適用
        dispatch({ type: 'LOAD_DIAGRAM', diagram: migrated });
      } catch (err) {
        alert(`読み込みエラー:\n${err instanceof Error ? err.message : '不明なエラー'}`);
      }
    };
    reader.readAsText(file);
  }, [dispatch]);

  return { state, dispatch, addNodeFromTemplate, connectPorts, exportJSON, importJSON };
}
