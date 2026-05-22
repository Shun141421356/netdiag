'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { DiagramNode, Connection, CABLE_STYLES } from '../types/diagram';
import { useDiagram } from '../store/diagramStore';

export function PropPanel() {
  const { state, dispatch } = useDiagram();
  const { selectedNodeId, selectedConnId, diagram } = state;

  const node = diagram.nodes.find(n => n.id === selectedNodeId) ?? null;
  const conn = diagram.connections.find(c => c.id === selectedConnId) ?? null;

  if (!node && !conn) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-56 bg-white border-l border-gray-200 shadow-lg flex flex-col z-20 text-xs overflow-y-auto">
      {node && <NodeProp node={node} dispatch={dispatch} />}
      {conn && <ConnProp conn={conn} dispatch={dispatch} nodes={diagram.nodes} />}
    </div>
  );
}

function NodeProp({ node, dispatch }: { node: DiagramNode; dispatch: React.Dispatch<any> }) {
  const [form, setForm] = useState({ label: node.label, model: node.model ?? '', floor: node.floor ?? '', notes: node.notes ?? '' });
  const [ports, setPorts] = useState(node.ports);

  useEffect(() => {
    setForm({ label: node.label, model: node.model ?? '', floor: node.floor ?? '', notes: node.notes ?? '' });
    setPorts(node.ports);
  }, [node.id]);

  const save = () => {
    dispatch({ type: 'UPDATE_NODE', node: { ...node, ...form, ports } });
  };

  const addPort = () => setPorts(p => [...p, { id: uuid(), label: `Port${p.length + 1}` }]);
  const removePort = (id: string) => setPorts(p => p.filter(x => x.id !== id));
  const renamePort = (id: string, label: string) => setPorts(p => p.map(x => x.id === id ? { ...x, label } : x));

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="font-semibold text-gray-700">ノード編集</span>
        <button onClick={() => dispatch({ type: 'SELECT_NODE', id: null })} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>

      <div className="p-3 space-y-3">
        <Field label="ラベル">
          <input className="input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
        </Field>
        <Field label="モデル / 種別">
          <input className="input" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="例: CRS305-1G-4S+" />
        </Field>
        <Field label="フロア / 場所">
          <input className="input" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="例: 3F, B1F" />
        </Field>
        <Field label="メモ">
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </Field>

        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">ポート一覧</label>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {ports.map(port => (
              <div key={port.id} className="flex items-center gap-1">
                <input
                  className="input flex-1"
                  value={port.label}
                  onChange={e => renamePort(port.id, e.target.value)}
                />
                <button onClick={() => removePort(port.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <button onClick={addPort} className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 border border-dashed border-gray-300 rounded text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
            <Plus size={11} />ポート追加
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} className="flex-1 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors">保存</button>
          <button onClick={() => { if (confirm('このノードを削除しますか？')) dispatch({ type: 'DELETE_NODE', id: node.id }); }} className="px-2 py-1.5 border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>
    </>
  );
}

function ConnProp({ conn, dispatch, nodes }: { conn: Connection; dispatch: React.Dispatch<any>; nodes: DiagramNode[] }) {
  const fromNode = nodes.find(n => n.id === conn.fromNode);
  const toNode = nodes.find(n => n.id === conn.toNode);
  const fromPort = fromNode?.ports.find(p => p.id === conn.fromPort);
  const toPort = toNode?.ports.find(p => p.id === conn.toPort);
  const style = CABLE_STYLES[conn.cableType];

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="font-semibold text-gray-700">接続情報</span>
        <button onClick={() => dispatch({ type: 'SELECT_CONN', id: null })} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 flex-shrink-0 rounded" style={{ background: style.stroke, borderTop: style.dash ? `2px dashed ${style.stroke}` : undefined, height: style.dash ? 0 : 2 }} />
          <span className="font-medium text-gray-700">{style.label}</span>
        </div>
        <div className="bg-gray-50 rounded p-2 space-y-1 text-[10px]">
          <div className="text-gray-500">接続元</div>
          <div className="font-medium">{fromNode?.label ?? '—'}</div>
          <div className="text-gray-500">ポート: {fromPort?.label ?? '—'}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 space-y-1 text-[10px]">
          <div className="text-gray-500">接続先</div>
          <div className="font-medium">{toNode?.label ?? '—'}</div>
          <div className="text-gray-500">ポート: {toPort?.label ?? '—'}</div>
        </div>
        <button onClick={() => { if (confirm('この接続を削除しますか？')) dispatch({ type: 'DELETE_CONN', id: conn.id }); }} className="w-full py-1.5 border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
          <Trash2 size={12} />削除
        </button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
