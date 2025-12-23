export type NodeStatus = 'idle' | 'deploying' | 'active' | 'error';

export interface BaseNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  status: NodeStatus;
}

export interface VMNode extends BaseNode {
  type: 'vm-node';
  data: {
    ipAddress: string;
    sshUser: string;
    cpu: number;
    ram: string;
    disk: string;
  };
}

export interface ServiceNode extends BaseNode {
  type: 'service-node';
  vmId: string | null; // The pointer to the parent VM
  data: {
    serviceType: 'custom-git' | 'nginx' | 'redis' | 'postgres' | 'whoami';
    internalPort: number;
    gitRepo?: string;
  };
}

export interface InfraEdge {
  id: string;
  source: string;
  target: string;
}

export type GraphState = {
  nodes: (VMNode | ServiceNode)[];
  edges: InfraEdge[];
};