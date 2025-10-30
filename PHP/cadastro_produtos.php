<?php

// Conectando este arquivo ao banco de dados
require_once __DIR__ . "/conexao.php";

// função para redirecionar com parâmetros (anexa query string e envia Location)
function redirecWith($url, $params = []) {
  // Se houver parâmetros, monta a query (?a=1&b=2) e acrescenta à URL
  if (!empty($params)) {
    $qs  = http_build_query($params);
    // Usa '?' se não houver query ainda; senão usa '&'
    $sep = (strpos($url, '?') === false) ? '?' : '&';
    $url .= $sep . $qs;
  }
  // Envia cabeçalho de redirecionamento e encerra
  header("Location: $url");
  exit;
}

/* Lê arquivo de upload como blob (ou null)
   - Retorna string binária (conteúdo do arquivo) ou null se não houve upload
   - Útil para salvar imagens no banco (BLOB) */
function readImageToBlob(?array $file): ?string {
  // Validações mínimas de upload: array presente, tmp_name e sem erro
  if (!$file || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) return null;
  // Lê o conteúdo do arquivo temporário
  $content = file_get_contents($file['tmp_name']);
  // Se falhar, retorna null; caso contrário, retorna o binário
  return $content === false ? null : $content;
}

// ===================== LISTAR POR CATEGORIA ===================== //
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['listar_por_categoria'])) {
  // aceita idCategoria, idcategoria ou categoria_id
  $catId = (int)($_GET['idCategoria'] ?? $_GET['idcategoria'] ?? $_GET['categoria_id'] ?? 0);
  if ($catId <= 0) {
    json_err('idCategoria inválido');
  }

  try {
    // Filtra produtos pela categoria (relacionamento direto)
    $sql = "SELECT
              p.idProdutos,
              p.nome,
              p.descricao,
              p.quantidade,
              p.preco,
              p.preco_promocional,
              m.nome AS marca,
              c.nome AS categoria,
              (SELECT i.foto
                 FROM Imagem_produtos i
                 JOIN Produtos_has_Imagem_produtos pi 
                   ON pi.Imagem_produtos_idImagem_produtos = i.idImagem_produtos
                WHERE pi.Produtos_idProdutos = p.idProdutos
                ORDER BY i.idImagem_produtos ASC
                LIMIT 1) AS imagem,
              (SELECT i.texto_alternativo
                 FROM Imagem_produtos i
                 JOIN Produtos_has_Imagem_produtos pi 
                   ON pi.Imagem_produtos_idImagem_produtos = i.idImagem_produtos
                WHERE pi.Produtos_idProdutos = p.idProdutos
                ORDER BY i.idImagem_produtos ASC
                LIMIT 1) AS texto_alternativo
            FROM Produtos p
            LEFT JOIN Marcas m 
              ON m.idMarcas = p.Marcas_idMarcas
            INNER JOIN Categorias_produtos c 
              ON c.idCategoriaProduto = p.Categorias_produtos_idCategorias_produtos
            WHERE p.Categorias_produtos_idCategorias_produtos = :catId
            ORDER BY p.idProdutos DESC";

    $st = $pdo->prepare($sql);
    $st->bindValue(':catId', $catId, PDO::PARAM_INT);
    $st->execute();
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    $produtos = array_map(function($r) {
      return [
        'idProdutos'        => (int)$r['idProdutos'],
        'nome'              => $r['nome'],
        'descricao'         => $r['descricao'],
        'quantidade'        => (int)$r['quantidade'],
        'preco'             => (float)$r['preco'],
        'preco_promocional' => isset($r['preco_promocional']) ? (float)$r['preco_promocional'] : null,
        'marca'             => $r['marca'] ?? null,
        'categoria'         => $r['categoria'] ?? null,
        // Converte BLOB da imagem em base64
        'imagem'            => $r['imagem'] ? base64_encode($r['imagem']) : null,
        'texto_alternativo' => $r['texto_alternativo'] ?? null
      ];
    }, $rows);

    json_ok(['count' => count($produtos), 'produtos' => $produtos]);
  } catch (Throwable $e) {
    json_err('Falha ao listar produtos por categoria: ' . $e->getMessage(), 500);
  }
}



