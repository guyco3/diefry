import { VMNode } from '@infra-flow/types';
import fs from 'fs';
import path from 'path';

export const generateTerraformConfig = (vms: VMNode[]) => {
  const resources: any = {};

  vms.forEach((vm) => {
    const resId = `vm_${vm.id.replace(/-/g, '_')}`;

    resources[resId] = {
      name: vm.data.label.toLowerCase().replace(/\s+/g, '-'),
      cpus: 1,
      memory: "1GiB",
      // Point to a file (cloud-config.yaml) that we'll write next to main.tf.json
      cloudinit_file: "./cloud-config.yaml"
    };
  });

  return JSON.stringify({
    terraform: {
      required_providers: {
        multipass: {
          source: "larstobi/multipass",
          version: "~> 1.4.2"
        }
      }
    },
    resource: {
      multipass_instance: resources
    }
    // intentionally no outputs — we'll discover IPs via Multipass CLI
  }, null, 2);
};

// Generate the actual cloud-init YAML that Terraform will read via cloudinit_file
export const generateCloudConfig = () => {
  // Read your local public key (id_ed25519.pub) and inject it directly
  const pubKeyPath = path.join(process.env.HOME || '', '.ssh/id_ed25519.pub');
  const pubKey = fs.readFileSync(pubKeyPath, 'utf8').trim();

  return `#cloud-config
users:
  - name: ubuntu
    groups: sudo
    shell: /bin/bash
    sudo: 'ALL=(ALL) NOPASSWD:ALL'
    ssh_authorized_keys:
      - ${pubKey}

package_update: true
packages:
  - python3
  - python3-apt

runcmd:
  - [ systemctl, enable, ssh ]
  - [ systemctl, start, ssh ]
`;
};

export default generateTerraformConfig;
