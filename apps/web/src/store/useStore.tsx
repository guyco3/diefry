import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge } from 'reactflow';
import { GraphState } from '@infra-flow/types';
import { v4 as uuid } from 'uuid';

interface StoreActions {
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeParent: (nodeId: string, vmId: string | null) => void;
  addNode: (type: 'vm-node' | 'service-node', initialData?: any) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
  deleteNode: (nodeId: string) => void;
}

export const useStore = create<GraphState & StoreActions>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) as any }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) as any }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) as any }),

  updateNodeParent: (nodeId, vmId) => {
    set({
      nodes: get().nodes.map((node: any) => {
        if (node.id === nodeId && node.type === 'service-node') {
          return { ...node, vmId };
        }
        return node;
      }),
    });
  },

  addNode: (type, initialData = {}) => {
    const id = uuid();
    const newNode: any = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: type === 'vm-node'
        ? { label: 'New VM', ipAddress: '', cpu: 1, ram: '1G', disk: '5G', ...initialData }
        : { label: 'New Service', serviceType: 'custom-git', internalPort: 3000, ...initialData },
      ...(type === 'service-node' ? { vmId: null } : {})
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (nodeId, newData) => {
    set({ nodes: get().nodes.map((n: any) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n) });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n: any) => n.id !== nodeId).map((n: any) => {
        if (n.type === 'service-node' && (n as any).vmId === nodeId) {
          return { ...n, vmId: null };
        }
        return n;
      }),
      edges: get().edges.filter((e: any) => e.source !== nodeId && e.target !== nodeId),
    });
  }
}));