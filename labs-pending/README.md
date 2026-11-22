# Posts em espera (precisam da data de aposentadoria)

Estes posts já estão escritos no formato do `/labs`, mas **não estão no build** porque falta um
dado que não dá pra inventar: a `retiredOn` real de cada máquina. O build recusa HTB sem data de
aposentadoria ou com data futura (regra do plano 09: só conteúdo aposentado).

## Como publicar cada um

1. Na tua conta do HTB, abra a página da máquina e confirme que ela está **Retired**; anote a data.
2. No arquivo, troque `retiredOn: TODO-AAAA-MM-DD` pela data real (formato `2026-03-14`).
3. Mova a pasta para `src/content/labs/` com o mesmo nome de slug:
   - `labs-pending/htb-abducted/`  →  `src/content/labs/htb-abducted/`
   - `labs-pending/htb-bedside/`   →  `src/content/labs/htb-bedside/`
4. `npm run build` — se a data estiver no passado e válida, o post entra.

Enquanto a data não for confirmada, o post fica aqui e não vai pro ar.

- **Abducted** — Medium Linux. A HTB tem blog do criador sobre a CVE-2026-4480, então a box existe;
  a data de aposentadoria não foi confirmada numa fonte pública.
- **Bedside** — Medium Linux, "Season 11". Não foi possível confirmar que já saiu de ativa. **Confirme
  que está Retired antes de publicar.**
