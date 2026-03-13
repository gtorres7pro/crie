# Findings - CRIE Braga PT

## Escolhas Tecnológicas
- **Framework**: Next.js (App Router) para SSR e performance.
- **Base de Dados**: Supabase (PostgreSQL) para relações complexas e auth.
- **Espelhamento**: Google Sheets para entrega de dados ao Piloto.
- **Auth**: JWT com cookies HttpOnly e RBAC (Admin/Apoiador).
- **Relatórios**: Gmail API via Python Tool para envio determinístico.
- **Storage**: Supabase Storage para recibos de despesas.

## Restrições e Limitações
- Dependência de credenciais OAuth para Google Sheets.
- Necessidade de configuração de DDI dinâmico no formulário.
