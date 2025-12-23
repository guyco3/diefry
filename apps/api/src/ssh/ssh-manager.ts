import { Client } from 'ssh2';
import fs from 'fs';
import { Server } from 'socket.io';

export const streamDeploy = (ip: string, user: string, configs: any, io: Server) => {
  const conn = new Client();
  return new Promise((res, rej) => {
    conn.on('ready', () => {
      io.emit('deploy-log', { text: `Connected to ${ip}` });
      conn.exec(`
        sudo mkdir -p /opt/infraflow && sudo chown ${user}:${user} /opt/infraflow
        echo '${configs.compose}' > /opt/infraflow/docker-compose.yml
        echo '${configs.nginx}' > /opt/infraflow/nginx.conf
        cd /opt/infraflow && sudo docker-compose up -d --build --remove-orphans
      `, (err, stream) => {
        if (err) return rej(err);
        stream.on('data', (d: any) => io.emit('deploy-log', { text: d.toString() }));
        stream.stderr.on('data', (d: any) => io.emit('deploy-log', { text: d.toString(), type: 'error' }));
        stream.on('close', () => { conn.end(); res(true); });
      });
    }).connect({ host: ip, username: user, privateKey: fs.readFileSync(process.env.SSH_KEY_PATH!) });
  });
};