import { ServiceNode } from '@infra-flow/types';

export const generateAnsiblePlaybook = (services: ServiceNode[]) => {
  return `
- name: Configure Multipass VM
  hosts: all
  become: yes
  vars:
    ansible_user: ubuntu
    ansible_ssh_private_key_file: "~/.ssh/id_ed25519"
  tasks:
    - name: Install Docker and Dependencies
      apt:
        name: 
          - docker.io
          - docker-compose-v2
        state: present
        update_cache: yes

    - name: Add user to docker group
      user:
        name: ubuntu
        groups: docker
        append: yes

    - name: Ensure Project Directory
      file:
        path: /opt/infraflow
        state: directory
        mode: '0755'

    - name: Copy Configs
      copy:
        src: "{{ item }}"
        dest: "/opt/infraflow/{{ item }}"
      loop:
        - docker-compose.yml
        - nginx.conf

    - name: Start Services
      shell:
        cmd: docker compose up -d --build
        chdir: /opt/infraflow
  `;
};

export default generateAnsiblePlaybook;
