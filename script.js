// Interações da loja. O catálogo e os cupons vêm de dados.js.
var carrinho = lerDados("carrinho", []);
var usuarioLogado = localStorage.getItem("usuarioLogado") || "";
var adminAutenticado = sessionStorage.getItem("infratechAdminLogado") === "true" && usuarioLogado === "admin";
if (usuarioLogado === "admin" && !adminAutenticado) {
  usuarioLogado = "";
  localStorage.removeItem("usuarioLogado");
}
var desconto = 0;
var codigoCupomAplicado = "";
var ultimoTotalExibido = null;
var taxaJurosMensal = 0.03;
var maximoParcelas = 12;

function dinheiro(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Arredonda os valores para trabalhar com duas casas decimais.
function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

// Calcula a porcentagem em centavos para manter o arredondamento dos valores.
function calcularPorcentagem(valor, percentual) {
  var centavos = Math.round(valor * 100);
  return Math.round(centavos * percentual / 100) / 100;
}

// Até 3x sem juros. A partir de 4x, juros simples sobre o prazo completo.
function calcularParcelamento(valor, parcelas) {
  var juros = 0;
  if (parcelas > 3) {
    juros = calcularPorcentagem(valor, taxaJurosMensal * 100 * parcelas);
  }

  var total = arredondar(valor + juros);
  var centavos = Math.round(total * 100);
  var valorMenor = Math.floor(centavos / parcelas);
  var parcelasMaiores = centavos - valorMenor * parcelas;

  // Distribui os centavos restantes para a soma das parcelas bater com o total.
  return {
    quantidade: parcelas,
    juros: juros,
    total: total,
    valorMenor: valorMenor / 100,
    valorMaior: (valorMenor + 1) / 100,
    parcelasMaiores: parcelasMaiores
  };
}

function resumirParcelamento(calculo) {
  var texto = calculo.quantidade + "x de " + dinheiro(calculo.valorMenor);
  if (calculo.parcelasMaiores > 0) {
    texto += " a " + dinheiro(calculo.valorMaior);
  }
  return texto;
}

function detalharParcelamento(calculo) {
  if (calculo.parcelasMaiores === 0) {
    return resumirParcelamento(calculo);
  }
  return calculo.parcelasMaiores + "x de " + dinheiro(calculo.valorMaior) +
    " + " + (calculo.quantidade - calculo.parcelasMaiores) + "x de " + dinheiro(calculo.valorMenor);
}

// Reserva o espaço do cabeçalho fixo e evita que ele cubra as seções.
function ajustarCabecalho() {
  var cabecalho = document.getElementsByTagName("header")[0];
  var altura = cabecalho.offsetHeight;
  document.body.style.paddingTop = altura + "px";
  document.documentElement.style.scrollPaddingTop = (altura + 20) + "px";
}

function abrir(nome) {
  if (nome === "admin" && !adminAutenticado) {
    nome = "login";
    document.getElementById("mensagemLogin").textContent = "Entre com a conta de administrador para continuar.";
  }
  var telas = document.getElementsByClassName("tela");
  for (var i = 0; i < telas.length; i++) {
    telas[i].classList.add("escondido");
  }
  document.getElementById(nome).classList.remove("escondido");
  if (nome === "carrinho") mostrarCarrinho();
  if (nome === "pagamento") { atualizarEnderecosEntrega(); mostrarPagamento(); }
  if (nome === "loja") mostrarProdutos();
  if (nome === "admin") atualizarPainel();
}

// A busca mostra a loja e filtra os produtos pelo nome.
function buscarProdutos() {
  abrir('loja');
}

// Limpa a busca para os links das seções ocultas voltarem a funcionar.
function limparPesquisa() {
  document.getElementById("pesquisa").value = "";
  buscarProdutos();
}

// Salva a mensagem localmente para leitura no painel administrativo.
function enviarMensagem() {
  var nome = document.getElementById("nomeContato").value.trim();
  var email = document.getElementById("emailContato").value.trim();
  var texto = document.getElementById("mensagemContato").value.trim();
  var retorno = document.getElementById("retornoContato");
  if (!nome || nome.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 150 || !texto || texto.length > 3000) {
    retorno.textContent = "Preencha o nome, um e-mail válido e sua mensagem.";
    return;
  }
  var mensagens = lerDados("infratechMensagens", []);
  mensagens.push({
    id: proximoId(mensagens), nome: nome, email: email, texto: texto,
    criadaEm: new Date().toISOString(), lida: false
  });
  if (!salvarDados("infratechMensagens", mensagens)) return;
  retorno.textContent = "Mensagem salva! Ela já pode ser consultada no painel administrativo deste navegador.";
  document.getElementById("formContato").reset();
}

function mostrarProdutos() {
  carregarCatalogo();
  var busca = document.getElementById("pesquisa").value.trim().toLowerCase();

  // Durante a busca, oculta a apresentação, as categorias e o texto sobre a loja.
  if (busca !== "") {
    document.getElementById("inicio").classList.add("escondido");
    document.getElementById("categorias").classList.add("escondido");
    document.getElementById("sobre").classList.add("escondido");
  } else {
    document.getElementById("inicio").classList.remove("escondido");
    document.getElementById("categorias").classList.remove("escondido");
    document.getElementById("sobre").classList.remove("escondido");
  }

  var encontrados = 0;

  // Monta uma lista de produtos para cada categoria usando dois laços simples.
  for (var i = 0; i < categorias.length; i++) {
    var categoria = categorias[i];
    var area = document.getElementById("produtos-" + categoria);
    var grupo = document.getElementById("grupo-" + categoria);
    area.innerHTML = "";

    for (var j = 0; j < produtos.length; j++) {
      var p = produtos[j];
      var textoProduto = (p.nome + " " + p.categoria + " " + p.descricao).toLowerCase();

      if (p.ativo !== false && p.categoria === categoria && textoProduto.includes(busca)) {
        var linkFonte = "";
        if (p.fonte && urlProdutoValida(p.fonte)) {
          linkFonte = '<a class="fonte-produto" href="' + escaparHTML(p.fonte) +
            '" target="_blank" rel="noopener noreferrer">Sobre o modelo no fabricante ↗</a>';
        }
        area.innerHTML += '<article class="produto"><div class="foto" aria-hidden="true">' + escaparHTML(p.imagem) +
          '</div><h4>' + escaparHTML(p.nome) + '</h4><p class="descricao-produto">' + escaparHTML(p.descricao) +
          '</p><p class="preco">' + dinheiro(p.preco) +
          '</p><p class="preco-pix">No Pix: <strong>' + dinheiro(arredondar(p.preco - calcularPorcentagem(p.preco, 10))) +
          '</strong></p>' +
          '<p class="condicoes-cartao">Em até 3x sem juros no cartão</p>' +
          linkFonte +
          '<button onclick="adicionar(' + p.id + ')">Adicionar ao carrinho</button></article>';
        encontrados++;
      }
    }

    // Na pesquisa, oculta grupos sem resultados. Fora dela, mantém os links válidos.
    if (area.innerHTML === "") {
      if (busca !== "") {
        grupo.classList.add("escondido");
      } else {
        area.innerHTML = "<p>Nenhum produto ativo nesta categoria no momento.</p>";
        grupo.classList.remove("escondido");
      }
    } else {
      grupo.classList.remove("escondido");
    }
  }

  if (encontrados === 0) {
    document.getElementById("resultadoBusca").textContent = "Nenhum produto encontrado. Tente outro nome ou categoria.";
  } else if (encontrados === 1) {
    document.getElementById("resultadoBusca").textContent = "1 produto encontrado.";
  } else {
    document.getElementById("resultadoBusca").textContent = encontrados + " produtos encontrados.";
  }
}

var emailAdmin = "admin@gmail.com";

function emailValido(email) {
  return email.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Cadastro de demonstração: salva usuário, e-mail e senha somente neste navegador.
// Endereços são vinculados à conta local de demonstração.
function lerEnderecoFormulario(prefixo) {
  var endereco = {};
  ["Cep", "Rua", "Numero", "Complemento", "Bairro", "Cidade", "Uf"].forEach(function (campo) {
    endereco[campo] = document.getElementById(prefixo + campo).value.trim();
  });
  endereco.Uf = endereco.Uf.toUpperCase();
  if (!/^\d{5}-?\d{3}$/.test(endereco.Cep) || !endereco.Rua ||
      !endereco.Numero || !endereco.Bairro || !endereco.Cidade ||
      !/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(endereco.Uf)) return null;
  if (endereco.Rua.length > 150 || endereco.Numero.length > 20 ||
      endereco.Complemento.length > 100 || endereco.Bairro.length > 100 || endereco.Cidade.length > 100) return null;
  endereco.Cep = endereco.Cep.replace(/^(\d{5})-?(\d{3})$/, "$1-$2");
  return endereco;
}

function enderecosDaConta() {
  if (!usuarioLogado) return [];
  if (adminAutenticado && usuarioLogado === "admin") return lerDados("infratechEnderecosAdmin", []);
  var contas = lerDados("contas", []);
  for (var i = 0; i < contas.length; i++) {
    if (contas[i].usuario === usuarioLogado) return contas[i].enderecos || [];
  }
  return [];
}

function textoEndereco(endereco) {
  return endereco.Rua + ", " + endereco.Numero +
    (endereco.Complemento ? " — " + endereco.Complemento : "") +
    " — " + endereco.Bairro + ", " + endereco.Cidade + "/" + endereco.Uf + " — CEP " + endereco.Cep;
}

function atualizarEnderecosEntrega(indice) {
  var seletor = document.getElementById("enderecoEntrega");
  var anterior = indice === undefined ? seletor.value : String(indice);
  var enderecos = enderecosDaConta();
  seletor.innerHTML = "";
  var vazio = document.createElement("option");
  vazio.value = ""; vazio.textContent = enderecos.length ? "Selecione um endereço" : "Cadastre um endereço abaixo";
  seletor.appendChild(vazio);
  enderecos.forEach(function (endereco, i) {
    var opcao = document.createElement("option");
    opcao.value = String(i); opcao.textContent = textoEndereco(endereco);
    seletor.appendChild(opcao);
  });
  seletor.value = anterior !== "" && enderecos[Number(anterior)] ? anterior : (enderecos.length ? "0" : "");
  selecionarEnderecoEntrega();
}

function enderecoEntregaSelecionado() {
  var valor = document.getElementById("enderecoEntrega").value;
  if (!/^\d+$/.test(valor)) return null;
  return enderecosDaConta()[Number(valor)] || null;
}

function selecionarEnderecoEntrega() {
  var endereco = enderecoEntregaSelecionado();
  document.getElementById("resumoEnderecoEntrega").textContent =
    endereco ? "Entrega em: " + textoEndereco(endereco) : "Salve um endereço para continuar.";
}

function salvarEnderecoEntrega() {
  var mensagem = document.getElementById("mensagemEnderecoEntrega");
  if (!usuarioLogado) { mensagem.textContent = "Entre na sua conta para salvar o endereço."; return; }
  var endereco = lerEnderecoFormulario("entregaEndereco");
  if (!endereco) { mensagem.textContent = "Preencha o endereço completo, com CEP válido e a sigla do estado."; return; }
  var enderecos = enderecosDaConta();
  var indice = enderecos.findIndex(function (item) { return textoEndereco(item).toLowerCase() === textoEndereco(endereco).toLowerCase(); });
  if (indice === -1) { indice = enderecos.length; enderecos.push(endereco); }
  if (adminAutenticado && usuarioLogado === "admin") {
    if (!salvarDados("infratechEnderecosAdmin", enderecos)) return;
  } else {
    var contas = lerDados("contas", []);
    var conta = contas.find(function (item) { return item.usuario === usuarioLogado; });
    if (!conta) { mensagem.textContent = "Conta não encontrada. Entre novamente."; return; }
    conta.enderecos = enderecos;
    if (!salvarDados("contas", contas)) return;
  }
  atualizarEnderecosEntrega(indice);
  document.getElementById("formEnderecoEntrega").reset();
  mensagem.textContent = "Endereço salvo e selecionado para esta entrega.";
}

function cadastrar() {
  if (!document.getElementById("aceiteTermos").checked) {
    alert("Leia e aceite os Termos de Uso e o Aviso de Privacidade para criar a conta.");
    document.getElementById("aceiteTermos").focus();
    return;
  }
  var usuario = document.getElementById("novoUsuario").value.trim();
  var email = document.getElementById("novoEmail").value.trim().toLowerCase();
  var senha = document.getElementById("novaSenha").value;
  if (usuario.toLowerCase() === "admin" || usuario.toLowerCase() === emailAdmin || email === emailAdmin) {
    alert("Esse usuário ou e-mail é reservado ao administrador.");
    return;
  }
  if (!emailValido(email)) {
    alert("Informe um e-mail válido, como seunome@exemplo.com.");
    return;
  }
  if (usuario === "" || senha === "") {
    alert("Preencha usuário e senha.");
    return;
  }
  if (senha.length < 4) {
    alert("A senha deve ter pelo menos 4 caracteres.");
    return;
  }
  var endereco = lerEnderecoFormulario("cadastroEndereco");
  if (!endereco) { alert("Preencha o endereço completo, com CEP válido e a sigla do estado."); return; }
  // Apenas para demonstração: não utilize senhas reais.
  var contas = lerDados("contas", []);
  for (var i = 0; i < contas.length; i++) {
    if (contas[i].usuario.toLowerCase() === usuario.toLowerCase() ||
        (contas[i].email || "").toLowerCase() === email ||
        contas[i].usuario.toLowerCase() === email ||
        (contas[i].email || "").toLowerCase() === usuario.toLowerCase()) {
      alert("Este usuário ou e-mail já está cadastrado.");
      return;
    }
  }
  contas.push({ usuario: usuario, email: email, senha: senha, enderecos: [endereco], aceitePrivacidade: { aceito: true, versao: "2026-10-28", aceitoEm: new Date().toISOString() }, cadastradoEm: new Date().toISOString() });
  if (!salvarDados("contas", contas)) return;
  alert("Cadastro realizado! Agora entre com sua conta.");
  document.getElementById("loginUsuario").value = email;
  document.getElementById("novaSenha").value = "";
  document.getElementById("aceiteTermos").checked = false;
  abrir("login");
}

// Login local de demonstração, sem servidor.
function entrar() {
  var usuario = document.getElementById("loginUsuario").value.trim();
  var senha = document.getElementById("loginSenha").value;
  var mensagem = document.getElementById("mensagemLogin");
  mensagem.textContent = "";

  if (usuario.toLowerCase() === emailAdmin) {
    if (senha !== "4747") {
      mensagem.textContent = "E-mail, usuário ou senha incorretos.";
      return;
    }
    usuarioLogado = "admin";
    adminAutenticado = true;
    sessionStorage.setItem("infratechAdminLogado", "true");
    localStorage.setItem("usuarioLogado", "admin");
    document.getElementById("loginSenha").value = "";
    atualizarConta();
    abrir("loja");
    return;
  }

  var contas = lerDados("contas", []);
  for (var i = 0; i < contas.length; i++) {
    if (((contas[i].email || "").toLowerCase() === usuario.toLowerCase() ||
         contas[i].usuario.toLowerCase() === usuario.toLowerCase()) && contas[i].senha === senha) {
      adminAutenticado = false;
      sessionStorage.removeItem("infratechAdminLogado");
      usuarioLogado = contas[i].usuario;
      localStorage.setItem("usuarioLogado", usuarioLogado);
      document.getElementById("loginSenha").value = "";
      atualizarConta();
      abrir("loja");
      return;
    }
  }
  mensagem.textContent = "E-mail, usuário ou senha incorretos.";
}

function verificarAcessoAdmin() {
  usuarioLogado = localStorage.getItem("usuarioLogado") || "";
  adminAutenticado = sessionStorage.getItem("infratechAdminLogado") === "true" && usuarioLogado === "admin";
  if (!adminAutenticado) sessionStorage.removeItem("infratechAdminLogado");
  atualizarConta();
  if (!adminAutenticado && !document.getElementById("admin").classList.contains("escondido")) {
    abrir("loja");
  }
}

function atualizarConta() {
  var botao = document.getElementById("botaoConta");
  if (usuarioLogado !== "") {
    botao.textContent = "Sair (" + usuarioLogado + ")";
    botao.onclick = sair;
  } else {
    botao.textContent = "Entrar / Cadastrar";
    botao.onclick = function () { abrir("login"); };
  }
  if (adminAutenticado) {
    document.getElementById("linkAdmin").classList.remove("escondido");
  } else {
    document.getElementById("linkAdmin").classList.add("escondido");
  }
  ajustarCabecalho();
}

function sair() {
  adminAutenticado = false;
  sessionStorage.removeItem("infratechAdminLogado");
  usuarioLogado = "";
  localStorage.removeItem("usuarioLogado");
  atualizarConta();
  abrir("loja");
}

// Salva o carrinho e atualiza a quantidade no cabeçalho.
function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  var quantidade = 0;
  for (var i = 0; i < carrinho.length; i++) quantidade += carrinho[i].quantidade;
  document.getElementById("quantidade").textContent = quantidade;
}

function adicionar(id) {
  carregarCatalogo();
  var produto = encontrarProduto(id);
  if (!produto || produto.ativo === false) {
    alert("Este produto está indisponível.");
    mostrarProdutos();
    return;
  }
  document.getElementById("avisoCarrinho").textContent = "";
  for (var i = 0; i < carrinho.length; i++) {
    if (carrinho[i].id === id) {
      carrinho[i].quantidade++;
      salvarCarrinho();
      alert("Produto adicionado!");
      return;
    }
  }
  carrinho.push({ id: id, quantidade: 1 });
  salvarCarrinho();
  alert("Produto adicionado!");
}

function encontrarProduto(id) {
  for (var i = 0; i < produtos.length; i++) {
    if (produtos[i].id === id) return produtos[i];
  }
}

// Um produto desativado não pode continuar no carrinho ou no pagamento.
function atualizarCarrinhoDisponivel() {
  var disponiveis = [];
  var mudou = false;
  for (var i = 0; i < carrinho.length; i++) {
    var item = carrinho[i];
    var produto = encontrarProduto(item.id);
    if (produto && produto.ativo !== false && item.quantidade > 0) {
      disponiveis.push(item);
    } else {
      mudou = true;
    }
  }
  if (mudou) {
    carrinho = disponiveis;
    salvarCarrinho();
    document.getElementById("avisoCarrinho").textContent =
      "Um ou mais produtos ficaram indisponíveis e foram retirados do carrinho.";
  }
  return mudou;
}

// Soma o preço de cada produto multiplicado pela quantidade.
function calcularSubtotal() {
  var total = 0;
  for (var i = 0; i < carrinho.length; i++) {
    var produto = encontrarProduto(carrinho[i].id);
    if (produto && produto.ativo !== false) total += produto.preco * carrinho[i].quantidade;
  }
  return total;
}

function alterarQuantidade(id, valor) {
  for (var i = 0; i < carrinho.length; i++) {
    if (carrinho[i].id === id) {
      carrinho[i].quantidade += valor;
      if (carrinho[i].quantidade <= 0) carrinho.splice(i, 1);
      break;
    }
  }
  desconto = 0;
  codigoCupomAplicado = "";
  salvarCarrinho();
  mostrarCarrinho();
}

function mostrarCarrinho() {
  carregarCatalogo();
  atualizarCarrinhoDisponivel();
  var area = document.getElementById("itensCarrinho");
  area.innerHTML = "";
  for (var i = 0; i < carrinho.length; i++) {
    var item = carrinho[i];
    var p = encontrarProduto(item.id);
    if (p) {
      area.innerHTML += '<div class="item"><span>' + escaparHTML(p.imagem) + ' ' + escaparHTML(p.nome) +
        ' — ' + dinheiro(p.preco) + ' x ' + item.quantidade +
        '</span><div><button onclick="alterarQuantidade(' + p.id + ', -1)">−</button>' +
        '<button onclick="alterarQuantidade(' + p.id + ', 1)">+</button></div></div>';
    }
  }
  if (carrinho.length === 0) area.innerHTML = "<p>Seu carrinho está vazio.</p>";
  document.getElementById("subtotal").textContent = "Subtotal: " + dinheiro(calcularSubtotal());
}

function irParaPagamento() {
  carregarCatalogo();
  if (atualizarCarrinhoDisponivel()) {
    abrir("carrinho");
    return;
  }
  if (carrinho.length === 0) {
    alert("Adicione produtos ao carrinho.");
    return;
  }
  if (usuarioLogado === "") {
    alert("Entre na sua conta para finalizar a compra.");
    abrir("login");
    return;
  }
  desconto = 0;
  codigoCupomAplicado = "";
  document.getElementById("cupom").value = "";
  limparDadosCartao();
  document.getElementById("enderecoEntrega").value = "";
  document.getElementById("formEnderecoEntrega").reset();
  document.getElementById("mensagemEnderecoEntrega").textContent = "";
  document.getElementById("formaPagamento").value = "";
  document.getElementById("parcelas").value = "1";
  document.getElementById("mensagemCupom").textContent = "";
  abrir("pagamento");
}

// Primeiro aplica o cupom. Depois aplica o desconto Pix ou os juros do cartão.
function calcularPagamento() {
  var subtotal = arredondar(calcularSubtotal());
  var descontoCupom = calcularPorcentagem(subtotal, desconto * 100);
  var base = arredondar(subtotal - descontoCupom);
  var forma = document.getElementById("formaPagamento").value;
  var parcelas = 1;

  if (forma === "Cartão de crédito") {
    parcelas = Number(document.getElementById("parcelas").value) || 1;
  }

  var parcelamento = calcularParcelamento(base, parcelas);
  var descontoPix = 0;
  if (forma === "Pix") {
    descontoPix = calcularPorcentagem(base, 10);
  }

  return {
    subtotal: subtotal,
    descontoCupom: descontoCupom,
    base: base,
    descontoPix: descontoPix,
    parcelamento: parcelamento,
    total: arredondar(parcelamento.total - descontoPix)
  };
}

// Confere a estrutura do número pelo algoritmo de Luhn; não autoriza pagamentos.
function numeroCartaoValido(valor) {
  if (!/^[0-9 -]+$/.test(valor)) return false;
  var numero = valor.replace(/[ -]/g, "");
  if (!/^\d{13,19}$/.test(numero) || /^(\d)\1+$/.test(numero)) return false;
  var soma = 0, dobrar = false;
  for (var i = numero.length - 1; i >= 0; i--) {
    var digito = Number(numero[i]);
    if (dobrar) { digito *= 2; if (digito > 9) digito -= 9; }
    soma += digito;
    dobrar = !dobrar;
  }
  return soma % 10 === 0;
}

function validadeCartaoValida(valor, agora) {
  var partes = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(valor);
  if (!partes) return false;
  agora = agora || new Date();
  var mes = Number(partes[1]), ano = Number(partes[2]);
  return ano > agora.getFullYear() ||
    (ano === agora.getFullYear() && mes >= agora.getMonth() + 1);
}

function limparDadosCartao() {
  ["nomeCartao", "numeroCartao", "validadeCartao", "cvvCartao"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
  document.getElementById("erroCartao").textContent = "";
}

function validarDadosCartao() {
  var erro = "", campo = "";
  var numero = document.getElementById("numeroCartao").value.trim();
  if (document.getElementById("nomeCartao").value.trim().length < 2) {
    erro = "Informe o nome do titular."; campo = "nomeCartao";
  } else if (!numeroCartaoValido(numero)) {
    erro = "Informe um número de cartão com formato válido."; campo = "numeroCartao";
  } else if (!validadeCartaoValida(document.getElementById("validadeCartao").value.trim())) {
    erro = "Informe uma validade atual ou futura no formato MM/AAAA."; campo = "validadeCartao";
  } else if (!( /^3[47]/.test(numero.replace(/[ -]/g, "")) ? /^\d{4}$/ : /^\d{3}$/ ).test(document.getElementById("cvvCartao").value)) {
    erro = "Informe um CVV de 3 dígitos (4 para American Express)."; campo = "cvvCartao";
  }
  document.getElementById("erroCartao").textContent = erro;
  if (campo) document.getElementById(campo).focus();
  return !erro;
}

function mostrarPagamento() {
  carregarCatalogo();
  atualizarCupomAplicado();
  if (atualizarCarrinhoDisponivel()) {
    abrir("carrinho");
    return;
  }
  var forma = document.getElementById("formaPagamento").value;
  var seletor = document.getElementById("parcelas");
  var selecionada = Number(seletor.value) || 1;
  var cartao = forma === "Cartão de crédito";
  document.getElementById("dadosCartao").disabled = !cartao;
  document.getElementById("dadosCartao").classList.toggle("escondido", !cartao);
  if (!cartao) limparDadosCartao();
  var dados = calcularPagamento();

  if (forma === "Cartão de crédito") {
    document.getElementById("opcoesParcelamento").classList.remove("escondido");
    seletor.disabled = false;
    seletor.innerHTML = "";

    for (var i = 1; i <= maximoParcelas; i++) {
      var calculo = calcularParcelamento(dados.base, i);
      var condicao = "sem juros";
      if (i > 3) {
        condicao = (taxaJurosMensal * 100) + "% a.m. — total " + dinheiro(calculo.total);
      }
      seletor.innerHTML += '<option value="' + i + '">' + resumirParcelamento(calculo) + " — " + condicao + '</option>';
    }
    seletor.value = selecionada;
  } else {
    document.getElementById("opcoesParcelamento").classList.add("escondido");
    seletor.value = "1";
    seletor.disabled = true;
  }

  dados = calcularPagamento();
  document.getElementById("resumoCompra").textContent = "Subtotal: " + dinheiro(dados.subtotal);
  document.getElementById("regraJuros").textContent = "Até 3x sem juros. De 4x a " + maximoParcelas +
    "x: juros simples de " + (taxaJurosMensal * 100) + "% ao mês sobre o prazo completo. Exemplo: 4x = " +
    (taxaJurosMensal * 100 * 4) + "% de juros no total.";

  document.getElementById("descontoCupomPagamento").textContent = "";
  if (desconto > 0) {
    document.getElementById("descontoCupomPagamento").textContent =
      "Desconto do cupom (" + (desconto * 100) + "%): − " + dinheiro(dados.descontoCupom);
  }

  document.getElementById("descontoPixPagamento").textContent = "";
  if (forma === "Pix") {
    document.getElementById("descontoPixPagamento").textContent =
      "Desconto Pix (10% sobre " + dinheiro(dados.base) + "): − " + dinheiro(dados.descontoPix);
  }

  document.getElementById("jurosPagamento").textContent = "";
  document.getElementById("detalhesParcelamento").textContent = "";
  if (forma === "Cartão de crédito") {
    var condicao = "sem juros";
    if (dados.parcelamento.quantidade > 3) {
      condicao = "com juros";
      document.getElementById("jurosPagamento").textContent =
        "Juros simples (" + (taxaJurosMensal * 100) + "% a.m. × " + dados.parcelamento.quantidade +
        " meses): + " + dinheiro(dados.parcelamento.juros);
    }
    document.getElementById("detalhesParcelamento").textContent =
      detalharParcelamento(dados.parcelamento) + " — " + condicao + ".";
  }

  document.getElementById("totalPagamento").textContent = "Total: " + dinheiro(dados.total);
  ultimoTotalExibido = dados.total;
}

// Confere se o cupom aplicado continua ativo, inclusive após mudanças no admin.
function atualizarCupomAplicado() {
  desconto = 0;
  if (!codigoCupomAplicado) return;
  var cupom = encontrarCupom(codigoCupomAplicado);
  if (cupom) {
    desconto = cupom.percentual / 100;
    document.getElementById("mensagemCupom").textContent = "Cupom aplicado: " + cupom.percentual + "% de desconto!";
  } else {
    codigoCupomAplicado = "";
    document.getElementById("mensagemCupom").textContent = "O cupom foi desativado. O desconto foi removido do total.";
  }
}

// Usa os cupons cadastrados e ativados no painel administrativo.
function aplicarCupom() {
  carregarCatalogo();
  var codigo = document.getElementById("cupom").value.trim().toUpperCase();
  var mensagem = document.getElementById("mensagemCupom");
  var cupom = encontrarCupom(codigo);
  if (cupom) {
    codigoCupomAplicado = cupom.codigo;
    desconto = cupom.percentual / 100;
    mensagem.textContent = "Cupom aplicado: " + cupom.percentual + "% de desconto!";
  } else {
    codigoCupomAplicado = "";
    desconto = 0;
    mensagem.textContent = "Cupom inválido ou inativo. Nenhum desconto aplicado.";
  }
  mostrarPagamento();
}

function finalizarCompra() {
  carregarCatalogo();
  atualizarCupomAplicado();
  if (atualizarCarrinhoDisponivel()) {
    abrir("carrinho");
    return;
  }
  if (usuarioLogado === "" || carrinho.length === 0) {
    alert("Entre na sua conta e adicione produtos.");
    abrir("loja");
    return;
  }
  var forma = document.getElementById("formaPagamento").value;
  if (forma !== "Pix" && forma !== "Cartão de crédito" && forma !== "Boleto") {
    alert("Escolha uma forma de pagamento.");
    return;
  }

  if (forma === "Cartão de crédito") {
    if (!validarDadosCartao()) return;
    var parcelas = Number(document.getElementById("parcelas").value);
    if (parcelas < 1 || parcelas > maximoParcelas || parcelas !== Math.floor(parcelas)) {
      alert("Escolha uma quantidade de parcelas entre 1 e " + maximoParcelas + ".");
      return;
    }
  }

  var enderecoEntrega = enderecoEntregaSelecionado();
  if (!enderecoEntrega) {
    alert("Selecione ou cadastre um endereço de entrega antes de confirmar.");
    document.getElementById("enderecoEntrega").focus();
    return;
  }

  // Usa o mesmo cálculo exibido no resumo para confirmar o pedido.
  var dados = calcularPagamento();
  if (ultimoTotalExibido !== null && dados.total !== ultimoTotalExibido) {
    mostrarPagamento();
    alert("O preço ou o cupom mudou. Confira o novo total antes de confirmar o pedido.");
    return;
  }
  var detalhes = "Cliente: " + usuarioLogado + "\nPagamento: " + forma +
    "\nSubtotal: " + dinheiro(dados.subtotal);
  if (desconto > 0) {
    detalhes += "\nDesconto do cupom: − " + dinheiro(dados.descontoCupom);
  }
  if (forma === "Pix") {
    detalhes += "\nDesconto Pix (10%): − " + dinheiro(dados.descontoPix);
  }
  if (forma === "Cartão de crédito") {
    detalhes += "\nParcelamento: " + detalharParcelamento(dados.parcelamento);
    if (dados.parcelamento.quantidade > 3) {
      detalhes += "\nJuros simples de " + (taxaJurosMensal * 100) + "% a.m.: " + dinheiro(dados.parcelamento.juros);
    } else {
      detalhes += " (sem juros)";
    }
  }
  detalhes += "\nEndereço de entrega: " + textoEndereco(enderecoEntrega);
  detalhes += "\nTotal: " + dinheiro(dados.total);
  document.getElementById("detalhesPedido").textContent = detalhes;
  carrinho = [];
  desconto = 0;
  codigoCupomAplicado = "";
  salvarCarrinho();
  limparDadosCartao();
  abrir("sucesso");
  document.getElementById("tituloAgradecimento").focus();
  window.scrollTo(0, 0);
}

// Painel integrado ao site, liberado pelo login comum de demonstração.
function verificarSessaoAdmin() {
  if (adminAutenticado && usuarioLogado === "admin") return true;
  abrir("login");
  return false;
}

function formatarData(valor) {
  if (!valor) return "Não informada";
  var data = new Date(valor);
  if (isNaN(data.getTime())) return "Não informada";
  return data.toLocaleString("pt-BR");
}

function nomeCategoria(categoria) {
  var nomes = {
    notebooks: "Notebooks", celulares: "Celulares", fones: "Fones de ouvido",
    teclados: "Teclados", mouses: "Mouses", monitores: "Monitores"
  };
  return nomes[categoria] || categoria;
}

function atualizarResumoAdmin() {
  var mensagens = lerDados("infratechMensagens", []);
  var contas = lerDados("contas", []);
  var ativos = 0, naoLidas = 0, cuponsAtivos = 0;
  for (var i = 0; i < produtos.length; i++) {
    if (produtos[i].ativo !== false) ativos++;
  }
  for (var i = 0; i < mensagens.length; i++) {
    if (!mensagens[i].lida) naoLidas++;
  }
  for (var i = 0; i < cupons.length; i++) {
    if (cupons[i].ativo !== false) cuponsAtivos++;
  }
  document.getElementById("totalProdutosAdmin").textContent = ativos;
  document.getElementById("totalMensagensAdmin").textContent = naoLidas;
  document.getElementById("totalUsuariosAdmin").textContent = contas.length;
  document.getElementById("totalCuponsAdmin").textContent = cuponsAtivos;
}

function mostrarMensagensAdmin() {
  var mensagens = lerDados("infratechMensagens", []);
  var area = document.getElementById("listaMensagens");
  area.innerHTML = "";
  // Mostra as mensagens mais recentes primeiro.
  for (var i = mensagens.length - 1; i >= 0; i--) {
    var m = mensagens[i];
    area.innerHTML += '<article class="mensagem-admin ' + (m.lida ? "lida" : "") + '">' +
      '<h3>' + escaparHTML(m.nome) + '</h3><p>' + escaparHTML(m.email) +
      ' · ' + escaparHTML(formatarData(m.criadaEm)) + '</p>' +
      '<span class="situacao">' + (m.lida ? "Lida" : "Não lida") + '</span>' +
      '<p class="mensagem-texto">' + escaparHTML(m.texto) + '</p>' +
      '<button id="leitura-' + Number(m.id) + '" onclick="alternarLeitura(' + Number(m.id) + ')">' +
      (m.lida ? "Marcar como não lida" : "Marcar como lida") + '</button></article>';
  }
  if (mensagens.length === 0) area.innerHTML = '<p class="aviso">Nenhuma mensagem recebida ainda.</p>';
}

function alternarLeitura(id) {
  if (!verificarSessaoAdmin()) return;
  var mensagens = lerDados("infratechMensagens", []);
  for (var i = 0; i < mensagens.length; i++) {
    if (mensagens[i].id === id) mensagens[i].lida = !mensagens[i].lida;
  }
  if (!salvarDados("infratechMensagens", mensagens)) return;
  mostrarMensagensAdmin();
  atualizarResumoAdmin();
  document.getElementById("leitura-" + id).focus();
}

function mostrarUsuariosAdmin() {
  var contas = lerDados("contas", []);
  var area = document.getElementById("listaUsuarios");
  area.innerHTML = "";
  for (var i = 0; i < contas.length; i++) {
    area.innerHTML += '<tr><td>' + escaparHTML(contas[i].usuario) + '</td><td>' +
      escaparHTML(contas[i].email || 'Não informado') + '</td><td>' +
      escaparHTML(formatarData(contas[i].cadastradoEm)) + '</td></tr>';
  }
  if (contas.length === 0) area.innerHTML = '<tr><td colspan="3">Nenhum usuário cadastrado.</td></tr>';
}

function mostrarProdutosAdmin() {
  carregarCatalogo();
  var busca = document.getElementById("filtroProdutosAdmin").value.trim().toLowerCase();
  var area = document.getElementById("listaProdutosAdmin");
  area.innerHTML = "";
  for (var i = 0; i < produtos.length; i++) {
    var p = produtos[i];
    var texto = (p.nome + " " + nomeCategoria(p.categoria)).toLowerCase();
    if (!texto.includes(busca)) continue;
    var ativo = p.ativo !== false;
    area.innerHTML += '<tr><td>' + escaparHTML(p.imagem) + ' ' + escaparHTML(p.nome) +
      '</td><td>' + escaparHTML(nomeCategoria(p.categoria)) + '</td><td>' + dinheiro(p.preco) +
      '</td><td><span class="situacao ' + (ativo ? "" : "inativo") + '">' +
      (ativo ? "Ativo" : "Inativo") + '</span></td><td>' +
      '<button onclick="editarProduto(' + Number(p.id) + ')">Editar</button>' +
      '<button id="estado-produto-' + Number(p.id) + '" class="secundario" onclick="alternarProduto(' + Number(p.id) + ')">' +
      (ativo ? "Desativar" : "Ativar") + '</button></td></tr>';
  }
  if (area.innerHTML === "") area.innerHTML = '<tr><td colspan="5">Nenhum produto encontrado.</td></tr>';
}

function limparFormProduto() {
  document.getElementById("formProduto").reset();
  document.getElementById("produtoId").value = "";
  document.getElementById("tituloFormProduto").textContent = "Cadastrar produto";
  document.getElementById("botaoSalvarProduto").textContent = "Cadastrar produto";
  document.getElementById("cancelarProduto").classList.add("escondido");
  document.getElementById("mensagemProduto").textContent = "";
}

function editarProduto(id) {
  carregarCatalogo();
  for (var i = 0; i < produtos.length; i++) {
    var p = produtos[i];
    if (p.id !== id) continue;
    document.getElementById("produtoId").value = p.id;
    document.getElementById("nomeProduto").value = p.nome;
    document.getElementById("categoriaProduto").value = p.categoria;
    document.getElementById("precoProduto").value = p.preco;
    document.getElementById("descricaoProduto").value = p.descricao;
    document.getElementById("iconeProduto").value = p.imagem;
    document.getElementById("fonteProduto").value = p.fonte || "";
    document.getElementById("ativoProduto").checked = p.ativo !== false;
    document.getElementById("tituloFormProduto").textContent = "Editar produto";
    document.getElementById("botaoSalvarProduto").textContent = "Salvar alterações";
    document.getElementById("cancelarProduto").classList.remove("escondido");
    document.getElementById("mensagemProduto").textContent = "";
    document.getElementById("formProduto").scrollIntoView();
    document.getElementById("nomeProduto").focus({ preventScroll: true });
    return;
  }
}

function salvarProduto() {
  if (!verificarSessaoAdmin()) return;
  var id = Number(document.getElementById("produtoId").value);
  var nome = document.getElementById("nomeProduto").value.trim();
  var categoria = document.getElementById("categoriaProduto").value;
  var preco = Number(document.getElementById("precoProduto").value);
  var descricao = document.getElementById("descricaoProduto").value.trim();
  var fonte = document.getElementById("fonteProduto").value.trim();
  var mensagem = document.getElementById("mensagemProduto");
  if (!nome || nome.length > 100 || !descricao || descricao.length > 600 ||
      !isFinite(preco) || preco < 0.01 || preco > 999999.99 || categorias.indexOf(categoria) === -1) {
    mensagem.textContent = "Preencha nome, descrição, categoria e um preço válido acima de zero.";
    return;
  }
  if (!urlProdutoValida(fonte) || fonte.length > 1500) {
    mensagem.textContent = "Use um link iniciado por http:// ou https://, ou deixe o campo vazio.";
    return;
  }

  var lista = lerDados("infratechProdutos", []);
  var indice = -1;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) indice = i;
  }
  if (id > 0 && indice === -1) {
    mensagem.textContent = "Produto não encontrado. Atualize a página e tente novamente.";
    return;
  }
  var produto = {
    id: id || proximoId(lista), nome: nome, categoria: categoria,
    preco: Math.round(preco * 100) / 100, descricao: descricao,
    imagem: document.getElementById("iconeProduto").value || "📦", fonte: fonte,
    ativo: document.getElementById("ativoProduto").checked
  };
  if (indice === -1) lista.push(produto); else lista[indice] = produto;
  if (!salvarDados("infratechProdutos", lista)) return;
  produtos = lista;
  limparFormProduto();
  mostrarProdutosAdmin();
  atualizarResumoAdmin();
  mensagem.textContent = id ? "Produto atualizado na loja." : "Produto cadastrado.";
}

