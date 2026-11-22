# Como publicar um post em `/labs`

English: [labs-authoring-en.md](labs-authoring-en.md)

## 1. Antes de escrever: o que pode ser publicado

Regras do Hack The Box (do plano 09):

- **Pode:** machines, challenges e **Sherlocks aposentados**, Starting Point, módulos Tier 0 da Academy e alguns
  Mini Pro Labs.
- **Não pode:** conteúdo ativo (ainda não aposentado) e **Pro Labs** em geral.
- **Nunca publicar flag**, nem de conteúdo aposentado.
- Nada de engagement real: nenhum dado de cliente, nem anonimizado.

O build ajuda, mas não substitui você:

| O build bloqueia | O build **não** pega |
|---|---|
| `platform: htb` sem `htbKind` ou sem `retiredOn` | data de aposentadoria errada (confira no site do HTB) |
| `retiredOn` no futuro | Mini Pro Lab que não está na lista dos permitidos |
| `htbKind` fora da lista (não existe opção de Pro Lab) | flag em formato diferente de `HTB{...}` ou de hash de `user.txt`/`root.txt` |
| texto `HTB{...}` ou `user.txt`/`root.txt` seguido de hash de 32 caracteres | dado sensível dentro de imagem |
| nível 2 com regra que não está no `rules-index.json` | |
| nível 3 sem print, texto alternativo, lab ou data | |

## 2. Criar o arquivo

```
src/content/labs/<slug>/pt-BR.md
src/content/labs/<slug>/en.md      (opcional, tradução)
```

- `<slug>` em minúsculas com hífen (ex.: `htb-nome-da-maquina`). Vira a URL `/labs/pt/<slug>/` e `/labs/en/<slug>/`.
- Mesmo `<slug>` nos dois idiomas = traduções; o post ganha o link de idioma e o índice mostra a versão no idioma
  escolhido. Um idioma só também vale.
- O campo `lang` precisa bater com o nome do arquivo.

## 3. Frontmatter

Exemplo de machine aposentada:

```yaml
---
title: 'NomeDaMaquina'
summary: 'Duas ou três frases: vetor de entrada, como escalou, o que o blue team veria.'
lang: pt-BR
type: writeup            # writeup | sherlock | note
platform: htb            # htb | ctf | other
htbKind: machine         # machine | challenge | sherlock | starting-point | academy-tier0 | mini-pro-lab
difficulty: medium       # very-easy | easy | medium | hard | insane
os: linux                # linux | windows | freebsd | other
retiredOn: 2025-06-14    # obrigatório para htb, tem de estar no passado
publishedOn: 2026-12-01
attack: [T1190, T1552.001, T1068]
timeline:
  - title: Reconhecimento
    detail: 'O que foi encontrado.'
  - title: Acesso inicial
    detail: 'Como entrou.'
    attack: [T1190]
detection:
  level: 1               # 1 | 2 | 3
  telemetry:
    - 'Fonte de log e evento esperado'
  logic: |
    (lógica da detecção, obrigatória no nível 1)
  logicLanguage: yaml
  notes: 'Limitações da detecção.'
---
```

Para CTF ou outra plataforma: `platform: ctf` (ou `other`) com `platformLabel: 'Nome do CTF 2026'` e, se quiser,
`eventDate`. `htbKind` e `retiredOn` só valem para `htb`.

Campos opcionais: `updatedOn`, `draft: true` (não sai no build), `example: true` (só para os templates).
Notas (`type: note`) não têm `timeline`; o box de detecção é opcional em qualquer tipo.

## 4. Nível de evidência: escolha o que é verdade

| Nível | Use quando | Campos |
|---|---|---|
| 1 Teórico | você sabe qual telemetria apareceria e escreveu a lógica, mas não rodou | `telemetry`, `logic` |
| 2 Regra testada | a regra existe no repositório de detecções, com teste positivo e negativo passando no CI, e está na release fixada em `src/data/rules-index.json` | `telemetry`, `rule` (id do índice), `logic` opcional |
| 3 Validado no lab | você viu o alerta disparar no lab e tem o print | `telemetry`, `screenshot` (ex.: `./alerta.png` na pasta do post), `screenshotAlt`, `lab`, `validatedOn`, `rule` opcional |

Na dúvida, fique no nível menor. Post sem box de detecção também pode sair.

Hoje o `rules-index.json` é um **exemplo** (`"sample": true`); o box mostra um aviso enquanto for assim. Para usar
nível 2 de verdade, fixe uma release real (README, seção "Fixando o índice de regras").

## 5. Corpo do post

Markdown normal. Blocos de código com linguagem (` ```bash `, ` ```http `, ` ```powershell `, ` ```text `) ganham
destaque e botão de copiar. Imagens ficam na pasta do post e entram com `![descrição](./arquivo.png)`.

## 6. Checklist de print (antes de colocar qualquer imagem)

- [ ] **IP da VPN** do HTB (`10.10.14.x`, `10.10.16.x` ou o IP do seu `tun0`) cortado ou borrado.
- [ ] **Usuário**: seu usuário do HTB, do Windows/Kali, nome da máquina local e caminho com `C:\Users\<você>` ou
      `/home/<você>` fora do print.
- [ ] **Tokens e segredos**: cookies, JWT, chaves de API, hashes de senha que não fazem parte do write-up,
      cabeçalho `Authorization`.
- [ ] **Flags**: nenhuma flag em terminal, aba do navegador ou arquivo aberto.
- [ ] Abas, notificações e barra de favoritos sem nada pessoal.
- [ ] Borrado de verdade (pixelado forte ou retângulo sólido); blur leve pode ser revertido.
- [ ] Metadados: exporte de novo como PNG (o build converte para WebP, mas confira a origem).
- [ ] Nível 3: o print é do alerta real, sem montagem.

## 7. Conferir e publicar

```bash
npm run build && npm run verify && npm run check
npm run preview          # abra http://localhost:4321/labs/
```

Confira a página em largura de celular. Faça o commit (`feat(labs): add <nome> write-up`) e abra o PR.

## 8. Os posts de exemplo

`example-writeup`, `example-sherlock` e `example-note` são templates fictícios com `example: true`. Copie a pasta
de um deles para começar e decida se eles continuam publicados quando o primeiro post real sair.
