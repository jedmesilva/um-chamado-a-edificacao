import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { authService } from "../lib/supabase-service";

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

      // Usar o serviço do Supabase importado para o pré-registro

      try {
        // Criar ou atualizar o pré-registro do usuário
        const accountUser = await authService.createOrUpdateSubscription(email);
        
        // Retorna o email para redirecionamento para página de cadastro completo
        res.status(200).json({ email, userId: accountUser.id });
      } catch (error: any) {
        console.error("Erro ao pré-registrar usuário:", error);
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
