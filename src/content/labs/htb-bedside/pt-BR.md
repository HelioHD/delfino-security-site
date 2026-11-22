---
title: 'Bedside'
summary: 'Duas desserializações de pickle em camadas: um upload de .pickle.gz combinado com um PDF malicioso dispara RCE no pdfminer.six (CVE-2025-64512); de dentro de um container com host networking, um path traversal no dev server lê a chave SSH do host, e um checkpoint .pt malicioso carregado por torch.load via sudo fecha em root.'
lang: pt-BR
type: writeup
platform: htb
htbKind: machine
difficulty: medium
os: linux
retiredOn: 2026-08-30
publishedOn: 2026-11-22
attack: [T1190, T1211, T1210, T1552.004, T1068]
timeline:
  - title: Recon
    detail: 'nmap: 22, 80, 3000 (filtered). O vhost research.bedside.htb é um portal de upload; toda resposta traz X-Powered-By: pdfminer.six.'
  - title: 'Foothold — pickle no pdfminer.six (CVE-2025-64512)'
    detail: 'A allowlist aceita gz. Sobe-se um evil.pickle.gz e um PDF cujo /Encoding aponta com caminho absoluto para ele; o pdfminer carrega o CMap via pickle.loads e executa. RCE como datawrangler num container.'
    attack: [T1190, T1211]
  - title: 'Container com host networking'
    detail: '/proc/net/tcp mostra o container enxergando 127.0.0.1 e as portas do host. A porta 3000 (filtered de fora) está acessível por dentro.'
  - title: 'Lateral → developer (path traversal no dev server)'
    detail: 'O Image Viewer em 3000 (esm.sh/x, Deno) tem path traversal; curl --path-as-is lê a chave SSH de /home/developer.'
    attack: [T1210, T1552.004]
  - title: 'Root — sudo + torch.load (pickle de novo)'
    detail: 'developer pode rodar via sudo um trainer que faz torch.load(weights_only=False) do checkpoint mais recente de /datastore, gravável pelo container. Um .pt malicioso executa como root.'
    attack: [T1068]
detection:
  level: 1
  telemetry:
    - 'Log da aplicação / WAF: upload com extensão .gz ou .pickle.gz no portal de research'
    - 'auditd no container: processo filho de pdf2txt.py/python fazendo execve de /bin/sh ou conexão de rede de saída'
    - 'auditd no host: sudo do bedside_trainer.py seguido de processo python gerando shell; escrita de .pt em /datastore por uid do container'
  logic: |
    title: Processador de PDF gera shell (pickle no pdfminer)
    logsource: { product: linux, service: auditd }
    detection:
      selection:
        syscall: execve
        ppid_comm: ['python3', 'pdf2txt.py']
        exe|endswith: ['/sh', '/bash', '/nc', '/curl']
      condition: selection
  notes: 'Nível 1: não rodado contra log real. A classe do bug (pickle.loads em dado não confiável) não dá sinal próprio; o detectável é o efeito — o worker de PDF virando processo de shell/rede.'
---

> Máquina aposentada do Hack The Box (Season 11). Sem flags.

## Recon

`nmap`: **22, 80, 3000 (filtered)**. O 80 redirecionava para `bedside.htb`. Fuzzing de vhost revelou **`research.bedside.htb`**, um portal de upload de imagens/PDFs. Pista deliberada: toda resposta trazia `X-Powered-By: pdfminer.six`.

## O portal era um cofre

Testei o upload à exaustão e descartei hipótese após hipótese: MIME por magic bytes, nome sanitizado, `/uploads` sem execução de PHP, sem processamento síncrono. Mas a allowlist real incluía **`gz` e `zip`**, e o header gritava pdfminer.

## Foothold — CVE-2025-64512 (pickle no pdfminer.six)

O pdfminer.six (< 20251107) carrega **CMaps** com `pickle.loads()`, e um PDF pode indicar um nome de CMap com **caminho absoluto**, fazendo o `os.path.join` ignorar o diretório base.

1. `gz` é permitido → subi um `evil.pickle.gz` (`__reduce__` → `os.system`);
2. Um PDF com `/Encoding /#2Fvar#2Fwww#2F...#2Fevil` (barras como `#2F`) apontando para o pickle;
3. **Validei o exploit localmente** com uma versão vulnerável antes de disparar.

Um watcher rodava `pdf2txt.py` nos uploads → `pickle.loads` → **RCE**. Shell como `datawrangler` num container.

## Container com host networking

`/proc/net/tcp` mostrou o container enxergando `127.0.0.1` e as portas do host — **host networking**. A porta **3000** (filtered de fora) estava acessível por dentro.

## Lateral → developer (path traversal no dev server)

A 3000 era um Image Viewer em **esm.sh/x** (Deno) com path traversal:

```bash
curl --path-as-is http://127.0.0.1:3000/../../../../../../home/developer/.ssh/id_rsa
```

`ssh developer@host`.

## Root — sudo + torch.load (pickle de novo)

```text
(ALL) NOPASSWD: /usr/bin/python3 /opt/trainer/bedside_trainer.py
```

O trainer carregava o checkpoint mais recente de `/datastore/checkpoints` via `torch.load(..., weights_only=False)` — pickle de novo — e `/datastore` era gravável pelo container. Plantei um `.pt` malicioso e PNGs válidos (senão o `build_model` quebra antes do load). A regra do sudoers exigia o comando **sem argumentos**:

```bash
sudo /usr/bin/python3 /opt/trainer/bedside_trainer.py
```

O `torch.load` desserializou o pickle **como root**.

## Do lado do blue team

A simetria do ataque é a mesma do lado da detecção: as duas desserializações não têm assinatura própria, mas as duas terminam num processo que não devia existir — o worker de PDF ou o trainer virando shell/rede. O sinal mais barato é o upload com extensão `.gz` no portal; o mais confiável é o `auditd` vendo esses dois processos gerarem um shell.
