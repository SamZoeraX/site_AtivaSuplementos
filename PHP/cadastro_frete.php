<?php
// Conectando este arquivo ao banco de dados
require_once __DIR__ . "/conexao.php";

// Função auxiliar para redirecionar com parâmetros
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
    // 🔹 MODO LISTAGEM (para o JavaScript)
    if (isset($_GET['listar'])) {
        header("Content-Type: application/json; charset=utf-8");

        $stmt = $pdo->query("SELECT idFretes, bairro, valor, trasportadora FROM Fretes ORDER BY idFretes DESC");
        $dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "ok" => true,
            "fretes" => $dados
        ]);
        exit;
    }

    // 🔹 MODO INSERÇÃO
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        redirecWith("../PAGINAS_LOGISTA/frete_pagamento_logista.html", [
            "erro" => "Método inválido"
        ]);
    }

    // Captura de dados
    $bairro = trim($_POST["bairro"] ?? "");
    $valor = trim($_POST["valor"] ?? "");
    $trasportadora = trim($_POST["trasportadora"] ?? "");

    // Validação
    if ($bairro === "" || $valor === "" || $trasportadora === "") {
        redirecWith("../PAGINAS_LOGISTA/frete_pagamento_logista.html", [
            "erro" => "Preencha todos os campos."
        ]);
    }

    // Inserção no banco
    $sql = "INSERT INTO Fretes (bairro, valor, trasportadora) 
            VALUES (:bairro, :valor, :trasportadora)";
    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute([
        ":bairro" => $bairro,
        ":valor" => $valor,
        ":trasportadora" => $trasportadora
    ]);

    if ($ok) {
        redirecWith("../PAGINAS_LOGISTA/frete_pagamento_logista.html", [
            "cadastro" => "ok"
        ]);
    } else {
        redirecWith("../PAGINAS_LOGISTA/frete_pagamento_logista.html", [
            "erro" => "Erro ao cadastrar no banco de dados."
        ]);
    }
} catch (Exception $e) {
    redirecWith("../PAGINAS_LOGISTA/frete_pagamento_logista.html", [
        "erro" => "Erro no banco de dados: " . $e->getMessage()
    ]);
}
?>
