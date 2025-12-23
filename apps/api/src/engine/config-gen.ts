import { ServiceNode, InfraEdge } from '@infra-flow/types';

export const generateDockerCompose = (services: ServiceNode[]) => {
  const body = services.map(s => {
    let imageOrBuild = '';
    if (s.data.serviceType === 'whoami') {
      imageOrBuild = `image: traefik/whoami`;
    } else if (s.data.serviceType === 'custom-git') {
      imageOrBuild = `build: ${s.data.gitRepo || '.'}`;
    } else {
      imageOrBuild = `image: ${s.data.serviceType}`;
    }

    const exposedPort = s.data.serviceType === 'whoami' ? 80 : s.data.internalPort;

    return `\n  ${s.id}:\n    ${imageOrBuild}\n    ports:\n      - "${s.data.internalPort}:${exposedPort}"\n    restart: always`;
  }).join('');

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