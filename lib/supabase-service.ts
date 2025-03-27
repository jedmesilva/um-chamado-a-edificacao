import { supabaseAdmin, supabaseClient } from './supabase';
import { AccountUser, Carta } from './supabase-types';
import { v4 as uuidv4 } from 'uuid';

// Serviço de autenticação e gerenciamento de usuários
export const authService = {
  // Registra um novo usuário com email e senha
  async signUp(email: string, password: string, name: string): Promise<any> {
    try {
      // 1. Cria o usuário na tabela auth.users
      const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirma o email automaticamente
      });

      if (signUpError) throw signUpError;
      
      if (!authUser.user) {
        throw new Error('Falha ao criar usuário no Supabase Auth');
      }

      // 2. Cria o registro na tabela account_user
      const { data: accountUser, error: accountError } = await supabaseAdmin
        .from('account_user')
        .insert({
          id: uuidv4(),
          user_id: authUser.user.id,
          name,
          email,
          status: 'active',
        })
        .select()
        .single();

      if (accountError) throw accountError;

      return { authUser: authUser.user, accountUser };
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  // Faz login com email e senha
  async signIn(email: string, password: string): Promise<any> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Busca informações adicionais do usuário
      const { data: accountUser, error: accountError } = await supabaseClient
        .from('account_user')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (accountError) throw accountError;

      return { session: data.session, user: data.user, accountUser };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  // Cria ou atualiza o usuário na fase de subscrição (apenas email)
  async createOrUpdateSubscription(email: string): Promise<AccountUser> {
    try {
      // Verifica se já existe um usuário com este email
      const { data: existingUser, error: searchError } = await supabaseAdmin
        .from('account_user')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (searchError) throw searchError;

      // Se já existir, retorna o usuário
      if (existingUser) {
        return existingUser;
      }

      // Se não existir, cria um novo registro
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('account_user')
        .insert({
          id: uuidv4(),
          email,
          name: '', // Nome será preenchido depois no cadastro completo
          status: 'subscribed', // Status inicial
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return newUser;
    } catch (error) {
      console.error('Erro ao criar/atualizar subscrição:', error);
      throw error;
    }
  },

  // Finaliza o cadastro do usuário que já havia se inscrito
  async completeRegistration(email: string, name: string, password: string): Promise<any> {
    try {
      // 1. Busca se já existe um account_user com este email
      const { data: existingUser, error: searchError } = await supabaseAdmin
        .from('account_user')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (searchError) throw searchError;

      // 2. Cria o usuário na tabela auth.users
      const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (signUpError) throw signUpError;
      
      if (!authUser.user) {
        throw new Error('Falha ao criar usuário no Supabase Auth');
      }

      // 3. Atualiza ou cria o account_user
      if (existingUser) {
        // Atualiza o usuário existente
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('account_user')
          .update({
            user_id: authUser.user.id,
            name,
            status: 'active',
          })
          .eq('email', email)
          .select()
          .single();

        if (updateError) throw updateError;
        return { authUser: authUser.user, accountUser: updatedUser };
      } else {
        // Cria um novo account_user
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('account_user')
          .insert({
            id: uuidv4(),
            user_id: authUser.user.id,
            name,
            email,
            status: 'active',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return { authUser: authUser.user, accountUser: newUser };
      }
    } catch (error) {
      console.error('Erro ao completar registro:', error);
      throw error;
    }
  },

  // Busca um usuário pelo ID
  async getUserById(userId: string): Promise<AccountUser | null> {
    try {
      const { data, error } = await supabaseClient
        .from('account_user')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      return null;
    }
  },

  // Busca um usuário pelo email
  async getUserByEmail(email: string): Promise<AccountUser | null> {
    try {
      const { data, error } = await supabaseClient
        .from('account_user')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  },
};

// Serviço para gerenciar as cartas
export const cartasService = {
  // Busca todas as cartas
  async getAllCartas(): Promise<Carta[]> {
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
  async getCartaById(id: number): Promise<Carta | null> {
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