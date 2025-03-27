import { supabaseClient } from './supabase';
import { SupabaseCarta } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

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
  },
  
  // Registra a leitura de uma carta pelo usuário
  async registrarLeitura(cartaId: number, userId: string): Promise<void> {
    try {
      console.log(`Tentando registrar leitura para carta ${cartaId} e usuário ${userId}`);
      
      // Obter o usuário atual para garantir que temos o ID correto
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário atual:', userError);
        throw userError;
      }
      
      if (!user) {
        console.error('Nenhum usuário autenticado encontrado');
        throw new Error('Usuário não autenticado');
      }
      
      // Usar o ID do usuário atual
      const currentUserId = user.id;
      console.log(`ID do usuário atual: ${currentUserId}`);
      
      // Verifica se já existe um registro para esta carta e usuário
      const { data: existingStatus, error: checkError } = await supabaseClient
        .from('status_carta')
        .select('*')
        .eq('carta_id', cartaId)
        .eq('account_user_id', currentUserId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Erro ao verificar status da carta:', checkError);
        throw checkError;
      }
      
      // Se já existe, não faz nada
      if (existingStatus) {
        console.log('Status da carta já registrado:', existingStatus);
        return;
      }
      
      // Registra a leitura
      const now = new Date().toISOString();
      const { data, error } = await supabaseClient
        .from('status_carta')
        .insert({
          id: uuidv4(),
          carta_id: cartaId,
          account_user_id: currentUserId,
          created_at: now,
          status: 'lida'
        })
        .select();
      
      if (error) {
        console.error('Erro ao registrar leitura da carta:', error);
        throw error;
      }
      
      console.log(`Leitura da carta ${cartaId} registrada para o usuário ${currentUserId}`, data);
    } catch (error) {
      console.error('Erro ao registrar leitura:', error);
      throw error;
    }
  }
};