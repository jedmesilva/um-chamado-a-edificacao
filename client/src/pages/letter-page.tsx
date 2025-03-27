import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Letter, SupabaseCarta } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartaService } from "@/lib/carta-service";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';

interface LetterPageProps {
  params: {
    id: string;
  };
}

const LetterPage = ({ params }: LetterPageProps) => {
  const id = parseInt(params.id);
  const [, setLocation] = useLocation();
  const [cartaSupabase, setCartaSupabase] = useState<SupabaseCarta | null>(null);
  const [isCartaLoading, setIsCartaLoading] = useState(true);
  const [cartaError, setCartaError] = useState<Error | null>(null);

  // Query para buscar carta pela API REST (fallback)
  const { data: letter, isLoading: isLetterLoading, error: letterError } = useQuery<Letter>({
    queryKey: [`/api/letters/${id}`],
    // Desabilitamos esta query se tivermos a carta do Supabase
    enabled: cartaSupabase === null && !isCartaLoading,
  });

  // Efeito para buscar a carta diretamente do Supabase
  useEffect(() => {
    const fetchCarta = async () => {
      try {
        setIsCartaLoading(true);
        const carta = await cartaService.getCartaById(id);
        setCartaSupabase(carta);
        console.log("Carta carregada do Supabase:", carta);
      } catch (error) {
        console.error("Erro ao buscar carta do Supabase:", error);
        setCartaError(error instanceof Error ? error : new Error('Erro desconhecido'));
      } finally {
        setIsCartaLoading(false);
      }
    };

    fetchCarta();
  }, [id]);

  // Determina o estado de carregamento geral
  const isLoading = isCartaLoading || isLetterLoading;
  
  // Determina se há algum erro
  const error = cartaError || letterError;

  const formatDate = (dateString: Date | string) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
  };

  const formatLetterContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-5">{paragraph}</p>
    ));
  };

  // Renderiza o conteúdo da carta do Supabase
  const renderSupabaseCarta = (carta: SupabaseCarta) => {
    const title = carta.jsonbody_carta?.title || 'Sem título';
    const description = carta.jsonbody_carta?.description || carta.jsonbody_carta?.subtitle || 'Sem descrição';
    const number = carta.id_sumary_carta;
    const date = carta.date_send;
    
    // Verifica se temos conteúdo em markdown ou apenas json
    const hasMarkdown = carta.markdonw_carta && carta.markdonw_carta.trim().length > 0;
    const content = hasMarkdown 
      ? carta.markdonw_carta 
      : carta.jsonbody_carta?.content || 'Sem conteúdo';

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span>CARTA #{number}</span>
          <span>•</span>
          <span>{formatDate(date)}</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-6 font-heading">{title}</h1>
        
        <p className="text-gray-700 mb-6">
          {description}
        </p>
        
        <div className="prose max-w-none text-gray-700 space-y-5">
          {hasMarkdown ? (
            <div className="carta-markdown">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 font-heading mt-8" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 font-heading mt-6" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 font-heading mt-5" {...props} />,
                  p: ({node, ...props}) => <p className="mb-5 leading-relaxed text-gray-700" {...props} />,
                  ul: ({node, ...props}) => <ul className="mb-5 list-disc pl-6" {...props} />,
                  ol: ({node, ...props}) => <ol className="mb-5 list-decimal pl-6" {...props} />,
                  li: ({node, ...props}) => <li className="mb-2" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-5 py-2 text-gray-700" {...props} />
                  ),
                  a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            formatLetterContent(content)
          )}
        </div>
      </div>
    );
  };

  // Renderiza o conteúdo da carta da API
  const renderApiLetter = (letter: Letter) => {
    return (
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
    );
  };

  // Renderiza o conteúdo da carta disponível
  const renderLetterContent = () => {
    if (cartaSupabase) {
      return renderSupabaseCarta(cartaSupabase);
    } else if (letter) {
      return renderApiLetter(letter);
    } else {
      return (
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
      );
    }
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
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/dashboard")}
            >
              Voltar para o Dashboard
            </Button>
          </div>
        ) : (
          renderLetterContent()
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default LetterPage;
