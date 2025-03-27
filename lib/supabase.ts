import { createClient } from '@supabase/supabase-js';

// Cria o cliente Supabase com as credenciais do ambiente
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente para operações com a chave anônima (seguro para usar no lado do cliente)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com a chave de serviço (apenas para uso no servidor, com privilégios elevados)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);