import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { generateTerraformConfig, generateCloudConfig } from './engine/tf-gen';
import { generateAnsiblePlaybook } from './engine/ans-gen';
import { generateDockerCompose, generateNginxConfig } from './engine/conf-gen';
import { runTool, getMultipassIp, waitForSsh } from './ssh/orchestrator';
import { GraphState } from '@infra-flow/types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const STATE_FILE = path.resolve(__dirname, '../../deployments/graph-state.json');

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// --- PERSISTENCE ROUTES ---
app.post('/save', (req, res) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send("Save Error");
  }
});

app.get('/load', (req, res) => {
  if (!fs.existsSync(STATE_FILE)) return res.json({ nodes: [], edges: [] });
  const savedState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  try {
    const out = execSync('multipass list --format json').toString();
    const liveVms = JSON.parse(out).list;

    const hydratedNodes = savedState.nodes.map((node: any) => {
      if (node.type === 'vm-node') {
        const vmName = node.data.label.toLowerCase().replace(/\s+/g, '-');
        const liveMatch = liveVms.find((v: any) => v.name === vmName);
        return {
          ...node,
          data: {
            ...node.data,
            ipAddress: liveMatch ? liveMatch.ipv4[0] : '',
            status: liveMatch ? 'online' : 'offline'
          }
        };
      }
      return node;
    });
    res.json({ ...savedState, nodes: hydratedNodes });
  } catch (e) {
    res.json(savedState);
  }
});

// --- DEPLOY ROUTE ---
app.post('/deploy', async (req, res) => {
  const { nodes } = req.body as GraphState;
  const vms = nodes.filter((n: any) => n.type === 'vm-node');
  const services = nodes.filter((n: any) => n.type === 'service-node');
  
  // 1. REBUILD PROTECTION: Ensure the base local-dev directory exists
  const projectPath = path.resolve(__dirname, '../../deployments/local-dev');
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    console.log("📁 Recreated local-dev directory");
  }

  try {
    io.emit('deploy-log', { text: "🧰 Stage 1: Provisioning..." });

    // 2. Write Base Infrastructure Files
    fs.writeFileSync(path.join(projectPath, 'cloud-config.yaml'), generateCloudConfig());
    fs.writeFileSync(path.join(projectPath, 'main.tf.json'), generateTerraformConfig(vms));
    
    // Initialize and Apply Terraform
    await runTool('terraform', ['init'], projectPath, io);
    await runTool('terraform', ['apply', '-auto-approve'], projectPath, io);

    for (const vm of vms) {
      const vmName = vm.data.label.toLowerCase().replace(/\s+/g, '-');
      const vmIp = getMultipassIp(vmName);
      if (!vmIp) {
        io.emit('deploy-log', { text: `❌ Could not discover IP for ${vmName}`, type: 'error' });
        continue;
      }

      // Filter services using top-level vmId
      const vmServices = services.filter((s: any) => s.vmId === vm.id || s.data?.vmId === vm.id);
      
      // 3. VM DIRECTORY REBUILD: Ensure the specific VM folder exists
      const vmPath = path.join(projectPath, vm.id);
      if (!fs.existsSync(vmPath)) {
        fs.mkdirSync(vmPath, { recursive: true });
      }

      // 4. GENERATE CONFIGS: Ensure all files expected by Ansible loop are present
      fs.writeFileSync(path.join(vmPath, 'docker-compose.yml'), generateDockerCompose(vmServices));
      fs.writeFileSync(path.join(vmPath, 'nginx.conf'), generateNginxConfig(vmServices)); // Fixed the missing file error
      fs.writeFileSync(path.join(vmPath, 'playbook.yml'), generateAnsiblePlaybook(vmServices));

      io.emit('deploy-log', { text: `📦 Stage 2: Configuring ${vm.data.label} @ ${vmIp}` });
      
      // Safety wait for the VM's SSH service to be ready
      await waitForSsh(vmIp, io);

      await runTool('ansible-playbook', [
        '-i', `${vmIp},`, 
        '--ssh-common-args', '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null',
        'playbook.yml'
      ], vmPath, io);
    }
    
    io.emit('deploy-log', { text: "✅ DEPLOYMENT COMPLETE", type: 'success' });
    res.sendStatus(200);
  } catch (err: any) {
    io.emit('deploy-log', { text: `❌ FAILED: ${err.message}`, type: 'error' });
    res.status(500).send(err.message);
  }
});

io.on('connection', (socket) => {
  socket.emit('deploy-log', { text: 'Welcome to InfraFlow deploy stream' });
});

const PORT = 3001;
httpServer.listen(PORT, () => console.log(`🚀 API Running on ${PORT}`));