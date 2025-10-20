<?php
require_once __DIR__ . "/conexao.php";

// Função para redirecionar com parâmetros
function redirecWith($url, $params = []) {
    if (!empty($params)) {
        $qs = http_build_query($params);
        $sep = (strpos($url, '?') === false) ? '?' : '&';
        $url .= $sep . $qs;
    }
    header("Location: $url");
    exit;
}

// Função para ler o arquivo de imagem e converter em blob
function read_image_to_blob(?array $file): ?string {
    if (!$file || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) return null;
    $bin = file_get_contents($file['tmp_name']);
    return $bin === false ? null : $bin;
}

/* -----------------------------
   LISTAGEM DE BANNERS (GET)
----------------------------- */
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["listar"])) {
    try {
        $sqllistar = "
            SELECT 
                b.idBanners AS id,
                b.imagem,
                b.descricao,
                b.data_validade,
                b.link,
                c.nome AS categoria
            FROM Banners b
            LEFT JOIN categorias_produtos c 
                ON b.CategoriasProdutos_id = c.idCategoriaProduto
            ORDER BY b.idBanners DESC
        ";

        $stmtlistar = $pdo->query($sqllistar);
        $listar = $stmtlistar->fetchAll(PDO::FETCH_ASSOC);

        // Converter imagem para base64
        foreach ($listar as &$banner) {
            $banner["imagem"] = $banner["imagem"]
                ? "data:image/jpeg;base64," . base64_encode($banner["imagem"])
                : null;
        }
        unset($banner);

        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => true, "banners" => $listar], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Throwable $e) {
        header("Content-Type: application/json; charset=utf-8", true, 500);
        echo json_encode([
            "ok" => false,
            "error" => "Erro ao listar banners",
            "detail" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
return;



/* -----------------------------
   CADASTRO DE BANNER (POST)
----------------------------- */
try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        redirecWith("../PAGINAS_LOGISTA/promocoes_logista.html", ["erro" => "Método inválido"]);
    }

    // Captura os dados do formulário
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
        redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => implode(" | ", $erros)]);
    }

    // Inserir no banco
    $sql = "INSERT INTO Banners (imagem, data_validade, descricao, link, CategoriasProdutos_id)
            VALUES (:imagem, :data_validade, :descricao, :link, :categoria_id)";
    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute([
        ":imagem" => $imgBlob,
        ":data_validade" => $data_validade,
        ":descricao" => $descricao,
        ":link" => $link,
        ":categoria_id" => $categoria_id
    ]);

    if ($ok) {
        redirecWith("../paginas_logista/promocoes_logista.html", ["cadastro" => "ok"]);
    } else {
        redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => "Erro ao cadastrar banner"]);
    }

} catch (Exception $e) {
    redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => "Erro no banco de dados: " . $e->getMessage()]);
}
?>
