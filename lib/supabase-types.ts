export interface SupabaseUser {
  id: string;
  email?: string;
}

export interface AccountUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  whatsapp?: string;
  status: string;
}

export interface Subscription {
  id: string;
  email_subscription: string;
  created_at: string;
  status?: string; // Tornado opcional para compatibilidade
}

export interface Carta {
  id_sumary_carta: number;
  date_send: string;
  status_carta: string;
  jsonbody_carta: any; // Conteúdo da carta em formato JSON
  markdonw_carta: string; // Conteúdo da carta em formato Markdown
}

export interface SupabaseSchema {
  public: {
    Tables: {
      account_user: {
        Row: AccountUser;
        Insert: Omit<AccountUser, 'id'> & { id?: string };
        Update: Partial<AccountUser>;
      };
      cartas_um_chamado_a_edificacao: {
        Row: Carta;
        Insert: Carta;
        Update: Partial<Carta>;
      };
      subscription_um_chamado: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Subscription>;
      };
    };
  };
  auth: {
    Users: SupabaseUser;
  };
}