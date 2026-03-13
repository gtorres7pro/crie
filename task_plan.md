# Task Plan - CRIE Braga PT

## 📊 Esquemas de Dados (Payloads)

### Event Schema
```json
{
  "id": "uuid",
  "title": "string",
  "date": "datetime",
  "capacity": "int",
  "price": "float",
  "location": "string",
  "status": "active|archived"
}
```

### Attendee Schema
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "name": "string",
  "phone": "string (E.164)",
  "email": "string",
  "company": "string (optional)",
  "industry": "string",
  "interests": "string[]",
  "paymentStatus": "Pendente|Pago|Gratuito",
  "presenceStatus": "Pendente|Presente|Faltou"
}
```

### Finance Schema
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "type": "Receita|Despesa",
  "amount": "float",
  "description": "string",
  "receiptUrl": "string (nullable)",
  "createdAt": "datetime"
}
```

## ⚖️ Regras Comportamentais
1. **Lógica Primeiro**: Nenhuma inscrição sem validação de email e telefone.
2. **Privilegios**: Apoiadores só acessam a página de Check-in; Admins acessam tudo.
3. **Integridade**: Logs de auditoria para cada alteração de pagamento ou presença.
4. **Sincronismo**: Inscrições no Supabase devem ser espelhadas no Google Sheets via Tool python.

## Fases do Projeto
- [/] **Fase 0: Inicialização** (Definição de Blueprint)
- [ ] **Fase 1: Visão & Lógica (Data Schema & POPs)**
- [ ] **Fase 2: Link (Supabase + Google Auth)**
- [ ] **Fase 3: Arquitetura (A.N.T. - Camadas)**
- [ ] **Fase 4: Estilo (Glassmorphism & UX)**
- [ ] **Fase 5: Gatilho (Deploy Coolify)**

## Objetivos Detalhados
### 1. Frontend Público
- [ ] Landing Page com detalhes do próximo evento.
- [ ] Formulário de Inscrição (Validação de DDI, Empresa, Área, Interesses).
- [ ] Integração com Google Sheets (Mirroring).

### 2. Painel Administrativo (Admin & Apoiadores)
- [ ] Sistema de Autenticação (JWT + Role Based Access Control).
- [ ] Gestão de Eventos (Criar, Editar, Listar).
- [ ] Lista de Inscritos com controle de pagamento (Pendente/Pago/Gratuito).
- [ ] Checklist de Presença (Check-in rápido).
- [ ] Gestão Financeira (Receitas vs Despesas + Upload de Recibos).

### 3. Automação & Logs
- [ ] Emissão de Relatório de Evento por Email (Capacidade, Arrecadação, Presença).
- [ ] Sistema de Audit Logs (Rastrear ações dos usuários).
