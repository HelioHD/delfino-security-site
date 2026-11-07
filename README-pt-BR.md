# Delfino Security — Landing page

Autor: Hélio Delfino Lopes de Alcântara — Pesquisador e pentester web especializado.

Site estático (HTML + CSS + JS puro, sem build) que apresenta os três serviços da Delfino Security:
análise de vulnerabilidades em codebase, pentest automatizado Web + IA e consultoria de
desenvolvimento seguro.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura e textos em PT-BR (padrão) |
| `styles.css` | Visual: tokens de cor/fonte, layout responsivo |
| `main.js` | Configuração de contato, traduções EN, cópia do e-mail e animação do radar |
| `favicon.svg` | Ícone `../` sobre fundo escuro |

## Antes de publicar

1. O número do WhatsApp fica em `WHATSAPP_NUMBER`, no `main.js` (DDI + DDD, só dígitos).
2. Revise os textos que prometem algo ("0 falso positivo").
3. Para editar um texto: altere o PT-BR no `index.html` e o EN correspondente no objeto `EN` de `main.js`
   (mesma chave `data-i18n`).

## Rodar localmente

Abra `index.html` no navegador, ou sirva a pasta:

```bash
py -3 -m http.server 8080
```

## Publicar

- **Vercel:** `npx vercel` dentro da pasta (sem framework, sem build command).
- **Netlify:** arraste a pasta em app.netlify.com/drop.
- **GitHub Pages:** suba a pasta num repositório e ative Pages na branch `main`.

Depois aponte o domínio próprio nas configurações do serviço escolhido.
