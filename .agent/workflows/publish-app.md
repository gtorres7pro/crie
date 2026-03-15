---
description: Deploy automático de app na VPS via Coolify com configuração de DNS na Hostinger
---

Este workflow automatiza o processo de enviar as alterações locais para o GitHub e disparar o deploy no Coolify.

## Pré-requisitos
1. As alterações devem estar testadas localmente.
2. O repositório GitHub deve estar configurado como `gtorres7pro/crie`.

## Passos

### 1. Sincronizar Código com GitHub
Certifica-te de que todas as alterações estão salvas.
// turbo
```bash
git add .
# Substitui a mensagem por algo descritivo se necessário
git commit -m "Deployment fix: Database schema sync and stability improvements"
git push origin main
```

### 2. Disparar Deploy no Coolify
O Coolify disparará o build automaticamente ao detetar o push na branch `main`.
Podes acompanhar o progresso no painel do Coolify ou usando:
// turbo
```bash
# O status deve mudar de 'in_progress' para 'success'
```

### 3. Configuração de DNS na Hostinger (Manual)
Se o domínio `7pro.tech` ou outro domínio (ex: `criebraga.pt`) ainda não estiver a apontar para a VPS:
1. Acede ao painel da **Hostinger**.
2. Vai a **DNS / Nameservers**.
3. Adiciona um registo **A**:
   - **Nome**: `@` (ou subdomínio)
   - **Aponta para**: `IP_DA_TUA_VPS` (Verificar no painel Coolify)
   - **TTL**: 3600
4. No Coolify, garante que o **FQDN** da aplicação está definido corretamente (ex: `https://criebraga.pt`).

### 4. Verificar Status do Deploy
// turbo
```bash
# Verificar se a aplicação está 'running'
```

---
> [!IMPORTANT]
> Lembra-te de verificar se as variáveis de ambiente no Coolify (DATABASE_URL, etc) estão sincronizadas com o `.env` local, especialmente o `NEXTAUTH_URL`.
