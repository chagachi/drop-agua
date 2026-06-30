// Tipos manuais espelhando supabase/migrations/0001_init.sql.
// Quando o projeto Supabase estiver criado, pode-se regenerar com:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export interface Profile {
  id: string
  is_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Empresa {
  id: number
  nome_fantasia: string
  razao_social: string | null
  cnpj: string | null
  ie: string | null
  endereco_cobranca: string | null
  endereco_entrega: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  telefone1: string | null
  telefone2: string | null
  email: string | null
  site: string | null
  valor_entrega: number
  valor_retirada: number
  created_at: string
  updated_at: string
}

export interface Motorista {
  id: number
  nome: string
  telefone: string | null
  celular: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Placa {
  id: number
  placa: string
  created_at: string
  updated_at: string
}

export interface Pedido {
  id: number
  empresa_id: number
  empresa_nome: string
  cnpj: string | null
  motorista_id: number | null
  motorista_nome: string
  placa: string
  local_entrega: string | null
  retirada: boolean
  valor_unitario: number
  quantidade_carga: number
  total_liquido: number
  observacao: string | null
  status: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '13'
  }
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
        Relationships: []
      }
      empresas: {
        Row: Empresa
        Insert: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Empresa, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      motoristas: {
        Row: Motorista
        Insert: Omit<Motorista, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Motorista, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      placas: {
        Row: Placa
        Insert: Omit<Placa, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Placa, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      pedidos: {
        Row: Pedido
        Insert: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Pedido, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
