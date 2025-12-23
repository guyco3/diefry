import { ServiceNode, InfraEdge } from '@infra-flow/types';

export const generateDockerCompose = (services: ServiceNode[]) => {
  const body = services.map(s => `
  ${s.id}:
    ${s.data.serviceType === 'custom-git' ? `build: ${s.data.gitRepo}` : `image: ${s.data.serviceType}`}
    ports: ["${s.data.internalPort}:${s.data.internalPort}"]
    restart: always`).join('');
  return `version: '3.8'\nservices:${body}`;
};

export const generateNginxConfig = (services: ServiceNode[], edges: InfraEdge[]) => {
  const nginx = services.find(s => s.data.serviceType === 'nginx');
  if (!nginx) return '';
  const routes = edges.filter(e => e.source === nginx.id).map(e => {
    const target = services.find(s => s.id === e.target);
    return `    location / { proxy_pass http://localhost:${target?.data.internalPort}; }`;
  }).join('\n');
  return `server {\n  listen 80;\n${routes}\n}`;
};