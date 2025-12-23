import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ServiceNode as ServiceNodeType } from '@infra-flow/types';

const ICON_MAP: Record<string, string> = {
  'custom-git': '🚀',
  'nginx': '🌐',
  'whoami': '🔍',
  'redis': '🧠',
  'postgres': '🐘'
};

export function ServiceNode({ data, selected }: NodeProps<ServiceNodeType>) {
  return (
    <div className={`w-56 rounded-lg border-2 bg-white p-4 shadow-sm transition-all ${
      selected ? 'border-blue-500 shadow-lg' : 'border-slate-100'
    }`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-xl shadow-inner">
          {ICON_MAP[data.serviceType] || '📦'}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-bold text-slate-900">{data.label}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{data.serviceType}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-bold text-slate-500">PORT {data.internalPort}</span>
        </div>
        <button className="text-[10px] font-bold text-blue-500 hover:underline">SETTINGS</button>
      </div>

      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />
    </div>
  );
}

export default ServiceNode;
