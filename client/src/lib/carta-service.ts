import { supabaseClient } from './supabase';
import { SupabaseCarta } from '@shared/schema';

// Serviço para acessar diretamente as cartas do Supabase no cliente
export const cartaService = {
  // Busca todas as cartas
  async getAllCartas(): Promise<SupabaseCarta[]> {
    try {
      const { data, error } = await supabaseClient
        .from('cartas_um_chamado_a_edificacao')
        .select('*')
        .order('id_sumary_carta', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar cartas:', error);
      return [];
    }
  },

  // Busca uma carta específica pelo ID
  async getCartaById(id: number): Promise<SupabaseCarta | null> {
    try {
      const { data, error } = await supabaseClient
        .from('cartas_um_chamado_a_edificacao')
        .select('*')
        .eq('id_sumary_carta', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Erro ao buscar carta ${id}:`, error);
      return null;
    }
  }
};