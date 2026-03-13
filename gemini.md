# Gemini.md - A Constituição do Projeto (CRIE Braga PT)

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
1. Separação estrita entre lógica determinística (Tools) e navegação.
2. Uso obrigatório de POPs na pasta `architecture/`.

## 🏗️ Invariantes Arquiteturais
- Arquitetura de 3 camadas (A.N.T.).
- Todos os segredos em `.env`.
- Logs de manutenção registados aqui.
