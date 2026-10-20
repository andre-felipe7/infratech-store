# InfraTech Store

Loja e painel administrativo feitos com HTML, CSS e JavaScript básicos, sem bibliotecas.

## Abrir e acessar o admin

Abra `index.html` normalmente, pelo Live Server ou pelo navegador. Não é necessário iniciar um servidor de login.

1. Clique em **Entrar / Cadastrar**.
2. Use o usuário **admin** e a senha **4747**.
3. Você continua na loja e a opção **Admin** aparece no cabeçalho.
4. Clique em **Admin** para abrir o painel dentro da própria página.

O botão **Sair (admin)** encerra a sessão e esconde a opção administrativa. O nome admin é reservado e não pode ser usado no cadastro comum.

O arquivo `admin.html` apenas encaminha links antigos para essa seção da loja.

O painel e a loja usam o mesmo `script.js`; não há um arquivo separado de login ou de administração para carregar. Depois de atualizar os arquivos, recarregue a página com `Ctrl+F5`.

## O painel permite

- Ler mensagens de contato e marcar como lidas ou não lidas.
- Consultar usuários cadastrados, sem exibir as senhas.
- Criar e editar produtos: nome, descrição, categoria, preço, ícone e link opcional.
- Ativar e desativar produtos. Itens desativados saem da loja e do carrinho.
- Criar, editar, ativar e desativar cupons percentuais.

Os dados ficam no localStorage do navegador. Mantenha o mesmo endereço, porta e navegador para acessar os cadastros existentes. O catálogo inicial e os cupons INFRA10 e BEMVINDO5 são gravados apenas na primeira visita.

## Servidor estático opcional

Se preferir, com Node.js instalado, execute `node servidor.js` e abra <http://127.0.0.1:3000>. Encerre com `Ctrl+C`. Esse servidor apenas entrega os arquivos do site.

## Limites da demonstração

O login administrativo é um controle demonstrativo feito no JavaScript e no sessionStorage. A senha está no código e não é proteção para dados reais. Uma publicação com dados privados precisaria de autenticação e armazenamento no servidor. Não há envio de e-mail ou pagamento real; não use senhas de outros serviços nas contas demonstrativas.
