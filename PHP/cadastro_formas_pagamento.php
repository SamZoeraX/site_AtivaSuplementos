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

if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["listar"])) {
  try {
    // Comando de listagem
    $sqllistar = "SELECT idFormas_pagamento AS id, nome 
                  FROM Formas_pagamento 
                  ORDER BY nome";

    // Executa
    $stmtlistar = $pdo->query($sqllistar);
    $listar = $stmtlistar->fetchAll(PDO::FETCH_ASSOC);

    // Formato do retorno
    $formato = isset($_GET["format"]) ? strtolower($_GET["format"]) : "option";

    if ($formato === "json") {
      header("Content-Type: application/json; charset=utf-8");
      echo json_encode(["ok" => true, "Formas_pagamento" => $listar], JSON_UNESCAPED_UNICODE);
      exit;
    }

    // RETORNO PADRÃO (options)
    header("Content-Type: text/html; charset=utf-8");
    foreach ($listar as $lista) {
      $id   = (int)$lista["id"];
      $nome = htmlspecialchars($lista["nome"], ENT_QUOTES, "UTF-8");
      echo "<option value=\"{$id}\">{$nome}</option>\n";
    }
    exit;

  } catch (Throwable $e) {
    // Erro na listagem
    if (isset($_GET["format"]) && strtolower($_GET["format"]) === "json") {
      header("Content-Type: application/json; charset=utf-8", true, 500);
      echo json_encode(
        ["ok" => false, "error" => "Erro ao listar formas de pagamento", "detail" => $e->getMessage()],
        JSON_UNESCAPED_UNICODE
      );
    } else {
      header("Content-Type: text/html; charset=utf-8", true, 500);
      echo "<option disabled>Erro ao carregar formas de pagamento</option>";
    }
    exit;
  }
}













try {
   

    // 🔹 MODO INSERÇÃO
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        redirecWith("../PAGINAS_LOGISTA/frete_pagamento_logista.html", [
            "erro" => "Método inválido"
        ]);
    }

    // Captura de dados do formulário
    $nomepagamento = trim($_POST["nomepagamento"] ?? "");

    // Validação
    if ($nomepagamento === "") {
        redirecWith("../PAGINAS_LOGISTA/frete_pagamento_logista.html", [
            "erro" => "Preencha o campo de nome da forma de pagamento."
        ]);
    }

    // Inserção no banco de dados
    $sql = "INSERT INTO Formas_pagamento (nome) VALUES (:nomepagamento)";
    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute([":nomepagamento" => $nomepagamento]);

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
