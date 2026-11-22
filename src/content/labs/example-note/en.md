---
title: 'Example note: triaging JSON access logs with jq'
summary: 'Note template. Three jq one-liners I use to look for path traversal attempts in an Nginx access log written as JSON.'
lang: en
type: note
platform: other
platformLabel: 'Lab notes'
publishedOn: 2026-11-18
example: true
attack: [T1190]
---

> Example note. The log lines it refers to are fictional.

Notes are short: no attack timeline and no detection box. They still go through the same build checks.

## Requests with a traversal sequence

```bash
jq -c 'select(.request_uri | test("\.\./|%2e%2e%2f"; "i"))' access.json
```

## Top source IPs for those requests

```bash
jq -r 'select(.request_uri | test("\.\./|%2e%2e%2f"; "i")) | .remote_addr' access.json | sort | uniq -c | sort -rn | head
```

## Which ones got a 200

```bash
jq -c 'select((.request_uri | test("\.\./"; "i")) and .status == 200) | {time, remote_addr, request_uri}' access.json
```
