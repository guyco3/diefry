import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export function DeploymentTerminal() {
  const [logs, setLogs] = useState<{ text: string; type?: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('deploy-log', (log) => {
      setLogs((prev) => [...prev, log]);
      setIsOpen(true);
    });
    return () => { socket.off('deploy-log'); };
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 h-64 w-full md:w-[600px] bg-black text-green-400 font-mono text-xs p-4 overflow-y-auto border-t-4 border-blue-600">
      <div className="flex justify-between border-b border-green-900 pb-2 mb-2">
        <span>INFRAFLOW_STREAM_V1.0</span>
        <button onClick={() => { setLogs([]); setIsOpen(false); }}>CLOSE</button>
      </div>
      {logs.map((log, i) => (
        <div key={i} className={log.type === 'error' ? 'text-red-500' : ''}>
          {`> ${log.text}`}
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}