import React from 'react';
import { useStore } from '../store/useStore';

export function ConfigSidebar() {
  const { nodes, updateNodeData, deleteNode } = useStore();
  const selectedNode = nodes.find((n: any) => n.selected);

  if (!selectedNode) return null;

  return (
    <div className="fixed left-4 top-20 z-50 w-72 rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Configuration</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Label</label>
          <input 
            className="w-full rounded border p-2 text-sm"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
          />
        </div>

        {selectedNode.type === 'vm-node' ? (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Multipass IP</label>
              <input 
                className="w-full rounded border p-2 text-sm font-mono"
                placeholder="192.168.64.x"
                value={selectedNode.data.ipAddress}
                onChange={(e) => updateNodeData(selectedNode.id, { ipAddress: e.target.value })}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Git Repository URL</label>
              <input 
                className="w-full rounded border p-2 text-sm"
                placeholder="https://github.com/..."
                value={selectedNode.data.gitRepo || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { gitRepo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal Port</label>
              <input 
                type="number"
                className="w-full rounded border p-2 text-sm font-mono"
                value={selectedNode.data.internalPort}
                onChange={(e) => updateNodeData(selectedNode.id, { internalPort: parseInt(e.target.value || '0') })}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 border-t border-slate-100 pt-4">
        <button 
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full rounded bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
        >
          🗑 DELETE NODE
        </button>
      </div>
    </div>
  );
}

export default ConfigSidebar;
