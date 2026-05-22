'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { DiagramNode, Connection, CABLE_STYLES, SFP, Port, PortSide, CONTAINER_TYPES } from '../types/diagram';
import { useDiagram } from '../store/diagramStore';

export function PropPanel() {
  const { state, dispatch } = useDiagram();
  const { selectedNodeId, selectedConnId, diagram } = state;
  const node = diagram.nodes.find(n => n.id === selectedNodeId) ?? null;
  const conn = diagram.connections.find(c => c.id === selectedConnId) ?? null;
  if (!node && !conn) return null;
  return (
    <div
      className="absolute right-0 top-0 h-full w-60 bg-white border-l border-gray-200 shadow-lg flex flex-col z-30 text-xs"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      {node && <NodeProp node={node} dispatch={dispatch} />}
      {conn && <ConnProp conn={conn} dispatch={dispatch} nodes={diagram.nodes} />}
    </div>
  );
}

const PORT_SIDES: { value: PortSide; label: string }[] = [
  { value: 'right',  label: '右' },
  { value: 'left',   label: '左' },
  { value: 'top',    label: '上' },
  { value: 'bottom', label: '下' },
];

function NodeProp({ node, dispatch }: { node: DiagramNode; dispatch: React.Dispatch<any> }) {
  const isContainer = CONTAINER_TYPES.includes(node.type);
  const prevId = useRef(node.id);

  const [form, setForm] = useState({
    label: node.label, model: node.model ?? '',
    floor: node.floor ?? '', notes: node.notes ?? '',
  });
  const [ports, setPorts] = useState<Port[]>(node.ports);
  const [sfps,  setSfps]  = useState<SFP[]>(node.sfps ?? []);

  // ノードIDが変わった時だけリセット
  useEffect(() => {
    if (prevId.current === node.id) return;
    prevId.current = node.id;
    setForm({ label: node.label, model: node.model ?? '', floor: node.floor ?? '', notes: node.notes ?? '' });
    setPorts(node.ports);
    setSfps(node.sfps ?? []);
  }, [node.id]);

  // ポート方向即時反映
  const handlePortSide = (side: PortSide) => {
    dispatch({ type: 'UPDATE_NODE', node: { ...node, portSide: side } });
  };

  const save = () => {
    dispatch({ type: 'UPDATE_NODE', node: { ...node, ...form, ports, sfps } });
  };

  const addPort    = () => setPorts(p => [...p, { id: uuid(), label: `Port${p.length + 1}` }]);
  const removePort = (id: string) => setPorts(p => p.filter(x => x.id !== id));
  const renamePort = (id: string, label: string) => setPorts(p => p.map(x => x.id === id ? { ...x, label } : x));
  const addSFP     = () => setSfps(s => [...s, { id: uuid(), portId: ports[0]?.id ?? '', type: '', notes: '' }]);
  const removeSFP  = (id: string) => setSfps(s => s.filter(x => x.id !== id));
  const updateSFP  = (id: string, field: keyof SFP, val: string) => setSfps(s => s.map(x => x.id === id ? { ...x, [field]: val } : x));

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <span className="font-semibold text-gray-700">ノード編集</span>
        <button onClick={() => dispatch({ type: 'SELECT_NODE', id: null })} className="text-gray-400 hover:text-gray-600 p-0.5"><X size={14} /></button>
      </div>

      <div className="p-3 space-y-3 flex-1 overflow-y-auto" onWheel={e => e.stopPropagation()}>
        <Field label="ラベル"><input className="input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></Field>
        <Field label="モデル / 種別"><input className="input" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="例: CRS305-1G-4S+" /></Field>
        <Field label="フロア / 場所"><input className="input" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="例: 3F, B1F" /></Field>

        {/* ポート方向（即時反映） */}
        <Field label="ポート位置">
          <div className="flex gap-1 mt-0.5">
            {PORT_SIDES.map(s => (
              <button key={s.value}
                className={[
                  'flex-1 py-1 rounded border text-[11px] font-medium transition-colors',
                  node.portSide === s.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300',
                ].join(' ')}
                onClick={() => handlePortSide(s.value)}
              >{s.label}</button>
            ))}
          </div>
        </Field>

        <Field label="メモ"><textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>

        {/* ポート一覧 */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">ポート一覧</label>
          <div className="space-y-1 max-h-40 overflow-y-auto" onWheel={e => e.stopPropagation()}>
            {ports.map(port => (
              <div key={port.id} className="flex items-center gap-1">
                <input className="input flex-1" value={port.label} onChange={e => renamePort(port.id, e.target.value)} />
                <button onClick={() => removePort(port.id)} className="text-red-400 hover:text-red-600 p-0.5 flex-shrink-0"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
          <button onClick={addPort} className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 border border-dashed border-gray-300 rounded text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
            <Plus size={11} />ポート追加
          </button>
        </div>

        {/* SFP（コンテナ以外） */}
        {!isContainer && (
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">SFP</label>
            <div className="space-y-2" onWheel={e => e.stopPropagation()}>
              {sfps.map(sfp => (
                <div key={sfp.id} className="bg-gray-50 rounded p-1.5 space-y-1">
                  <div className="flex items-center gap-1">
                    <select className="input flex-1" value={sfp.portId} onChange={e => updateSFP(sfp.id, 'portId', e.target.value)}>
                      <option value="">ポート選択</option>
                      {ports.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <button onClick={() => removeSFP(sfp.id)} className="text-red-400 hover:text-red-600 p-0.5"><Trash2 size={11} /></button>
                  </div>
                  <input className="input" placeholder="種別 例: 1000BASE-SX" value={sfp.type} onChange={e => updateSFP(sfp.id, 'type', e.target.value)} />
                  <input className="input" placeholder="メモ" value={sfp.notes} onChange={e => updateSFP(sfp.id, 'notes', e.target.value)} />
                </div>
              ))}
            </div>
            <button onClick={addSFP} className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 border border-dashed border-gray-300 rounded text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
              <Plus size={11} />SFP追加
            </button>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={save} className="flex-1 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors text-xs">保存</button>
          <button
            onClick={() => { if (confirm('このノードを削除しますか？')) dispatch({ type: 'DELETE_NODE', id: node.id }); }}
            className="px-2 py-1.5 border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors"
          ><Trash2 size={12} /></button>
        </div>
      </div>
    </>
  );
}

function ConnProp({ conn, dispatch, nodes }: { conn: Connection; dispatch: React.Dispatch<any>; nodes: DiagramNode[] }) {
  const fromNode = nodes.find(n => n.id === conn.fromNode);
  const toNode   = nodes.find(n => n.id === conn.toNode);
  const fromPort = fromNode?.ports.find(p => p.id === conn.fromPort);
  const toPort   = toNode?.ports.find(p => p.id === conn.toPort);
  const style    = CABLE_STYLES[conn.cableType];
  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <span className="font-semibold text-gray-700">接続情報</span>
        <button onClick={() => dispatch({ type: 'SELECT_CONN', id: null })} className="text-gray-400 hover:text-gray-600 p-0.5"><X size={14} /></button>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke={style.stroke} strokeWidth={style.width} strokeDasharray={style.dash || undefined} /></svg>
          <span className="font-medium text-gray-700">{style.label}</span>
        </div>
        {[
          { label: '接続元', n: fromNode, p: fromPort },
          { label: '接続先', n: toNode,   p: toPort },
        ].map(({ label, n, p }) => (
          <div key={label} className="bg-gray-50 rounded p-2 space-y-0.5 text-[10px]">
            <div className="text-gray-400">{label}</div>
            <div className="font-medium text-gray-700">{n?.label ?? '—'}</div>
            <div className="text-gray-500">ポート: {p?.label ?? '—'}</div>
          </div>
        ))}
        <button
          onClick={() => { if (confirm('この接続を削除しますか？')) dispatch({ type: 'DELETE_CONN', id: conn.id }); }}
          className="w-full py-1.5 border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1 text-xs"
        ><Trash2 size={12} />削除</button>
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