function alternarProduto(id) {
  if (!verificarSessaoAdmin()) return;
  var lista = lerDados("infratechProdutos", []);
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id !== id) continue;
    lista[i].ativo = lista[i].ativo === false;
    if (!salvarDados("infratechProdutos", lista)) return;
    produtos = lista;
    if (Number(document.getElementById("produtoId").value) === id) {
      document.getElementById("ativoProduto").checked = lista[i].ativo;
    }
    mostrarProdutosAdmin();
    atualizarResumoAdmin();
    document.getElementById("mensagemProduto").textContent = lista[i].ativo ? "Produto ativado na loja." : "Produto desativado na loja.";
    document.getElementById("estado-produto-" + id).focus();
    return;
  }
}

function mostrarCuponsAdmin() {
  cupons = lerDados("infratechCupons", []);
  var area = document.getElementById("listaCuponsAdmin");
  area.innerHTML = "";
  for (var i = 0; i < cupons.length; i++) {
    var c = cupons[i], ativo = c.ativo !== false;
    area.innerHTML += '<tr><td>' + escaparHTML(c.codigo) + '</td><td>' +
      Number(c.percentual).toLocaleString("pt-BR") + '%</td><td><span class="situacao ' +
      (ativo ? "" : "inativo") + '">' + (ativo ? "Ativo" : "Inativo") + '</span></td><td>' +
      '<button onclick="editarCupom(' + Number(c.id) + ')">Editar</button>' +
      '<button id="estado-cupom-' + Number(c.id) + '" class="secundario" onclick="alternarCupom(' + Number(c.id) + ')">' +
      (ativo ? "Desativar" : "Ativar") + '</button></td></tr>';
  }
  if (!cupons.length) area.innerHTML = '<tr><td colspan="4">Nenhum cupom cadastrado.</td></tr>';
}

