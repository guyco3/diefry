import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { generateTerraformConfig, generateCloudConfig } from './engine/tf-gen';
import { generateAnsiblePlaybook } from './engine/ans-gen';
import { generateDockerCompose, generateNginxConfig } from './engine/conf-gen';
import { runTool, fetchIps, waitForSsh, getMultipassIp } from './ssh/orchestrator';
import { GraphState } from '@infra-flow/types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/deploy', async (req, res) => {
  const { nodes } = req.body as GraphState;
  const vms = nodes.filter((n: any) => n.type === 'vm-node');
  const services = nodes.filter((n: any) => n.type === 'service-node');

  console.log('Starting deployment with nodes:', nodes);

  const projectPath = path.resolve(__dirname, '../../deployments/local-dev');
  if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });

  try {
    io.emit('deploy-log', { text: "🧰 Stage 1: Provisioning Local VMs..." });

    // Write cloud-init file that the provider expects a path to
    fs.writeFileSync(path.join(projectPath, 'cloud-config.yaml'), generateCloudConfig());

    // Then generate the Terraform JSON which points to ./cloud-config.yaml
    fs.writeFileSync(path.join(projectPath, 'main.tf.json'), generateTerraformConfig(vms));
    
    await runTool('terraform', ['init'], projectPath, io);
    await runTool('terraform', ['apply', '-auto-approve'], projectPath, io);

    for (const vm of vms) {
      // derive the VM name used in Multipass from the label
      const vmName = vm.data.label.toLowerCase().replace(/\s+/g, '-');
      const vmIp = getMultipassIp(vmName);
      if (!vmIp) {
        io.emit('deploy-log', { text: `❌ Could not discover IP for ${vmName}`, type: 'error' });
        continue;
      }
      const vmServices = services.filter((s: any) => s.vmId === vm.id);
      const vmPath = path.join(projectPath, vm.id);
      if (!fs.existsSync(vmPath)) fs.mkdirSync(vmPath);

      console.log(`vm services for ${vm.data.label}`, vmServices);

      fs.writeFileSync(path.join(vmPath, 'docker-compose.yml'), generateDockerCompose(vmServices));
      fs.writeFileSync(path.join(vmPath, 'nginx.conf'), generateNginxConfig(vmServices));
      fs.writeFileSync(path.join(vmPath, 'playbook.yml'), generateAnsiblePlaybook(vmServices));

      io.emit('deploy-log', { text: `📦 Stage 2: Configuring ${vm.data.label} @ ${vmIp}` });

      // Wait briefly for the VM to boot and accept SSH connections
      await waitForSsh(vmIp, io);

      await runTool('ansible-playbook', [
        '-i', `${vmIp},`,
        '--ssh-common-args',
        '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null',
        'playbook.yml'
      ], vmPath, io);
    }

    io.emit('deploy-log', { text: "✅ LOCAL CLUSTER READY", type: 'success' });
    res.sendStatus(200);
  } catch (err: any) {
    io.emit('deploy-log', { text: `❌ FAILED: ${err.message}`, type: 'error' });
    res.status(500).send(err.message);
  }
});

io.on('connection', (socket) => {
  socket.emit('deploy-log', { text: 'Welcome to InfraFlow deploy stream' });
});

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, () => console.log(`API & Socket Running on ${PORT}`));
