import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Letter } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LetterPageProps {
  params: {
    id: string;
  };
}

const LetterPage = ({ params }: LetterPageProps) => {
  const id = params.id;
  const [, setLocation] = useLocation();

  const { data: letter, isLoading, error } = useQuery<Letter>({
    queryKey: [`/api/letters/${id}`],
  });

  const formatDate = (dateString: Date | string) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
  };

  const formatLetterContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-5">{paragraph}</p>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow p-6 md:p-8 max-w-3xl mx-auto w-full">
        <Button
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          onClick={() => setLocation("/dashboard")}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Voltar para todas as cartas
        </Button>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Erro ao carregar a carta. Por favor, tente novamente.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/dashboard")}
            >
              Voltar para o Dashboard
            </Button>
          </div>
        ) : letter ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span>CARTA #{letter.number}</span>
              <span>•</span>
              <span>{formatDate(letter.publishedAt)}</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-6 font-heading">{letter.title}</h1>
            
            <p className="text-gray-700 mb-6">
              {letter.description}
            </p>
            
            <div className="prose max-w-none text-gray-700 space-y-5">
              {formatLetterContent(letter.content)}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Carta não encontrada.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/dashboard")}
            >
              Voltar para o Dashboard
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default LetterPage;
