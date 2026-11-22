---
title: 'Cap'
summary: 'Um IDOR na listagem de capturas do dashboard entrega um pcap antigo com login FTP em texto claro; a senha reusada abre o SSH e uma capability cap_setuid no python3.8 vira root. Do lado do blue team, o sinal é um cliente varrendo /download/ por IDs sequenciais, inclusive o 0.'
lang: pt-BR
type: writeup
platform: htb
htbKind: machine
difficulty: easy
os: linux
retiredOn: 2021-10-02
publishedOn: 2026-11-22
attack: [T1190, T1552.001, T1078, T1548.001]
timeline:
  - title: Recon
    detail: 'nmap aponta 21 (FTP), 22 (SSH) e 80 (HTTP). A porta 80 é um Security Dashboard em Flask que gera capturas de tráfego, cada uma em /download/<id>.'
  - title: 'Foothold — IDOR em /download/0'
    detail: 'O ID da captura é sequencial na URL. Trocar para /download/0 devolve uma captura antiga com um login FTP em texto claro.'
    attack: [T1190, T1552.001]
  - title: 'SSH com credencial reusada'
    detail: 'A senha do FTP vale também no SSH. Shell como nathan.'
    attack: [T1078]
  - title: 'Privesc — capability cap_setuid'
    detail: 'getcap mostra cap_setuid+eip no /usr/bin/python3.8. Um os.setuid(0) seguido de shell vira root sem senha.'
    attack: [T1548.001]
detection:
  level: 1
  telemetry:
    - 'Log de acesso HTTP (gunicorn/nginx): requisições GET /download/<id> com id de sessão e código de resposta'
    - 'auth.log (sshd): Accepted password, com usuário e IP de origem'
    - 'auditd: execve do python3.8 e a transição de uid para 0 (syscall setuid)'
  logic: |
    title: Varredura de IDs sequenciais em /download/ (IDOR)
    logsource: { category: webserver }
    detection:
      selection: { cr_uri_path|startswith: '/download/' , sc_status: 200 }
      condition: selection
    correlation:
      group-by: [src_ip]
      timespan: 5m
      condition: count(distinct cr_uri_path) >= 10
  notes: 'Nível 1: lógica ainda não rodada contra log real. O limite de 10 IDs distintos em 5 min é um chute inicial; uma captura em /download/0 por uma sessão que não é a dona já é suspeita por si só.'
---

> Máquina aposentada do Hack The Box. Sem flags. A credencial abaixo é conhecida publicamente e faz parte do vetor de IDOR.

## Recon

`nmap` mostrou **21 (FTP)**, **22 (SSH)** e **80 (HTTP)**. A porta 80 era um "Security Dashboard" em Flask que gerava capturas de tráfego. Cada relatório vivia em `/download/<id>`.

## Foothold — IDOR

O dashboard entrega as capturas do *seu* ID, mas o ID é sequencial na URL. Trocando para **`/download/0`** apareceu uma captura antiga com um login FTP em texto claro:

```text
nathan:Buck3tH4TF0RM3!
```

A senha estava reusada no SSH:

```bash
ssh nathan@target
```

O erro que quase cometi foi tentar *sniffar* um login FTP ao vivo, refazendo capturas. A vuln era IDOR: ler capturas que **já existiam** em IDs baixos.

> Regra que ficou: **ID sequencial na URL → testar os vizinhos e o `0` primeiro.**

## Privesc — Linux capability

```bash
getcap -r / 2>/dev/null
```

```text
/usr/bin/python3.8 = cap_setuid+eip
```

Um binário com `cap_setuid` deixa trocar de uid sem senha:

```bash
/usr/bin/python3.8 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

Cadeia: **IDOR → credencial no pcap → SSH → abuso de capability**.

## Do lado do blue team

O foothold não explora bug de memória nem manda payload exótico: são requisições HTTP válidas. O que destoa é o **padrão de acesso** — uma mesma origem pedindo `/download/0`, `/download/1`, `/download/2`… em sequência, incluindo IDs que não pertencem à sessão dela. É isso que a regra acima procura.

A capability é a parte mais difícil de pegar por log de aplicação: o sinal confiável vem do host, no `auditd`, vendo o `python3.8` fazer a syscall `setuid(0)` a partir de um processo que não era root.
