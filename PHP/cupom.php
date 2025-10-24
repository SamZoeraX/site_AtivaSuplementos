<?php
require_once __DIR__ . "/conexao.php";

// 🔹 Função auxiliar de redirecionamento com parâmetros
function redirecWith($url, $params = [])
{
    if (!empty($params)) {
        $qs = http_build_query($params);
        $sep = (strpos($url, '?') === false) ? '?' : '&';
        $url .= $sep . $qs;
    }
    header("Location: $url");
    exit;
}

try {
    /* -----------------------------
       LISTAGEM DE CUPONS (GET)
    ----------------------------- */
    if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["listar"])) {
        header("Content-Type: application/json; charset=utf-8");

        $stmt = $pdo->query("SELECT * FROM Cupom ORDER BY idCupom DESC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $cupons = array_map(function ($r) {
            return [
                'idCupom'       => (int)$r['idCupom'],
                'nome'          => $r['nome'],
                'valor'         => (float)$r['valor'],
                'data_validade' => $r['data_validade'],
                'quantidade'    => (int)$r['quantidade']
            ];
        }, $rows);

        echo json_encode(
            ['ok' => true, 'count' => count($cupons), 'cupons' => $cupons],
            JSON_UNESCAPED_UNICODE
        );
        exit;
    }

    /* -----------------------------
       CADASTRO DE CUPOM (POST)
    ----------------------------- */
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => "Método inválido."]);
    }

    // Captura os dados do formulário
    $nome = trim($_POST["nome"] ?? "");
    $valor = trim($_POST["valor"] ?? "");
    $data_validade = trim($_POST["data_validade"] ?? "");
    $quantidade = trim($_POST["quantidade"] ?? "");

    // Validação
    $erros = [];
    if ($nome === "") $erros[] = "Informe o nome do cupom.";
    if ($valor === "" || !is_numeric($valor)) $erros[] = "Informe um valor válido.";
    if ($data_validade === "") $erros[] = "Informe a data de validade.";
    if ($quantidade === "" || !ctype_digit($quantidade)) $erros[] = "Informe uma quantidade válida.";

    if (!empty($erros)) {
        redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => implode(" | ", $erros)]);
    }

    // Inserir no banco
    $sql = "INSERT INTO Cupom (nome, valor, data_validade, quantidade)
            VALUES (:nome, :valor, :data_validade, :quantidade)";
    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute([
        ":nome" => $nome,
        ":valor" => $valor,
        ":data_validade" => $data_validade,
        ":quantidade" => $quantidade
    ]);

    if ($ok) {
        redirecWith("../paginas_logista/promocoes_logista.html", ["cadastro" => "ok"]);
    } else {
        redirecWith("../paginas_logista/promocoes_logista.html", ["erro" => "Erro ao cadastrar cupom."]);
    }

} catch (Exception $e) {
    redirecWith("../paginas_logista/cupons_logista.html", [
        "erro" => "Erro no banco de dados: " . $e->getMessage()
    ]);
}
?>