function limparFormCupom() {
  document.getElementById("formCupom").reset();
  document.getElementById("cupomId").value = "";
  document.getElementById("tituloFormCupom").textContent = "Criar cupom";
  document.getElementById("botaoSalvarCupom").textContent = "Criar cupom";
  document.getElementById("cancelarCupom").classList.add("escondido");
  document.getElementById("mensagemCupomAdmin").textContent = "";
}

function editarCupom(id) {
  cupons = lerDados("infratechCupons", []);
  for (var i = 0; i < cupons.length; i++) {
    var c = cupons[i];
    if (c.id !== id) continue;
    document.getElementById("cupomId").value = c.id;
    document.getElementById("codigoCupom").value = c.codigo;
    document.getElementById("percentualCupom").value = c.percentual;
    document.getElementById("ativoCupom").checked = c.ativo !== false;
    document.getElementById("tituloFormCupom").textContent = "Editar cupom";
    document.getElementById("botaoSalvarCupom").textContent = "Salvar alterações";
    document.getElementById("cancelarCupom").classList.remove("escondido");
    document.getElementById("mensagemCupomAdmin").textContent = "";
    document.getElementById("formCupom").scrollIntoView();
    document.getElementById("codigoCupom").focus({ preventScroll: true });
    return;
  }
}

