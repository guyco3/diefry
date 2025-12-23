import { Client } from 'ssh2';
import fs from 'fs';
import { Server } from 'socket.io';

export const streamDeploy = (ip: string, user: string, configs: { compose: string; nginx: string }, io: Server) => {
  const conn = new Client();
  return new Promise<boolean>((res, rej) => {
    const keyPath = process.env.SSH_KEY_PATH;
    if (!keyPath) {
      const msg = 'SSH_KEY_PATH is not set in environment';
      io.emit('deploy-log', { text: `ERROR: ${msg}`, type: 'error' });
      return rej(new Error(msg));
    }

    let privateKey: Buffer;
    try {
      privateKey = fs.readFileSync(keyPath);
    } catch (err: any) {
      const msg = `Unable to read SSH key at ${keyPath}: ${err.message}`;
      io.emit('deploy-log', { text: `ERROR: ${msg}`, type: 'error' });
      return rej(new Error(msg));
    }

    conn.on('ready', () => {
      io.emit('deploy-log', { text: `Connected to ${ip}` });

      const safeCompose = (configs.compose || '').replace(/'/g, "'\\''");
      const safeNginx = (configs.nginx || '').replace(/'/g, "'\\''");

      const DEPLOYMENT_PIPELINE = `
# 1. IDEMPOTENT DOCKER INSTALLATION
if ! command -v docker &> /dev/null; then
  echo "--- 🛠 Installing Docker ---"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
else
  echo "--- ✅ Docker already installed ---"
fi

# 2. ENSURE DOCKER COMPOSE V2
if ! docker compose version &> /dev/null; then
  echo "--- 🛠 Installing Docker Compose Plugin ---"
  sudo apt-get update && sudo apt-get install -y docker-compose-plugin
else
  echo "--- ✅ Docker Compose already installed ---"
fi

# 3. SETUP INFRA-FLOW DIRECTORY
sudo mkdir -p /opt/infraflow
sudo chown ${user}:${user} /opt/infraflow

# 4. WRITE CONFIGS (These variables are injected by Node.js below)
echo '${safeCompose}' > /opt/infraflow/docker-compose.yml
echo '${safeNginx}' > /opt/infraflow/nginx.conf

# 5. EXECUTE WITH 'sg' TO BYPASS GROUP PERMISSION LAG
echo "--- 🚀 Launching Containers ---"
sg docker -c "cd /opt/infraflow && docker compose up -d --build --remove-orphans"
`;

      conn.exec(DEPLOYMENT_PIPELINE, (err, stream) => {
        if (err) {
          io.emit('deploy-log', { text: `ERROR: ${err.message}`, type: 'error' });
          conn.end();
          return rej(err);
        }

        stream.on('data', (d: any) => {
          io.emit('deploy-log', { text: d.toString() });
        });

        stream.stderr.on('data', (d: any) => {
          io.emit('deploy-log', { text: d.toString() });
        });

        stream.on('close', () => {
          io.emit('deploy-log', { text: "✨ DEPLOYMENT FINISHED", type: 'success' });
          conn.end();
          res(true);
        });
      });
    }).on('error', (e) => {
      io.emit('deploy-log', { text: `Connection error: ${e.message}`, type: 'error' });
      rej(e);
    }).connect({ host: ip, username: user, privateKey });
  });
};