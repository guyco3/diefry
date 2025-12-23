import { ServiceNode } from '@infra-flow/types';

export const generateDockerCompose = (services: ServiceNode[]) => {
  if (!services || services.length === 0) {
    return "services: {}"; 
  }

  // Map services into valid YAML blocks with EXACT indentation
  const serviceBlocks = services.map(s => {
    const safeId = `service_${s.id.replace(/-/g, '_')}`;
    const image = s.data.serviceType === 'whoami' ? 'traefik/whoami' : 'nginx:alpine';

    // IMPORTANT: Note the exact spacing here
    return `  ${safeId}:
    image: ${image}
    ports:
      - "${s.data.internalPort}:80"
    restart: always`;
  }).join('\n'); // Join them with a single newline

  // Construct the final string - No obsolete version tag, no extra leading newlines
  return `services:\n${serviceBlocks}`;
};

export const generateNginxConfig = (_services: ServiceNode[]) => {
  return `
server {
    listen 80;
    location / {
        return 200 'Welcome to InfraFlow Local VM';
        add_header Content-Type text/plain;
    }
}`;
};

export default { generateDockerCompose, generateNginxConfig };