function salvarCupom() {
  if (!verificarSessaoAdmin()) return;
  var id = Number(document.getElementById("cupomId").value);
  var codigo = document.getElementById("codigoCupom").value.trim().toUpperCase();
  var percentual = Number(document.getElementById("percentualCupom").value);
  var mensagem = document.getElementById("mensagemCupomAdmin");
  if (!/^[A-Z0-9_-]{3,30}$/.test(codigo) || !isFinite(percentual) || percentual < 0.01 || percentual > 100) {
    mensagem.textContent = "Use um código de 3 a 30 letras, números, hífen ou sublinhado, e um desconto entre 0,01% e 100%.";
    return;
  }
  var lista = lerDados("infratechCupons", []), indice = -1;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].codigo === codigo && lista[i].id !== id) {
      mensagem.textContent = "Já existe um cupom com esse código.";
      return;
    }
    if (lista[i].id === id) indice = i;
  }
  if (id > 0 && indice === -1) {
    mensagem.textContent = "Cupom não encontrado. Atualize a página.";
    return;
  }
  var cupom = {
    id: id || proximoId(lista), codigo: codigo,
    percentual: Math.round(percentual * 100) / 100,
    ativo: document.getElementById("ativoCupom").checked
  };
  if (indice === -1) lista.push(cupom); else lista[indice] = cupom;
  if (!salvarDados("infratechCupons", lista)) return;
  cupons = lista;
  limparFormCupom();
  mostrarCuponsAdmin();
  atualizarResumoAdmin();
  mensagem.textContent = id ? "Cupom atualizado." : (cupom.ativo ? "Cupom criado e pronto para usar na loja." : "Cupom criado como inativo.");
}

