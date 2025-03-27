import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import LetterCard from "@/components/letters/letter-card";
import { Letter } from "@shared/schema";
import { Loader2 } from "lucide-react";

const HomePage = () => {
  const { user } = useSupabaseAuth();
  
  const { data: letters, isLoading, error } = useQuery<Letter[]>({
    queryKey: ["/api/letters"],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-heading">
            Bem-vindo, {user?.user_metadata?.name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-gray-600">Aqui você encontra todas as cartas do Chamado à Edificação.</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Erro ao carregar as cartas. Por favor, tente novamente.</p>
          </div>
        ) : letters && letters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {letters.map((letter) => (
              <LetterCard key={letter.id} letter={letter} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma carta disponível no momento.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