try {
   // SE O METODO DE ENVIO FOR DIFERENTE DO POST → redireciona com erro
  if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    redirecWith("../paginas_logista/cadastro_produtos_logista.html", ["erro" => "Método inválido"]);
  }

  // Variáveis do produto (capturadas do formulário)
  $nome   = $_POST["nomeproduto"] ;
  $descricao = $_POST["descricao"] ;
  $quantidade =  (int)$_POST["quantidade"] ;
  $preco  =  (double)$_POST["preco"];
  $codigo  =  (int)$_POST["codigo"] ;
  $marcas_idMarcas = 1; // ID da marca (fixo aqui; poderia vir do formulário)

  // VÁRIAVEIS DAS Imagens (cada input de arquivo vira um BLOB ou null)
  $img1 = readImageToBlob($_FILES["imgproduto1"] ?? null);
  $img2 = readImageToBlob($_FILES["imgproduto2"] ?? null);
  $img3 = readImageToBlob($_FILES["imgproduto3"] ?? null);


  // Validação básica dos campos obrigatórios
  $erros_validacao = [];
  if ($nome === "" || $descricao === "" || 
  $quantidade <= 0 || $preco <= 0 || $marcas_idMarcas <= 0) {
    $erros_validacao[] = "Preencha os campos obrigatórios.";
  }

  // Se houver erros, redireciona informando a mensagem
  if (!empty($erros_validacao)) {
    redirecWith("../paginas_logista/cadastro_produtos_logista.html", ["erro" => implode(" ", $erros_validacao)]);
  }

  // Inicia transação (garante consistência entre inserts)
  $pdo->beginTransaction();

  // INSERT na tabela Produtos (com parâmetros nomeados)
  $sqlProdutos = "INSERT INTO Produtos
    (nome, descricao, quantidade, preco,
    codigo, Marcas_idMarcas)
    VALUES
    (:nome, :descricao, :quantidade, :preco, 
    :codigo, :Marcas_idMarcas)";

  // Prepara o statement
  $stmProdutos = $pdo->prepare($sqlProdutos);

  // Executa o INSERT com os valores vindos do formulário
  $inserirProdutos = $stmProdutos->execute([
    ":nome" => $nome,
    ":descricao"  => $descricao,
    ":quantidade"  => $quantidade,
    ":preco"  => $preco,
    ":codigo"  => $codigo,
    ":Marcas_idMarcas" => $marcas_idMarcas,
  ]);

  // Se falhou ao inserir o produto, desfaz transação e redireciona com erro
  if (!$inserirProdutos) {
    $pdo->rollBack();
    redirecWith("../paginas_logista/cadastro_produtos_logista.html",
     ["erro" => "Falha ao cadastrar produto."]);
  }

  // Recupera o ID do produto recém inserido (auto_increment)
  $idproduto = (int)$pdo->lastInsertId();

  // INSERT das imagens (uma linha por imagem)
  $sqlImagens = "INSERT INTO Imagem_produtos (foto)
   VALUES (:imagem1), (:imagem2), (:imagem3)";
  
  // PREPARA O COMANDO SQL PARA SER EXECUTADO
  $stmImagens = $pdo->prepare($sqlImagens);

  /* Faz o bind de cada placeholder:
     - Se houver conteúdo, usa PARAM_LOB para enviar binário
     - Se não houver, envia NULL com PARAM_NULL */
  if ($img1 !== null) {
    $stmImagens->bindParam(':imagem1', $img1, PDO::PARAM_LOB);
  }else{ 
    $stmImagens->bindValue(':imagem1', null, PDO::PARAM_NULL);
  }

  if ($img2 !== null){
     $stmImagens->bindParam(':imagem2', $img2, PDO::PARAM_LOB);
  }else{
     $stmImagens->bindValue(':imagem2', null, PDO::PARAM_NULL);
  }

  if ($img3 !== null){
     $stmImagens->bindParam(':imagem3', $img3, PDO::PARAM_LOB);
  }else{
     $stmImagens->bindValue(':imagem3', null, PDO::PARAM_NULL);
  }

  // Executa o insert das imagens
  $inserirImagens = $stmImagens->execute();

  // Se falhou, desfaz transação e sinaliza erro
  if (!$inserirImagens) {
    $pdo->rollBack();
    redirecWith("../paginas_logista/cadastro_produtos_logista.html",
     ["erro" => "Falha ao cadastrar imagens."]);
  }

  // Recupera o último ID inserido em Imagem_produtos
  $idImg = (int)$pdo->lastInsertId();


  // Vincula a(s) imagem(ns) ao produto na tabela de relacionamento
  $sqlVincularProdImg = "INSERT INTO Produtos_has_Imagem_produtos
    (Produtos_idProdutos, Imagem_produtos_idImagem_produtos)
    VALUES
    (:idpro, :idimg)";

  // Prepara o statement do vínculo
  $stmVincularProdImg = $pdo->prepare($sqlVincularProdImg);

  // Executa o vínculo produto ↔ imagem
  $inserirVincularProdImg = $stmVincularProdImg->execute([
    ":idpro" => $idproduto,
    ":idimg" => $idImg,
  ]);

  // Se falhou o vínculo, desfaz; senão, confirma sucesso via redirecionamento
  if (!$inserirVincularProdImg) {
    $pdo->rollBack();
    redirecWith("../paginas_logista/cadastro_produtos_logista.html",
     ["erro" => "Falha ao vincular produto com imagem."]);
  }else{
    // (Observação: aqui não há commit explícito; o redirecionamento é feito diretamente)
    redirecWith("../paginas_logista/cadastro_produtos_logista.html",
     ["Cadastro" => "ok"]);
  }
 

} catch (Exception $e) {
  // Em qualquer exceção, redireciona informando a mensagem de erro
  redirecWith("../paginas_logista/cadastro_produtos_logista.html",
    ["erro" => "Erro no banco de dados: " . $e->getMessage()]);
}
