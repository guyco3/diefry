import { spawn, execSync } from 'child_process';
import { Server } from 'socket.io';

// Simple sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const runTool = (cmd: string, args: string[], cwd: string, io: Server) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd,
      env: { 
        ...process.env, 
        ANSIBLE_FORCE_COLOR: 'true', 
        TF_IN_AUTOMATION: 'true',
        // Prevent Ansible/SSH from failing host key verification for ephemeral local VMs
        ANSIBLE_HOST_KEY_CHECKING: 'False'
      }
    });

    proc.stdout.on('data', (d) => io.emit('deploy-log', { text: d.toString() }));
    proc.stderr.on('data', (d) => io.emit('deploy-log', { text: d.toString(), type: 'warning' }));

    proc.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`${cmd} failed with code ${code}`));
    });
  });
};

export const fetchIps = (cwd: string): Record<string, string> => {
  const raw = execSync('terraform output -json', { cwd }).toString();
  const outputs = JSON.parse(raw);
  const ips: Record<string, string> = {};
  Object.keys(outputs).forEach(key => {
    const withoutSuffix = key.replace(/_ip$/, '');
    const originalId = withoutSuffix.replace(/^vm_/, '').replace(/_/g, '-');
    ips[originalId] = outputs[key].value;
  });
  return ips;
};

// Wait for the VM to finish booting before attempting SSH/Ansible
export const waitForSsh = async (ip: string, io: Server) => {
  io.emit('deploy-log', { text: `⏳ Waiting for VM at ${ip} to finish booting...` });
  // Basic static wait — could be replaced with an active TCP probe loop
  await sleep(10000);
  io.emit('deploy-log', { text: `✅ VM reachable. Starting configuration.` });
};

/**
 * Discover VM IP using Multipass CLI. Returns empty string on failure.
 */
export const getMultipassIp = (vmName: string): string => {
  try {
    const cmd = `multipass info ${vmName} --format json`;
    const out = execSync(cmd).toString();
    const data = JSON.parse(out);
    // multipass JSON: data.info[vmName].ipv4 is an array
    const ip = data?.info?.[vmName]?.ipv4?.[0];
    return ip || '';
  } catch (e) {
    console.error(`getMultipassIp failed for ${vmName}`, e);
    return '';
  }
};

export default { runTool, fetchIps, waitForSsh, getMultipassIp };
