import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { generateDockerCompose, generateNginxConfig } from './engine/config-gen';
import { streamDeploy } from './ssh/ssh-manager';
import { GraphState } from '@infra-flow/types';

// Prefer loading the repo-root .env so running from `apps/api` still picks it up
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/deploy', async (req, res) => {
  const { nodes, edges } = req.body as GraphState;
  const vms = nodes.filter((n: any) => n.type === 'vm-node');
  const services = nodes.filter((n: any) => n.type === 'service-node');

  for (const vm of vms) {
    const vmServices = services.filter((s: any) => s.vmId === vm.id);
    const configs = {
      compose: generateDockerCompose(vmServices as any),
      nginx: generateNginxConfig(vmServices as any, edges || [])
    };
    try {
      const sshUser = (vm.data && vm.data.sshUser) ? vm.data.sshUser : 'ubuntu';
      await streamDeploy(vm.data.ipAddress, sshUser, configs, io);
    } catch (e: any) {
      io.emit('deploy-log', { text: `Deployment failed for ${vm.data.ipAddress}: ${e.message}`, type: 'error' });
    }
  }

  res.sendStatus(200);
});

io.on('connection', (socket) => {
  socket.emit('deploy-log', { text: 'Welcome to InfraFlow deploy stream' });
});

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, () => console.log(`API & Socket Running on ${PORT}`));
