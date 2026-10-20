// Servidor estático opcional. O site também funciona pelo Live Server.
var http = require("http");
var fs = require("fs");
var path = require("path");
var porta = Number(process.env.PORT) || 3000;
var arquivos = ["index.html", "admin.html", "style.css", "admin.css", "script.js", "dados.js"];
var tipos = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

var servidor = http.createServer(function (pedido, resposta) {
  var nome = new URL(pedido.url, "http://127.0.0.1").pathname;
  if (nome === "/") nome = "/index.html";
  nome = nome.slice(1);
  if (arquivos.indexOf(nome) === -1 || (pedido.method !== "GET" && pedido.method !== "HEAD")) {
    resposta.writeHead(404);
    resposta.end("Arquivo não encontrado.");
    return;
  }
  fs.readFile(path.join(__dirname, nome), function (erro, conteudo) {
    if (erro) {
      resposta.writeHead(500);
      resposta.end("Não foi possível abrir o arquivo.");
      return;
    }
    resposta.writeHead(200, { "Content-Type": tipos[path.extname(nome)] + "; charset=utf-8", "Cache-Control": "no-store" });
    if (pedido.method === "HEAD") resposta.end(); else resposta.end(conteudo);
  });
});

servidor.on("error", function (erro) {
  console.error("Não foi possível iniciar o servidor: " + erro.message);
  process.exitCode = 1;
});
servidor.listen(porta, "127.0.0.1", function () {
  console.log("Loja: http://127.0.0.1:" + porta);
});
