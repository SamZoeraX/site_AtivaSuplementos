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
    $Marcas_idMarcas = 1;
    //criar as variáveis das imagens
$img1   = readImageToBlob($_FILES["imgproduto1"] ?? null);
$img2   = readImageToBlob($_FILES["imgproduto2"] ?? null);
$img3   = readImageToBlob($_FILES["imgproduto3"] ?? null);



//VALIDANDO OS CAMPOS
    $erros_validacao=[];
    // se qualquer campo for vazio
    if($nome === "" || $descricao === "" ||
     $quantidade <= 0 || $preco <= 0
    || $Marcas_idMarcas <= 0){
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

    $inserirProdutos= $stmProdutos->execute([
      ":nome" => $nome,
      ":descricao" => $descricao,
      ":quantidade" => $quantidade,
      ":preco" => $preco,
      ":codigo" => $codigo,
      ":Marcas_idMarcas" => $Marcas_idMarcas,
    ]);
    
if ($inserirProdutos) {
      $pdo -> rollBack();
      redirecWith("../PAGINAS_LOGISTA/cadastro_produtos_logista.html",
      ["Erro" => "Falha ao cadastrar produtos"]);
    }
    //CASO TENHA DADO CERTO, CAPTURE O ID DA IMAGEM CADASTRADA
    $idproduto=(int)$pdo->lastInsertId();

     //cadastro de imagens
     $sqlImagens ="INSERT INTO Imagem_produtos(foto) VALUES
   (:imagem1), 
   (:imagem2), 
   (:imagem3)"
   //PREPARA O COMANDO SQL PARA SER EXECUTADO
   $smtImagens=$pdo -> prepare($sqlImagens);


 if ($img1 === null) {
      $stmImagens->bindParam(':imagem1', $img1, PDO::PARAM_LOB);
    } else {
      $stmImagens->bindValue(':imagem1', null PDO::PARAM_NULL);
    }

    if ($img2 === null) {
      $stmImagens->bindParam(':imagem2', $img2, PDO::PARAM_LOB);
    } else {
      $stmImagens->bindValue(':imagem2', null, PDO::PARAM_NULL);
    }

    if ($img3 === null) {
      $stmImagens->bindParam(':imagem3', $img3, PDO::PARAM_LOB);
    } else {
      $stmImagens->bindValue(':imagem3', null, PDO::PARAM_NULL);
    }

     $inserirImagens = $stmImagens->execute();

//VERIFICAR SE O INSERIR IMAGENS DEU ERRADO
if ($inserirImagens) {
      $pdo -> rollBack();
      redirecWith("../PAGINAS_LOGISTA/cadastro_produtos_logista.html",
      ["Erro" => "Falha ao cadastrar produtos"]);
    }

    //CASO TENHA DADO CERTO, CAPTURE O ID DA IMAGEM CADASTRADA
    $idImg=(int)$pdo->lastInsertId();


    //VINCULAR A IMAGEM COM O PRODUTO
    $sqlVincularProdImg ="INSERT INTO Produtos_has_Imagens_produtos
    (Produtos_idProdutos,Imagem_produtos_idImagem_produtos) VALUES
    (:idpro,idimg)";

    $stmVincularProdImg=$pdo -> prepare($sqlVincularProdImg);

    $inserirVincularProdImg=$stmVincularProdImg->execute([
      ":idpro"=> $idproduto,
      ":idimg"=> $idImg,
    ]);

    

     /* Verificando se foi cadastrado no banco de dados */
     if($inserirVincularProdImg) {
      $pdo->rollBack();
        redirecWith("../paginas_logista/cadastro_produtos_logista.html",
        ["Erro" => "Falha ao vinvular produto com a imagem."]) ;
     }

}catch(Exception $e){
 redirecWith("../paginas_logista/cadastro_produtos_logista.html",
      ["erro" => "Erro no banco de dados: " . $e->getMessage()]);
}

?>