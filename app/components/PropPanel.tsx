'use client';
import { useEffect, useRef } from 'react';
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
    <div className="absolute right-0 top-0 h-full w-64 bg-white border-l border-gray-200 shadow-lg flex flex-col z-30 text-xs"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      {node && <NodeProp node={node} dispatch={dispatch} />}
      {conn && <ConnProp conn={conn} dispatch={dispatch} nodes={diagram.nodes} />}
    </div>
  );
}

const SIDES: { value: PortSide; label: string; short: string }[] = [
  { value: 'right',  label: '右', short: '→' },
  { value: 'left',   label: '左', short: '←' },
  { value: 'top',    label: '上', short: '↑' },
  { value: 'bottom', label: '下', short: '↓' },
];

function SideBtn({ value, current, onChange, small }: { value: PortSide; current: PortSide; onChange: (s: PortSide) => void; small?: boolean }) {
  const s = SIDES.find(x => x.value === value)!;
  return (
    <button
      className={['rounded border font-medium transition-colors',
        small ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-1 text-[11px]',
        current === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300',
      ].join(' ')}
      onClick={() => onChange(value)}
    >{small ? s.short : s.label}</button>
  );
}

function NodeProp({ node, dispatch }: { node: DiagramNode; dispatch: React.Dispatch<any> }) {
  const isContainer = CONTAINER_TYPES.includes(node.type);
  const prevId = useRef(node.id);

  // ノードIDが変わった時だけスクロールリセット
  useEffect(() => { prevId.current = node.id; }, [node.id]);

  // 全変更即時反映
  const update = (patch: Partial<DiagramNode>) => {
    dispatch({ type: 'UPDATE_NODE', node: { ...node, ...patch } });
  };

  const updatePort = (portId: string, patch: Partial<Port>) => {
    update({ ports: node.ports.map(p => p.id === portId ? { ...p, ...patch } : p) });
  };

  const addPort = () => {
    update({ ports: [...node.ports, { id: uuid(), label: `Port${node.ports.length + 1}`, side: node.ports[0]?.side ?? 'right' }] });
  };
  const removePort = (portId: string) => {
    update({ ports: node.ports.filter(p => p.id !== portId) });
  };

  // 一括向き変更
  const setAllSides = (side: PortSide) => {
    update({ ports: node.ports.map(p => ({ ...p, side })) });
  };

  const addSFP = () => {
    update({ sfps: [...(node.sfps ?? []), { id: uuid(), portId: node.ports[0]?.id ?? '', type: '', notes: '' }] });
  };
  const removeSFP = (id: string) => {
    update({ sfps: (node.sfps ?? []).filter(s => s.id !== id) });
  };
  const updateSFP = (id: string, patch: Partial<SFP>) => {
    update({ sfps: (node.sfps ?? []).map(s => s.id === id ? { ...s, ...patch } : s) });
  };

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <span className="font-semibold text-gray-700">ノード編集</span>
        <button onClick={() => dispatch({ type: 'SELECT_NODE', id: null })} className="text-gray-400 hover:text-gray-600 p-0.5"><X size={14} /></button>
      </div>

      <div className="p-3 space-y-3 flex-1 overflow-y-auto" onWheel={e => e.stopPropagation()}>
        {/* 基本情報 */}
        <Field label="ラベル">
          <input className="input" value={node.label}
            onChange={e => update({ label: e.target.value })} />
        </Field>
        <Field label="モデル / 種別">
          <input className="input" value={node.model ?? ''}
            onChange={e => update({ model: e.target.value })} placeholder="例: CRS305-1G-4S+" />
        </Field>
        <Field label="フロア / 場所">
          <input className="input" value={node.floor ?? ''}
            onChange={e => update({ floor: e.target.value })} placeholder="例: 3F, B1F" />
        </Field>
        <Field label="メモ">
          <textarea className="input resize-none" rows={2} value={node.notes ?? ''}
            onChange={e => update({ notes: e.target.value })} />
        </Field>

        {/* ポート一覧 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">ポート一覧</label>
            {/* 一括向き変更 */}
            {node.ports.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-400">一括:</span>
                {SIDES.map(s => (
                  <button key={s.value}
                    className="w-5 h-5 rounded border border-gray-300 text-[10px] text-gray-500 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center"
                    onClick={() => setAllSides(s.value)} title={`全ポートを${s.label}に`}
                  >{s.short}</button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto" onWheel={e => e.stopPropagation()}>
            {node.ports.map(port => (
              <div key={port.id} className="flex items-center gap-1 bg-gray-50 rounded p-1">
                <input
                  className="input flex-1 min-w-0"
                  value={port.label}
                  onChange={e => updatePort(port.id, { label: e.target.value })}
                />
                {/* ポートごとの向きボタン */}
                <div className="flex gap-0.5 flex-shrink-0">
                  {SIDES.map(s => (
                    <button key={s.value}
                      className={['w-5 h-5 rounded border text-[10px] font-bold flex items-center justify-center transition-colors',
                        port.side === s.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-300 hover:border-blue-300',
                      ].join(' ')}
                      onClick={() => updatePort(port.id, { side: s.value })}
                      title={s.label}
                    >{s.short}</button>
                  ))}
                </div>
                <button onClick={() => removePort(port.id)} className="text-red-400 hover:text-red-600 flex-shrink-0 p-0.5"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
          <button onClick={addPort}
            className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 border border-dashed border-gray-300 rounded text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
            <Plus size={11} />ポート追加
          </button>
        </div>

        {/* SFP */}
        {!isContainer && (
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">SFP</label>
            <div className="space-y-2" onWheel={e => e.stopPropagation()}>
              {(node.sfps ?? []).map(sfp => (
                <div key={sfp.id} className="bg-gray-50 rounded p-1.5 space-y-1">
                  <div className="flex items-center gap-1">
                    <select className="input flex-1" value={sfp.portId}
                      onChange={e => updateSFP(sfp.id, { portId: e.target.value })}>
                      <option value="">ポート選択</option>
                      {node.ports.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <button onClick={() => removeSFP(sfp.id)} className="text-red-400 hover:text-red-600 p-0.5"><Trash2 size={11} /></button>
                  </div>
                  <input className="input" placeholder="種別 例: 1000BASE-SX" value={sfp.type}
                    onChange={e => updateSFP(sfp.id, { type: e.target.value })} />
                  <input className="input" placeholder="メモ" value={sfp.notes}
                    onChange={e => updateSFP(sfp.id, { notes: e.target.value })} />
                </div>
              ))}
            </div>
            <button onClick={addSFP}
              className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 border border-dashed border-gray-300 rounded text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
              <Plus size={11} />SFP追加
            </button>
          </div>
        )}

        {/* 削除 */}
        <button
          onClick={() => { if (confirm('このノードを削除しますか？')) dispatch({ type: 'DELETE_NODE', id: node.id }); }}
          className="w-full py-1.5 border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
        ><Trash2 size={12} />ノードを削除</button>
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
        {[{ label: '接続元', n: fromNode, p: fromPort }, { label: '接続先', n: toNode, p: toPort }].map(({ label, n, p }) => (
          <div key={label} className="bg-gray-50 rounded p-2 space-y-0.5 text-[10px]">
            <div className="text-gray-400">{label}</div>
            <div className="font-medium text-gray-700">{n?.label ?? '—'}</div>
            <div className="text-gray-500">ポート: {p?.label ?? '—'}</div>
          </div>
        ))}
        <button onClick={() => { if (confirm('この接続を削除しますか？')) dispatch({ type: 'DELETE_CONN', id: conn.id }); }}
          className="w-full py-1.5 border border-red-300 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1 text-xs">
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
