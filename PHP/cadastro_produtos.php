<?php
require_once __DIR__ . "/conexao.php";

function redirecWith($url, $params = []) {
    if (!empty($params)) {
        $qs = http_build_query($params);
        $sep = (strpos($url, '?') === false) ? '?' : '&';
        $url .= $sep . $qs;
    }
    header("Location: $url");
    exit;
}

function readImageToBlob(?array $file): ?string {
    if (!$file || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    $content = file_get_contents($file['tmp_name']);
    return $content === false ? null : $content;
}

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        redirecWith("../paginas_logista/cadastro_produtos_logista.html", ["erro" => "Método inválido"]);
    }

    $nome = $_POST["nomeproduto"] ?? '';
    $descricao = $_POST["descricao"] ?? '';
    $quantidade = (int)($_POST["quantidade"]);
    $preco = (double)($_POST["preco"]);
    $codigo = $_POST["codigo"] ?? '';
    $Marcas_idMarcas = 1;
    $categorias = 1;

    $img1 = readImageToBlob($_FILES["imgproduto1"] ?? null);
    $img2 = readImageToBlob($_FILES["imgproduto2"] ?? null);
    $img3 = readImageToBlob($_FILES["imgproduto3"] ?? null);

    $erros_validacao = [];
    if ($nome === "" || $descricao === "" || $quantidade <= 0 || $preco <= 0 || $Marcas_idMarcas <= 0) {
        $erros_validacao[] = "Preencha os campos obrigatórios";
    }
    if (!empty($erros_validacao)) {
        redirecWith("../paginas_logista/cadastro_produtos_logista.html", ["erro" => implode(" ", $erros_validacao)]);
    }

    $pdo->beginTransaction();

    // Inserir produto
    $sqlProdutos = "INSERT INTO Produtos (nome, descricao, quantidade, preco, codigo, Marcas_idMarcas, Categorias_produtos_idCategorias_produtos
)
                    VALUES (:nome, :descricao, :quantidade, :preco, :codigo, :Marcas_idMarcas, :categorias)";
    $stmProdutos = $pdo->prepare($sqlProdutos);
    $stmProdutos->execute([
        ":nome" => $nome,
        ":descricao" => $descricao,
        ":quantidade" => $quantidade,
        ":preco" => $preco,
        ":codigo" => $codigo,
        ":Marcas_idMarcas" => $Marcas_idMarcas,
        ":categorias" => $categorias,
    ]);

    $idproduto = (int)$pdo->lastInsertId();

    // Inserir imagens individualmente e vincular
    $imagens = [$img1, $img2, $img3];
    foreach ($imagens as $img) {
        if ($img !== null) {
            $sqlImg = "INSERT INTO Imagens_produtos (foto) VALUES (:foto)";
            $stmImg = $pdo->prepare($sqlImg);
            $stmImg->bindValue(":foto", $img, PDO::PARAM_LOB);
            $stmImg->execute();
            $idImg = (int)$pdo->lastInsertId();

            $sqlVincular = "INSERT INTO Produtos_has_Imagens_produtos (Produtos_idProdutos, Imagens_produtos_idImagens_produtos)
                             VALUES (:idpro, :idimg)";
            $stmVincular = $pdo->prepare($sqlVincular);
            $stmVincular->execute([
                ":idpro" => $idproduto,
                ":idimg" => $idImg
            ]);
        }
    }

    $pdo->commit();

    redirecWith("../paginas_logista/cadastro_produtos_logista.html", ["sucesso" => "Produto cadastrado com sucesso!"]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    redirecWith("../paginas_logista/cadastro_produtos_logista.html", ["erro" => "Erro no banco de dados: " . $e->getMessage()]);
}
?>
