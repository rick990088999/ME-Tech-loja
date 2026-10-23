/* ===== CATÁLOGO DA ME TECH =====
 Como ADICIONAR: copie um bloco { ... } dentro da lista, separe por vírgula e preencha.
 Como EDITAR: altere os valores do bloco (preço, descrição, disponivel...).
 Como REMOVER: apague o bloco inteiro (ou use disponivel: false para mostrar "Esgotado").
 Imagens: coloque o arquivo na raiz do projeto (sem pastas) e escreva só o nome em "imagem".
 Se a imagem não existir, o site mostra um espaço reservado.

 Campos:
  id                  número único (nunca repita)
  nome                nome do produto
  preco               preço em reais (ex.: 40.00)
  categoria           qualquer texto; as categorias do site são criadas a partir daqui
  imagem              nome do arquivo na raiz (ex.: "fone-bluetooth.jpg")
  descricaoSimples    aparece no cartão
  descricaoDetalhada  aparece nos detalhes
  caracteristicas     (opcional) lista de textos, ex.: ["Item 1", "Item 2"]
  disponivel          true = Disponível | false = Esgotado (permite encomenda antecipada)
  dataAdicao          "AAAA-MM-DD" (usada na seção Novidades)

 Exemplo (copie, remova as barras e preencha com dados REAIS):
  {
    id: 1,
    nome: "Fone Bluetooth",
    preco: 40.00,
    categoria: "Fones",
    imagem: "fone-bluetooth.jpg",
    descricaoSimples: "Fone sem fio para o dia a dia.",
    descricaoDetalhada: "Descrição completa do produto.",
    disponivel: true,
    dataAdicao: "2026-10-21"
  },
*/
const produtos = [{
    id: 1,
    nome: "Fone Bluetooth",
    preco: 40.00,
    categoria: "Fones",
    imagem: "fonebtmd.png",
    descricaoSimples: "Fone sem fio para o dia a dia.",
    descricaoDetalhada: "Descrição completa do produto.",
    disponivel: true,
    dataAdicao: "2026-10-21"
  }
];
