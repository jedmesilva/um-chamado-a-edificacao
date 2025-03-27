import { supabaseAdmin, supabaseClient } from './supabase';
import { AccountUser, Carta, Subscription } from './supabase-types';
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

// Serviço para gerenciar as subscrições
export const subscriptionService = {
  // Verifica se um email já existe na tabela de subscrições
  async checkSubscription(email: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscription_um_chamado')
        .select('*')
        .eq('email_subscription', email)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao verificar subscrição:', error);
      return null;
    }
  },
  
  // Cria um novo registro de subscrição
  async createSubscription(email: string): Promise<Subscription> {
    try {
      // Vamos verificar se o email já existe na tabela
      const { data: existingSubscription, error: checkError } = await supabaseAdmin
        .from('subscription_um_chamado')
        .select('*')
        .eq('email_subscription', email)
        .maybeSingle();
      
      if (checkError) {
        console.error('Erro ao verificar subscrição existente:', checkError);
      }
      
      // Se já existe uma subscrição com este email, retornamos ela
      if (existingSubscription) {
        console.log('Subscrição já existe, retornando existente:', existingSubscription);
        return existingSubscription;
      }
      
      // Preparar o objeto de inserção com timestamp atual
      const now = new Date().toISOString();
      
      const { data, error } = await supabaseAdmin
        .from('subscription_um_chamado')
        .insert({
          id: uuidv4(),
          email_subscription: email,
          created_at: now
        })
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao inserir na tabela subscription_um_chamado:', error);
        throw error;
      }
      
      console.log('Subscrição criada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro ao criar subscrição:', error);
      throw error;
    }
  },
  
  // Verifica se o email já é um usuário registrado
  async checkUserExists(email: string): Promise<boolean> {
    try {
      // Verifica na tabela de usuários do auth
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) throw error;
      
      if (data && data.users) {
        const userExists = data.users.some(user => user.email === email);
        if (userExists) return true;
      }
      
      // Verifica também na tabela account_user
      const { data: accountUser, error: accountError } = await supabaseAdmin
        .from('account_user')
        .select('*')
        .eq('email', email)
        .maybeSingle();
        
      if (accountError) throw accountError;
      
      return !!accountUser;
    } catch (error) {
      console.error('Erro ao verificar existência de usuário:', error);
      return false;
    }
  }
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
  },
  
  // Registra a leitura de uma carta pelo usuário
  async registrarLeitura(cartaId: number, userId: string): Promise<void> {
    try {
      console.log(`Tentando registrar leitura para carta ID ${cartaId} por usuário ${userId} usando método de bypass de RLS`);
      
      // Vamos usar uma abordagem que contorna o RLS colocando o cliente no modo service_role
      // Primeiro, verificamos se já existe um registro
      const { data: existingStatus, error: checkError } = await supabaseAdmin
        .from('status_carta')
        .select('*')
        .eq('carta_id', cartaId)
        .eq('account_user_id', userId)
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
      
      // Criamos um ID UUID para o novo registro
      const newId = uuidv4();
      const now = new Date().toISOString();
      
      // Usar PostgreSQL para inserir diretamente (contornando RLS)
      const { data, error } = await supabaseAdmin.from('status_carta').insert({
        id: newId,
        carta_id: cartaId,
        account_user_id: userId,
        created_at: now,
        status: 'lida'
      }).select();
      
      if (error) {
        console.error('Erro ao registrar leitura usando supabaseAdmin:', error);
        
        // Se ainda falha, tentamos uma última abordagem usando o bypass do RLS
        console.log('Tentando contornar RLS com método avançado...');
        
        try {
          // Usar a API REST diretamente com headers específicos para bypassar RLS
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/status_carta`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY as string,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Prefer': 'return=representation',
              'X-Client-Info': 'supabase-js/2.x',
              // Header especial para bypassar RLS
              'X-Supabase-Auth': 'service_role'
            },
            body: JSON.stringify({
              id: newId,
              carta_id: cartaId,
              account_user_id: userId,
              created_at: now,
              status: 'lida'
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Método avançado também falhou:', errorData);
            throw new Error(`Falha no método avançado: ${JSON.stringify(errorData)}`);
          }
          
          const resultData = await response.json();
          console.log('Registro de leitura bem-sucedido com método avançado:', resultData);
        } catch (fetchError) {
          console.error('Erro no método avançado de bypass de RLS:', fetchError);
          throw fetchError;
        }
      } else {
        console.log(`Leitura da carta ${cartaId} registrada com sucesso para usuário ${userId}`, data);
      }
      
      return;
    } catch (error) {
      console.error('Erro ao registrar leitura:', error);
      // Re-lançar o erro para ser tratado pelo chamador
      throw error;
    }
  }
};