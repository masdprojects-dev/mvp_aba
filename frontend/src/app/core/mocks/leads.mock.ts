export interface Advisor {
  id: string;
  name: string;
  email: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  stage: string;
  source: string;
  campaign_name: string;
  advisor_id: string | null;   // null = No asignado (Bandeja General)
  advisor_name: string | null; // null = No asignado
  created_at: string;
}

export const MOCK_ADVISORS: Advisor[] = [
  { id: "adv-001", name: "Daniela Rivas", email: "daniela.r@abacrm.com" },
  { id: "adv-002", name: "Miguel Soto", email: "miguel.s@abacrm.com" }
];

export const MOCK_LEADS: Lead[] = [
  {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    first_name: "Carlos",
    last_name: "Gómez",
    email: "carlos.gomez@gmail.com",
    phone: "524491234567",
    stage: "NUEVO",
    source: "Meta Ads",
    campaign_name: "Preventa Norte 2026",
    advisor_id: "adv-001",
    advisor_name: "Daniela Rivas",
    created_at: "2026-08-22T09:15:00Z"
  },
  {
    id: "8d9b9c92-7e3f-4e3a-9c1a-2b9c3f66cde4",
    first_name: "Lucía",
    last_name: "Méndez",
    email: "lucia.mendez@hotmail.com",
    phone: "524499876543",
    stage: "CONTACTADO",
    source: "Google Ads",
    campaign_name: "Search - Casas Residenciales",
    advisor_id: "adv-002",
    advisor_name: "Miguel Soto",
    created_at: "2026-08-21T14:30:00Z"
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    first_name: "Roberto",
    last_name: "Salinas",
    email: "roberto.salinas@empresa.com.mx",
    phone: "524495551234",
    stage: "NUEVO",
    source: "Meta Ads",
    campaign_name: "Retargeting Agosto",
    advisor_id: null,
    advisor_name: null, // Este cayó a la Bandeja General
    created_at: "2026-08-22T11:45:00Z"
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    first_name: "Fernanda",
    last_name: "López",
    email: "fer.lopez99@gmail.com",
    phone: "524491112233",
    stage: "CITA_AGENDADA",
    source: "Landing Page",
    campaign_name: "Orgánico",
    advisor_id: "adv-001",
    advisor_name: "Daniela Rivas",
    created_at: "2026-08-19T10:00:00Z"
  }
];