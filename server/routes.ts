import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { authService, subscriptionService } from "../lib/supabase-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Rota para registro de usuários com perfil no account_user
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ 
          message: "Email, senha e nome são obrigatórios" 
        });
      }

      // Usar o serviço do Supabase importado para o registro completo

      try {
        // Completar o registro do usuário, criando a conta e o perfil
        const result = await authService.completeRegistration(email, name, password);
        
        res.status(201).json({ 
          message: "Usuário criado com sucesso",
          userId: result.authUser.id
        });
      } catch (error: any) {
        console.error("Erro ao registrar usuário:", error);
        
        // Verifica se o erro é por usuário já existente
        if (error.message?.includes('User already registered')) {
          return res.status(409).json({ 
            message: "Este email já está registrado" 
          });
        }
        
        return res.status(500).json({ 
          message: "Erro ao processar cadastro", 
          details: error.message 
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // API Routes
  app.get("/api/letters", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const letters = await storage.getLetters();
      res.json(letters);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/letters/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const letter = await storage.getLetter(parseInt(req.params.id));
      
      if (!letter) {
        return res.status(404).json({ message: "Carta não encontrada" });
      }
      
      res.json(letter);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/subscribe", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      try {
        // 1. Verifica se o usuário já existe no sistema de autenticação
        const userExists = await subscriptionService.checkUserExists(email);
        
        // Se o usuário já existe, redireciona para o login
        if (userExists) {
          return res.status(200).json({ 
            message: "Usuário já cadastrado",
            email,
            redirect: "login"
          });
        }
        
        // 2. Verifica se já existe uma subscrição para este email
        const existingSubscription = await subscriptionService.checkSubscription(email);
        
        // 3. Se não existir, cria um novo registro na tabela subscription_um_chamado
        if (!existingSubscription) {
          await subscriptionService.createSubscription(email);
        }
        
        // 4. Retorna o email para redirecionamento para página de cadastro completo
        res.status(200).json({ 
          message: "Email registrado com sucesso",
          email, 
          redirect: "register" 
        });
      } catch (error: any) {
        console.error("Erro ao processar inscrição:", error);
        return res.status(500).json({ 
          message: "Erro ao processar inscrição", 
          details: error.message 
        });
      }
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