function alternarCupom(id) {
  if (!verificarSessaoAdmin()) return;
  var lista = lerDados("infratechCupons", []);
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id !== id) continue;
    lista[i].ativo = lista[i].ativo === false;
    if (!salvarDados("infratechCupons", lista)) return;
    cupons = lista;
    if (Number(document.getElementById("cupomId").value) === id) {
      document.getElementById("ativoCupom").checked = lista[i].ativo;
    }
    mostrarCuponsAdmin();
    atualizarResumoAdmin();
    document.getElementById("mensagemCupomAdmin").textContent = lista[i].ativo ? "Cupom ativado." : "Cupom desativado.";
    document.getElementById("estado-cupom-" + id).focus();
    return;
  }
}

function atualizarPainel() {
  if (!adminAutenticado || usuarioLogado !== "admin") return;
  carregarCatalogo();
  mostrarMensagensAdmin();
  mostrarUsuariosAdmin();
  mostrarProdutosAdmin();
  mostrarCuponsAdmin();
  atualizarResumoAdmin();
}



mostrarProdutos();
salvarCarrinho();
atualizarConta();
verificarAcessoAdmin();

// Links antigos do painel usam a mesma seção e o mesmo login da loja.
if (new URLSearchParams(window.location.search).get("admin") === "1" || window.location.hash === "#admin") {
  abrir("admin");
}

// Recalcula o espaço quando a janela muda de tamanho, inclusive no celular.
window.addEventListener("resize", ajustarCabecalho);
window.addEventListener("load", ajustarCabecalho);
window.addEventListener("focus", verificarAcessoAdmin);

// Recebe alterações feitas no admin em outra aba, sem precisar recarregar a loja.
window.addEventListener("storage", function (evento) {
  if (evento.key === "usuarioLogado") {
    usuarioLogado = localStorage.getItem("usuarioLogado") || "";
    verificarAcessoAdmin();
    return;
  }
  if (adminAutenticado && !document.getElementById("admin").classList.contains("escondido")) {
    atualizarPainel();
  }
  if (evento.key !== "infratechProdutos" && evento.key !== "infratechCupons") return;
  carregarCatalogo();
  mostrarProdutos();
  var retirados = atualizarCarrinhoDisponivel();
  if (!document.getElementById("carrinho").classList.contains("escondido")) mostrarCarrinho();
  if (!document.getElementById("pagamento").classList.contains("escondido")) {
    if (retirados) abrir("carrinho"); else mostrarPagamento();
  }
});
