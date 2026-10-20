// Dados compartilhados entre a loja e o painel administrativo.
// Tudo fica somente no armazenamento deste navegador.

function lerDados(chave, padrao) {
  try {
    var valor = JSON.parse(localStorage.getItem(chave));
    if (Array.isArray(valor)) return valor;
  } catch (erro) {
    console.log("Não foi possível ler " + chave);
  }
  return padrao;
}

function salvarDados(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (erro) {
    alert("Não foi possível salvar os dados. Verifique o espaço e as permissões do navegador.");
    return false;
  }
}

// Protege os textos digitados antes de mostrá-los dentro do HTML.
function escaparHTML(texto) {
  return String(texto || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function urlProdutoValida(url) {
  return url === "" || /^https?:\/\/[^\s]+$/i.test(url);
}

function proximoId(lista) {
  var maior = 0;
  for (var i = 0; i < lista.length; i++) {
    if (Number(lista[i].id) > maior) maior = Number(lista[i].id);
  }
  return maior + 1;
}

// Modelos reais, com preços fictícios e emojis ilustrativos.
// O link de cada produto leva às informações do fabricante.
var produtosIniciais = [
  {
    id: 1, nome: "Notebook Dell Inspiron 15 3530", preco: 2500, imagem: "💻",
    categoria: "notebooks", descricao: "Notebook da linha Inspiron da Dell.",
    fonte: "https://www.dell.com/pt-br/shop/notebooks-dell/inspiron-15-3530-laptop/spd/inspiron-15-3530-laptop"
  },
  {
    id: 2, nome: "Celular Samsung Galaxy A55 5G", preco: 1500, imagem: "📱",
    categoria: "celulares", descricao: "Smartphone Samsung da linha Galaxy A.",
    fonte: "https://www.samsung.com/br/support/model/SM-A556ELVMZTO/"
  },
  {
    id: 3, nome: "Fone JBL Tune 520BT", preco: 120, imagem: "🎧",
    categoria: "fones", descricao: "Fone de ouvido com conexão Bluetooth.",
    fonte: "https://www.jbl.com.br/TUNE520BT.html"
  },
  {
    id: 4, nome: "Teclado Logitech K120", preco: 180, imagem: "⌨️",
    categoria: "teclados", descricao: "Teclado com fio e conexão USB.",
    fonte: "https://www.logitech.com/pt-br/shop/p/k120-usb-standard-computer"
  },
  {
    id: 5, nome: "Mouse Logitech M170", preco: 80, imagem: "🖱️",
    categoria: "mouses", descricao: "Mouse sem fio com receptor USB.",
    fonte: "https://www.logitech.com/pt-br/shop/p/m170-wireless-mouse.910-006864"
  },
  {
    id: 6, nome: "Monitor LG 24MR400-B", preco: 900, imagem: "🖥️",
    categoria: "monitores", descricao: "Monitor LG da linha MR400.",
    fonte: "https://www.lg.com/jp/about-lg/press-and-media/20231025-lg-fhd-monitor/"
  },
  {
    id: 7, nome: "Notebook Lenovo IdeaPad Slim 3", preco: 2799, imagem: "💻",
    categoria: "notebooks", descricao: "Notebook da linha IdeaPad da Lenovo.",
    fonte: "https://www.lenovo.com/br/pt/p/laptops/ideapad/ideapad-s-series/lenovo-ideapad-slim-3-gen-10-15-inch-amd/83ty000jbo"
  },
  {
    id: 8, nome: "Notebook Acer Aspire 5", preco: 3299, imagem: "💻",
    categoria: "notebooks", descricao: "Notebook da família Aspire da Acer.",
    fonte: "https://www.acer.com/br-pt/laptops/aspire/aspire-5-intel/pdp/NX.KNGAL.002"
  },
  {
    id: 9, nome: "Celular Samsung Galaxy A35 5G", preco: 1299, imagem: "📱",
    categoria: "celulares", descricao: "Smartphone da família Galaxy A da Samsung.",
    fonte: "https://shop.samsung.com/br/galaxy-a35/p?skuId=6146"
  },
  {
    id: 10, nome: "Celular Samsung Galaxy S24", preco: 3499, imagem: "📱",
    categoria: "celulares", descricao: "Smartphone Samsung da linha Galaxy S.",
    fonte: "https://www.samsung.com/br/smartphones/galaxy-s24/specs/"
  },
  {
    id: 11, nome: "Fone JBL Tune 720BT", preco: 299, imagem: "🎧",
    categoria: "fones", descricao: "Fone Bluetooth que envolve as orelhas.",
    fonte: "https://www.jbl.com.br/TUNE720BT.html"
  },
  {
    id: 12, nome: "Fone JBL Wave Buds 2", preco: 249, imagem: "🎧",
    categoria: "fones", descricao: "Fones sem fio com estojo de carregamento.",
    fonte: "https://www.jbl.com.br/WAVE-BUDS-2.html"
  },
  {
    id: 13, nome: "Teclado Logitech Pebble Keys 2 K380s", preco: 349, imagem: "⌨️",
    categoria: "teclados", descricao: "Teclado compacto com conexão Bluetooth.",
    fonte: "https://www.logitech.com/pt-br/shop/p/pebble-keys-2.920-011790"
  },
  {
    id: 14, nome: "Teclado Logitech MX Keys S", preco: 799, imagem: "⌨️",
    categoria: "teclados", descricao: "Teclado sem fio com iluminação nas teclas.",
    fonte: "https://www.logitech.com/pt-br/shop/p/mx-keys-s"
  },
  {
    id: 15, nome: "Mouse Logitech M185", preco: 99, imagem: "🖱️",
    categoria: "mouses", descricao: "Mouse compacto sem fio com receptor USB.",
    fonte: "https://www.logitech.com/pt-br/shop/p/m185-wireless-mouse"
  },
  {
    id: 16, nome: "Mouse Logitech G203 LIGHTSYNC", preco: 179, imagem: "🖱️",
    categoria: "mouses", descricao: "Mouse com fio para jogos e iluminação RGB.",
    fonte: "https://www.logitechg.com/pt-br/shop/p/g203-lightsync-rgb-gaming-mouse"
  },
  {
    id: 17, nome: "Monitor LG 24MS500-B", preco: 699, imagem: "🖥️",
    categoria: "monitores", descricao: "Monitor LG com painel IPS e resolução Full HD.",
    fonte: "https://www.lg.com/br/monitores/fhd-qhd/24ms500-b/"
  },
  {
    id: 18, nome: "Monitor LG 27MR400-B", preco: 899, imagem: "🖥️",
    categoria: "monitores", descricao: "Monitor LG da linha MR400 com tela de 27 polegadas.",
    fonte: "https://www.lg.com/es/monitores/27mr400-b/"
  }
];

// Cada categoria corresponde a uma seção e a uma lista no HTML.
var categorias = ["notebooks", "celulares", "fones", "teclados", "mouses", "monitores"];


// Produtos antigos continuam ativos até serem desativados no admin.
for (var i = 0; i < produtosIniciais.length; i++) {
  produtosIniciais[i].ativo = true;
}

var cuponsIniciais = [
  { id: 1, codigo: "INFRA10", percentual: 10, ativo: true },
  { id: 2, codigo: "BEMVINDO5", percentual: 5, ativo: true }
];

// Os exemplos são salvos apenas na primeira visita, sem apagar suas alterações.
var produtos = lerDados("infratechProdutos", null);
if (produtos === null) {
  produtos = produtosIniciais;
  salvarDados("infratechProdutos", produtos);
}
var cupons = lerDados("infratechCupons", null);
if (cupons === null) {
  cupons = cuponsIniciais;
  salvarDados("infratechCupons", cupons);
}

function carregarCatalogo() {
  produtos = lerDados("infratechProdutos", produtos);
  cupons = lerDados("infratechCupons", cupons);
}

function encontrarCupom(codigo) {
  for (var i = 0; i < cupons.length; i++) {
    if (cupons[i].codigo === codigo && cupons[i].ativo !== false) return cupons[i];
  }
}
