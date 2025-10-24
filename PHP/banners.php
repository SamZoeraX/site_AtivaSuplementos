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


function read_image_to_blob(?array $file): ?string {
  if (!$file || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) return null;
  $bin = file_get_contents($file['tmp_name']);
  return $bin === false ? null : $bin;
}

// Se for listagem via GET
if (isset($_GET["listar"])) {
    try {
        // Busca todos os banners e junta o nome da categoria
        $sql = "SELECT 
                    b.idBanners,
                    b.descricao,
                    b.link,
                    b.data_validade,
                    b.imagem,
                    c.nome AS categoria
                FROM Banners b
                LEFT JOIN categorias_produtos c
                ON b.CategoriasProdutos_id = c.idCategoriaProduto
                ORDER BY b.idBanners DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $banners = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Converte o campo imagem em base64 para exibir no front
        foreach ($banners as &$banner) {
            if (!empty($banner["imagem"])) {
                $banner["imagem"] = base64_encode($banner["imagem"]);
            }
        }

        // Retorna em JSON
        echo json_encode([
            "ok" => true,
            "banners" => $banners
        ]);
        exit;

    } catch (Exception $e) {
        echo json_encode([
            "ok" => false,
            "erro" => "Erro ao listar banners: " . $e->getMessage()
        ]);
        exit;
    }
}

/* -----------------------------
   CADASTRO DE BANNER (POST)
----------------------------- */
try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => "Método inválido."]);
        exit;
    }

    // Captura e sanitiza os dados
    $descricao = trim($_POST["descricao"] ?? "");
    $link = trim($_POST["link"] ?? "");
    $data_validade = $_POST["data_validade"] ?? "";
    $categoria_id = $_POST["categoria_id"] ?? null;
    $imgBlob = read_image_to_blob($_FILES['imagem'] ?? null);

    // Validação
    $erros = [];
    if (!$imgBlob) $erros[] = "Selecione uma imagem válida.";
    if (empty($data_validade)) $erros[] = "Informe a data de validade.";
    if (empty($categoria_id)) $erros[] = "Selecione uma categoria.";

    if (!empty($erros)) {
        redirecWith("../paginas_logista/promocoes_logista.html", [
            "erro" => implode(" | ", $erros)
        ]);
        exit;
    }

    // Inserção no banco
    $sql = "INSERT INTO Banners 
            (imagem, data_validade, descricao, link, CategoriasProdutos_id)
            VALUES (:imagem, :data_validade, :descricao, :link, :CategoriasProdutos_id)";

    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute([
        ":imagem" => $imgBlob,
        ":data_validade" => $data_validade,
        ":descricao" => $descricao,
        ":link" => $link,
        ":CategoriasProdutos_id" => $categoria_id
    ]);

    if ($ok) {
        redirecWith("../paginas_logista/promocoes_logista.html", ["cadastro" => "ok"]);
    } else {
        redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => "Erro ao cadastrar banner."]);
    }

} catch (Exception $e) {
    redirecWith("../paginas_logista/promocoes_logista.html", [
        "erro" => "Erro no banco de dados: " . $e->getMessage()
    ]);
}
?>
