import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, Panel } from 'reactflow';
import { useStore } from './store/useStore';
import VMNode from './nodes/VMNode';
import ServiceNode from './nodes/ServiceNode';
import { DeploymentTerminal } from './components/DeploymentTerminal';
import ConfigSidebar from './components/ConfigSidebar';
import 'reactflow/dist/style.css';

const nodeTypes = { 'vm-node': VMNode, 'service-node': ServiceNode };

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, updateNodeParent, addNode, deleteNode, setGraph } = useStore();
  
  // Sync Status State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const isInitialRender = useRef(true);

  const VM_WIDTH = 300;
  const VM_HEIGHT = 180;

  // 1. HYDRATION: Load graph and live VM status from Mac on mount
  useEffect(() => {
    fetch('http://localhost:3001/load')
      .then(res => res.json())
      .then(data => {
        if (data.nodes && data.nodes.length > 0) {
          setGraph(data.nodes, data.edges || []);
        }
        // Small delay to ensure Zustand has finished applying state
        setTimeout(() => { isInitialRender.current = false; }, 500);
      })
      .catch(err => console.error("Failed to load environment:", err));
  }, [setGraph]);

  // 2. DEBOUNCED PERSISTENCE: Save changes to disk after 1s of inactivity
  useEffect(() => {
    if (isInitialRender.current) return;

    setSyncStatus('syncing');
    const saveTimer = setTimeout(() => {
      fetch('http://localhost:3001/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      }).then(() => {
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      });
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [nodes, edges]);

  const onNodeDragStop = useCallback((_, node) => {
    if (node.type !== 'service-node') return;
    const parentVM = nodes.find(n =>
      n.type === 'vm-node' &&
      node.position.x > n.position.x && node.position.x < n.position.x + VM_WIDTH &&
      node.position.y > n.position.y && node.position.y < n.position.y + VM_HEIGHT
    );
    updateNodeParent(node.id, parentVM ? parentVM.id : null);
  }, [nodes, updateNodeParent]);

  const deploy = () => fetch('http://localhost:3001/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes, edges }),
  });

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeDragStop={onNodeDragStop}
        onNodesDelete={(deleted) => deleted.forEach(n => deleteNode(n.id))}
        nodeTypes={nodeTypes} fitView
      >
        <Background color="#f1f5f9" variant="dots" />
        <Controls />

        {/* --- SYNC STATUS INDICATOR --- */}
        <Panel position="top-center" className="bg-white/80 backdrop-blur px-4 py-1.5 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 
            syncStatus === 'saved' ? 'bg-emerald-500' : 'bg-slate-300'
          }`} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
            {syncStatus === 'syncing' ? 'Syncing to Mac...' : 
             syncStatus === 'saved' ? 'Local State Saved' : 'System Ready'}
          </span>
        </Panel>

        <Panel position="top-left" className="flex gap-2 bg-white p-2 rounded-lg shadow-md border border-slate-200">
          <button 
            onClick={() => addNode('vm-node')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 rounded"
          >
            ➕ ADD VM
          </button>
          <div className="w-[1px] bg-slate-200" />
          <button 
            onClick={() => addNode('service-node', { serviceType: 'custom-git', label: 'New App' })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 rounded"
          >
            🚀 APP
          </button>
          <button 
            onClick={() => addNode('service-node', { serviceType: 'nginx', label: 'Nginx' })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 rounded"
          >
            🌐 NGINX
          </button>
          <button 
            onClick={() => addNode('service-node', { serviceType: 'whoami', label: 'Debug Tool', internalPort: 80 })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 rounded text-purple-600"
          >
            🔍 WHOAMI
          </button>
        </Panel>

        <Panel position="top-right">
          <button onClick={deploy} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            RUN DEPLOYMENT
          </button>
        </Panel>
      </ReactFlow>
      <DeploymentTerminal />
      <ConfigSidebar />
    </div>
  );
}