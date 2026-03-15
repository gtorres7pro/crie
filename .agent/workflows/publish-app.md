---
description: Deploy automático de app na VPS via Coolify com configuração de DNS na Hostinger
---

Este workflow automatiza o processo de enviar as alterações locais para o GitHub e disparar o deploy no Coolify.

## Pré-requisitos
1. As alterações devem estar testadas localmente.
2. O repositório GitHub deve estar configurado como `gtorres7pro/crie`.

## Passos

### 1. Sincronizar Código com GitHub
// turbo
```bash
git add .
git commit -m "Admin Panel Refinement: API refactor to Prisma and bug fixes"
git push origin main
```

### 2. Disparar Deploy no Coolify
Como o Coolify está configurado para monitorizar a branch `main`, o deploy deve ser iniciado automaticamente se o Webhook estiver configurado. 
Caso contrário, podes usar a ferramenta de MCP ou a UI do Coolify.

Para forçar um reinício (caso as variáveis de ambiente tenham mudado):
// turbo
```bash
# UUID da aplicação 'crie' recuperado: aovr6fy9lmgqjw2siy7bdjri
# (Este comando reinicia a aplicação com o código mais recente da branch main)
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
