import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge } from 'reactflow';
import { v4 as uuid } from 'uuid';

interface StoreActions {
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setGraph: (nodes: any[], edges: any[]) => void; // New: For loading from Mac
  updateNodeParent: (nodeId: string, vmId: string | null) => void;
  addNode: (type: 'vm-node' | 'service-node', initialData?: any) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
  deleteNode: (nodeId: string) => void;
}

// Minimal type for the graph state
interface GraphState {
  nodes: any[];
  edges: any[];
}

export const useStore = create<GraphState & StoreActions>((set, get) => ({
  nodes: [],
  edges: [],

  // 1. Core Handlers
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

  // 2. Hydration: Sets the entire graph (used when loading from the API)
  setGraph: (nodes, edges) => set({ nodes, edges }),

  // 3. Parent Relationship Logic (Nesting Services in VMs)
  updateNodeParent: (nodeId, vmId) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId && node.type === 'service-node') {
          return { ...node, vmId }; // vmId is top-level for your server filter
        }
        return node;
      }),
    });
  },

  // 4. Factory: Creating new infrastructure nodes
  addNode: (type, initialData = {}) => {
    const id = uuid();
    const newNode: any = {
      id,
      type,
      position: { x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 },
      data: type === 'vm-node'
        ? { label: 'New VM', ipAddress: '', sshUser: 'ubuntu', cpu: 1, ram: '1G', disk: '5G', ...initialData }
        : { label: 'New Service', serviceType: 'custom-git', internalPort: 80, ...initialData },
      ...(type === 'service-node' ? { vmId: null } : {})
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (nodeId, newData) => {
    set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n) });
  },

  // 5. Cleanup: Delete node and clean up orphans
  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId).map((n) => {
        // If we delete a VM, reset its children's parent pointers
        if (n.type === 'service-node' && (n as any).vmId === nodeId) {
          return { ...n, vmId: null };
        }
        return n;
      }),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  }
}));