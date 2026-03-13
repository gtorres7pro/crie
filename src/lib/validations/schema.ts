import { z } from "zod";

export const attendeeSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Telefone deve estar no formato E.164 (ex: +351912345678)"),
  company: z.string().optional(),
  industry: z.string().min(2, "Indústria é obrigatória"),
  interests: z.array(z.string()).min(1, "Selecione pelo menos um interesse"),
  eventId: z.string().cuid("ID do evento inválido"),
});

export const eventSchema = z.object({
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  description: z.string().optional(),
  date: z.date(),
  location: z.string().min(3, "Localização é obrigatória"),
  capacity: z.number().int().positive("Capacidade deve ser um número positivo"),
  price: z.number().nonnegative("Preço não pode ser negativo"),
  status: z.enum(["active", "archived"]).default("active"),
});

export type AttendeeInput = z.infer<typeof attendeeSchema>;
export type EventInput = z.infer<typeof eventSchema>;
