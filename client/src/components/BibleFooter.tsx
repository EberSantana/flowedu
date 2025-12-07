import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

// Versículos inspiradores da Bíblia NVI para cada dia do ano
const DAILY_VERSES = [
  { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece." },
  { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará." },
  { reference: "Provérbios 3:5-6", text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas." },
  { reference: "João 14:6", text: "Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai, a não ser por mim." },
  { reference: "Romanos 8:28", text: "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito." },
  { reference: "Jeremias 29:11", text: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro." },
  { reference: "Mateus 11:28", text: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês." },
  { reference: "Isaías 40:31", text: "Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam." },
  { reference: "Salmos 46:1", text: "Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade." },
  { reference: "Provérbios 16:3", text: "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos." },
  { reference: "João 3:16", text: "Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna." },
  { reference: "Salmos 119:105", text: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho." },
  { reference: "2 Coríntios 5:7", text: "Porque vivemos por fé, e não pelo que vemos." },
  { reference: "Provérbios 22:6", text: "Eduque a criança no caminho em que deve andar, e até o fim da vida não se desviará dele." },
  { reference: "Mateus 5:16", text: "Assim brilhe a luz de vocês diante dos outros, para que vejam as suas boas obras e glorifiquem ao Pai de vocês, que está nos céus." },
  { reference: "Salmos 37:4", text: "Deleite-se no Senhor, e ele atenderá aos desejos do seu coração." },
  { reference: "Isaías 41:10", text: "Não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa." },
  { reference: "Provérbios 18:10", text: "Torre forte é o nome do Senhor; para ela correm os justos e estão seguros." },
  { reference: "Romanos 12:2", text: "Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus." },
  { reference: "Salmos 27:1", text: "O Senhor é a minha luz e a minha salvação; de quem terei temor? O Senhor é o meu forte refúgio; de quem terei medo?" },
  { reference: "Provérbios 4:23", text: "Acima de tudo, guarde o seu coração, pois dele depende toda a sua vida." },
  { reference: "Mateus 6:33", text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas serão acrescentadas a vocês." },
  { reference: "Salmos 91:1-2", text: "Aquele que habita no abrigo do Altíssimo e descansa à sombra do Todo-poderoso pode dizer ao Senhor: Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio." },
  { reference: "Colossenses 3:23", text: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens." },
  { reference: "Josué 1:9", text: "Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar." },
  { reference: "Salmos 34:8", text: "Provem, e vejam como o Senhor é bom. Como é feliz o homem que nele se refugia!" },
  { reference: "Provérbios 15:1", text: "A resposta calma desvia a fúria, mas a palavra ríspida desperta a ira." },
  { reference: "1 João 4:19", text: "Nós amamos porque ele nos amou primeiro." },
  { reference: "Salmos 103:2-3", text: "Bendiga o Senhor a minha alma! Não esqueça nenhuma de suas bênçãos! Ele perdoa todos os meus pecados e cura todas as minhas doenças." },
  { reference: "Efésios 2:8-9", text: "Pois vocês são salvos pela graça, por meio da fé, e isto não vem de vocês, é dom de Deus; não por obras, para que ninguém se glorie." },
  { reference: "Salmos 121:1-2", text: "Elevo os meus olhos para os montes; de onde me vem o socorro? O meu socorro vem do Senhor, que fez os céus e a terra." },
];

export default function BibleFooter() {
  const [verse, setVerse] = useState(DAILY_VERSES[0]);

  useEffect(() => {
    // Calcula o dia do ano (1-365) para selecionar o versículo
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Usa o dia do ano para selecionar um versículo, ciclando pela lista
    const verseIndex = dayOfYear % DAILY_VERSES.length;
    setVerse(DAILY_VERSES[verseIndex]);
  }, []);

  return (
    <footer className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 border-t border-slate-200 py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              Devocional Diário
            </span>
          </div>
          <blockquote className="text-center max-w-3xl">
            <p className="text-lg md:text-xl italic leading-relaxed text-slate-700">
              "{verse.text}"
            </p>
            <cite className="block mt-3 text-sm font-semibold text-slate-600">
              — {verse.reference} (NVI)
            </cite>
          </blockquote>
          <div className="pt-4 border-t border-slate-200 w-full text-center">
            <p className="text-xs text-slate-500">
              Sistema de Gestão de Tempo para Professores © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
