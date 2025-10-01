<?php
// Conectando este arquivo ao banco de dados
require_once __DIR__ . "/conexao.php";

// função para capturar os dados passados de uma página a outra
function redirecWith($url,$params=[]){
    // verifica se os parametros nao vieram vazios
    if(!empty($params)){
        // separar os parametros em espaços diferentes
    $qs= http_build_query($params);
    $sep = (strpos($url,'?') === false) ? '?' : '&';
    $url .= $sep . $qs;
}
// joga a url para o cabeçalho no navegador
header("Location: $url");
// fecha o script
exit;
}

try{

     // SE O METODO DE ENVIO FOR DIFERENTE DE POST
    if($_SERVER['REQUEST_METHOD'] != 'POST'){
        // VOLTAR À TELA DE CADASTRO E EXIBIR ERRO
        redirecWith("../paginas/fretepagamento.html",
        ["erro"=> "Metodo inválido"]);
    }

    // variaveis
    $bairro = $_POST["bairro"];
    $valor = $_POST["valor"];
    $cidade = $_POST["cidade"];

    //validação
    $erros_validacao=[];
    // se qualquer campo for vazio
    if($bairro === "" || $valor === "" || $cidade === ""){
        $erros_validacao[]="Preencha todos os campos";
    }

    /* Inserir o cliente no banco de dados */
$sql ="INSERT INTO 
Formas_pagamento (bairro, valor, cidade)
VALUES (:bairro, :valor, :cidade)";
// executamos o comando no banco de dados
$inserir = $pdo->prepare($sql)->execute([
    ":bairro"=> $bairro,
    ":valor"=> $valor,
    ":cidade"=> $cidade,
]);

/* Verificando se foi cadastrado no banco de dados */
if($inserir){
    redirecWith("../paginas/fretepagamento.html",
    ["cadastro" => "ok"]) ;
}else{
    redirecWith("../paginas/fretepagamento.html",
     ["erro" => "Erro ao cadastrar no banco de dados"]);
}

}catch(PDOException $e){
   redirecWith("../paginas/fretepagamento.html",
   ["erro" => "Erro ao cadastrar no banco de dados:"
   .$e->getMessage()]);
}

?>