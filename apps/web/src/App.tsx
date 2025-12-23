import React, { useCallback } from 'react';
import { ReactFlow, Background, Controls, Panel } from 'reactflow';
import { useStore } from './store/useStore';
import VMNode from './nodes/VMNode';
import ServiceNode from './nodes/ServiceNode';
import { DeploymentTerminal } from './components/DeploymentTerminal';
import ConfigSidebar from './components/ConfigSidebar';
import 'reactflow/dist/style.css';

const nodeTypes = { 'vm-node': VMNode, 'service-node': ServiceNode };

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, updateNodeParent, addNode, deleteNode } = useStore();

  const VM_WIDTH = 300
  const VM_HEIGHT = 180

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

  const onNodesDelete = useCallback((deletedNodes: any[]) => {
    deletedNodes.forEach(n => deleteNode(n.id));
  }, [deleteNode]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        deleteKeyCode={["Backspace","Delete"]}
        nodeTypes={nodeTypes} fitView
      >
        <Background />
        <Controls />

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
          <button onClick={deploy} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">DEPLOY ALL</button>
        </Panel>
      </ReactFlow>
      <DeploymentTerminal />
      <ConfigSidebar />
    </div>
  );
}