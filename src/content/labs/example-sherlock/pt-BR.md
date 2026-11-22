---
title: 'Exemplo: Quiet Cron (incidente fictício)'
summary: 'Template de Sherlock. A partir de um auth.log e de um crontab fictícios, reconstruo um brute force de SSH que acerta a senha de uma conta local e termina com persistência por cron.'
lang: pt-BR
type: sherlock
platform: other
platformLabel: 'Cenário fictício (exemplo)'
difficulty: very-easy
os: linux
publishedOn: 2026-11-20
example: true
attack: [T1110.001, T1078.003, T1053.003, T1105]
timeline:
  - title: 'Brute force contra o SSH (02:14–02:31 UTC)'
    detail: '412 falhas de senha de 203.0.113.45 contra contas comuns.'
    attack: [T1110.001]
  - title: 'Login válido como deploy (02:31:07 UTC)'
    detail: 'Mesma origem, senha aceita para a conta local deploy.'
    attack: [T1078.003]
  - title: 'Download do implante (02:33 UTC)'
    detail: 'curl baixa um script para /tmp e marca como executável.'
    attack: [T1105]
  - title: 'Persistência por cron (02:34 UTC)'
    detail: 'Nova linha no crontab do deploy executa o script a cada 10 minutos.'
    attack: [T1053.003]
detection:
  level: 1
  telemetry:
    - 'auth.log (sshd): Failed password e Accepted password com IP de origem'
    - 'auditd: execve de curl ou wget com saída em /tmp'
    - 'auditd ou FIM: escrita em /var/spool/cron/crontabs/*'
  logic: |
    title: SSH brute force seguido de login válido
    logsource: { product: linux, service: sshd }
    detection:
      failed:  { message|contains: 'Failed password' }
      success: { message|contains: 'Accepted password' }
    correlation:
      group-by: [src_ip]
      timespan: 30m
      condition: count(failed) >= 20 and count(success) >= 1
  notes: 'Nível 1: a lógica acima ainda não foi rodada contra log nenhum. O limite de 20 falhas é chute inicial.'
---

> Conteúdo fictício. IPs da faixa de documentação 203.0.113.0/24 e hosts inventados. Não é a solução de nenhum Sherlock real.

## Artefatos

O cenário entrega `auth.log` e o diretório `/var/spool/cron/crontabs/` de um servidor `app01`.

## Quando o ataque começou

```bash
grep 'Failed password' auth.log | head -1
grep -c 'Failed password' auth.log
```

```text
Nov 18 02:14:52 app01 sshd[2211]: Failed password for invalid user admin from 203.0.113.45 port 51122 ssh2
412
```

## Qual conta caiu

```bash
grep 'Accepted' auth.log | grep 203.0.113.45
```

```text
Nov 18 02:31:07 app01 sshd[3390]: Accepted password for deploy from 203.0.113.45 port 51987 ssh2
```

## Persistência

```bash
cat var/spool/cron/crontabs/deploy
```

```text
*/10 * * * * /tmp/.cache/update.sh >/dev/null 2>&1
```

## Respostas

| Pergunta | Resposta |
|---|---|
| IP do atacante | `203.0.113.45` |
| Início do brute force | `2026-11-18 02:14:52 UTC` |
| Conta comprometida | `deploy` |
| Mecanismo de persistência | crontab do `deploy`, a cada 10 minutos |
