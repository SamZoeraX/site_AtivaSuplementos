<?php

// Conectando este arquivo ao banco de dados
require_once __DIR__ ."/conexao.php";

// função para capturar os dados passados de uma página a outra
function redirecWith($url,$params=[]){
// verifica se os os paramentros não vieram vazios
 if(!empty($params)){
// separar os parametros em espaços diferentes
$qs= http_build_query($params);
$sep = (strpos($url,'?') === false) ? '?': '&';
$url .= $sep . $qs;
}
// joga a url para o cabeçalho no navegador
header("Location:  $url");
// fecha o script
exit;
}

/* Lê arquivo de upload como blob (ou null) */
function readImageToBlob(?array $file): ?string {
  if (!$file || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) return null;
  $content = file_get_contents($file['tmp_name']);
  return $content === false ? null : $content;
}

try{
// SE O METODO DE ENVIO FOR DIFERENTE DO POST
    if($_SERVER["REQUEST_METHOD"] !== "POST"){
        //VOLTAR À TELA DE CADASTRO E EXIBIR ERRO
        redirecWith("../paginas_logista/cadastro_produtos_logista.html",
           ["erro"=> "Metodo inválido"]);
    }

    //criar as variáveis
    $nome = $_POST["nome"];
    $descricao = $_POST["descricao"];
    $quantidade = (int)$_POST["quantidade"];
    $preco = (double)$_POST["preco"];
    $codigo = (int)$_POST["codigo"];
    $marcas_idMarcas = 1;
    //criar as variáveis das imagens
$img1   = readImageToBlob($_FILES["imgproduto1"] ?? null);
$img2   = readImageToBlob($_FILES["imgproduto2"] ?? null);
$img3   = readImageToBlob($_FILES["imgproduto3"] ?? null);

//VALIDANDO OS CAMPOS
    $erros_validacao=[];
    // se qualquer campo for vazio
    if($nome === "" || $descricao === "" || $quantidade === "" || $preco === ""
    || $marcas_idMarcas = 0){
        $erros_validacao[]="Preencha os campos obrigatórios";
    }
// se houver erros, volta para a tela com a mensagem
    if(!empty($erros_validacao)){
        redirecWith("../paginas_logista/cadastro_produtos_logista.html",
        ["erro" => implode(" ",$erros_validacao)]);
    }

    // é utilizado para fazer vinculos de transações
    $pdo ->beginTransaction();

    // fazer o commando de inserir dentro da tabela de produtos
    $sqlProdutos = "INSERT INTO produtos (nome, descricao, quantidade, preco, codigo,
    Marcas_idMarcas)
    VALUES (:nome,:descricao,:quantidade,:preco,:codigo,:Marcas_idMarcas)";

    $stmProdutos = $pdo -> prepare($sqlProdutos);

    $inserirProdutos=$stmProdutos->execute([

    ]);




    /* Inserir o produto no banco de dados */
    $sql ="INSERT INTO produtos (nome, descricao, quantidade, preco, codigo,
    marcas_idMarcas, img1, img2, img3)
     Values (:nome, :descricao, :quantidade, :preco, :codigo,
     :marcas_idMarcas, :img1, :img2, :img3)";
     // executando o comando no banco de dados
     $stmt = $pdo->prepare($sql);
     $stmt->bindValue(":nome", $nome, PDO::PARAM_STR);
     $stmt->bindValue(":descricao", $descricao, PDO::PARAM_STR);
     $stmt->bindValue(":quantidade", $quantidade, PDO::PARAM_INT);
     $stmt->bindValue(":preco", $preco);
     $stmt->bindValue(":codigo", $codigo, PDO::PARAM_INT);
     $stmt->bindValue(":marcas_idMarcas", $marcas_idMarcas, PDO::PARAM_INT);

     if ($img1 === null) {
      $stmt->bindValue(":img1", null, PDO::PARAM_NULL);
    } else {
      $stmt->bindValue(":img1", $img1, PDO::PARAM_LOB);
    }

    if ($img2 === null) {
      $stmt->bindValue(":img2", null, PDO::PARAM_NULL);
    } else {
      $stmt->bindValue(":img2", $img2, PDO::PARAM_LOB);
    }

    if ($img3 === null) {
      $stmt->bindValue(":img3", null, PDO::PARAM_NULL);
    } else {
      $stmt->bindValue(":img3", $img3, PDO::PARAM_LOB);
    }

     $inserir = $stmt->execute();

     /* Verificando se foi cadastrado no banco de dados */
     if($inserir){
        redirecWith("../paginas_logista/cadastro_produtos_logista.html",
        ["cadastro" => "ok"]) ;
     }else{
        redirecWith("../paginas_logista/c

}catch(Exception $e){
 redirecWith("../paginas_logista/cadastro_produtos_logista.html",
      ["erro" => "Erro no banco de dados: " . $e->getMessage()]);
}

?>