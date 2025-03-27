import { Card, CardContent } from "@/components/ui/card";
import { Letter } from "@shared/schema";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LetterCardProps {
  letter: Letter;
}

const LetterCard = ({ letter }: LetterCardProps) => {
  const [, setLocation] = useLocation();

  const formatDate = (dateString: Date | string) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
  };

  const handleCardClick = () => {
    setLocation(`/letter/${letter.id}`);
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={handleCardClick}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">CARTA #{letter.number}</p>
            <h2 className="text-xl font-semibold font-heading">{letter.title}</h2>
          </div>
          <span className="text-sm text-gray-500">{formatDate(letter.publishedAt)}</span>
        </div>
        <p className="text-gray-600 mb-4">{letter.description}</p>
        <span className="inline-block text-gray-800 font-medium hover:text-gray-600">
          Ler Carta Completa →
        </span>
      </CardContent>
    </Card>
  );
};

export default LetterCard;
