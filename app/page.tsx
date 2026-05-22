'use client';
import { useState, useCallback, useRef } from 'react';
import { DiagramProvider, useDiagram } from './store/diagramStore';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';

function AppInner() {
  const { state, dispatch } = useDiagram();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(state.diagram.title);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const handleTitleEdit = useCallback(() => {
    setTitleInput(state.diagram.title);
    setEditingTitle(true);
  }, [state.diagram.title]);

  const handleTitleSave = useCallback(() => {
    dispatch({ type: 'SET_TITLE', title: titleInput.trim() || '無題の構成図' });
    setEditingTitle(false);
  }, [titleInput, dispatch]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      {editingTitle && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setEditingTitle(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-800 mb-3 text-sm">構成図のタイトル</h2>
            <input autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700" onClick={() => setEditingTitle(false)}>キャンセル</button>
              <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleTitleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
      <Toolbar onTitleEdit={handleTitleEdit} canvasWrapRef={canvasWrapRef} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas onNodeDoubleClick={() => {}} canvasWrapRef={canvasWrapRef} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <DiagramProvider>
      <AppInner />
    </DiagramProvider>
  );
}
