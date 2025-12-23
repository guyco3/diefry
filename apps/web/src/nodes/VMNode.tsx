import React from 'react';
import { NodeResizer, NodeProps } from 'reactflow';
import { VMNode as VMNodeType } from '@infra-flow/types';

export function VMNode({ data, selected }: NodeProps<VMNodeType>) {
  return (
    <div className={`relative h-full w-full min-w-[300px] min-h-[200px] rounded-xl border-2 border-dashed bg-slate-50/40 p-5 transition-all ${
      selected ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10' : 'border-slate-300'
    }`}>
      <NodeResizer
        minWidth={300}
        minHeight={200}
        isVisible={!!selected}
        lineClassName="border-blue-500"
        handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded"
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Multipass VM</p>
          <h3 className="text-lg font-black text-slate-800">{data.label}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
            {data.cpu} CPU / {data.ram} RAM
          </span>
          <span className="text-[10px] font-mono font-medium text-slate-500">{data.ipAddress}</span>
        </div>
      </div>

      <div className="mt-8 flex h-[calc(100%-60px)] w-full items-center justify-center rounded-lg border border-slate-200 border-opacity-50 bg-white/30 italic text-slate-400 text-xs">
        Drop services here
      </div>
    </div>
  );
}

export default VMNode;
