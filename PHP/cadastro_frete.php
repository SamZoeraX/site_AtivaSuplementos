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


/* ============================ ATUALIZAÇÃO DE FRETES ============================ */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'atualizar') {
  try {
    $id = (int)($_POST['id'] ?? 0);
    $bairro = trim($_POST['bairro'] ?? '');
    $valor = isset($_POST['valor']) ? (double)$_POST['valor'] : 0.0;
    $transportadora = trim($_POST['transportadora'] ?? '');

    if ($id <= 0) {
      redirecWith('../paginas_logista/frete_pagamento_logista.html', [
        'erro_frete' => 'ID inválido para atualização.'
      ]);
    }

    if ($bairro === '') {
      redirecWith('../paginas_logista/frete_pagamento_logista.html', [
        'erro_frete' => 'O nome do bairro é obrigatório.'
      ]);
    }

    if ($valor <= 0) {
      redirecWith('../paginas_logista/frete_pagamento_logista.html', [
        'erro_frete' => 'O valor do frete deve ser maior que zero.'
      ]);
    }

    // Atualiza o registro no banco
    $sql = "UPDATE Fretes 
               SET bairro = :b, valor = :v, transportadora = :t
             WHERE idFretes = :id";
    $st = $pdo->prepare($sql);
    $ok = $st->execute([
      ':b'  => $bairro,
      ':v'  => $valor,
      ':t'  => $transportadora,
      ':id' => $id
    ]);

    if ($ok) {
      redirecWith('../paginas_logista/frete_pagamento_logista.html', [
        'editar_frete' => 'ok'
      ]);
    } else {
      redirecWith('../paginas_logista/frete_pagamento_logista.html', [
        'erro_frete' => 'Falha ao atualizar o frete.'
      ]);
    }

  } catch (Throwable $e) {
    redirecWith('../paginas_logista/frete_pagamento_logista.html', [
      'erro_frete' => 'Erro ao atualizar: ' . $e->getMessage()
    ]);
  }
}



if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'excluir') {
    try {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) throw new Exception('ID inválido');

        $st = $pdo->prepare("DELETE FROM Fretes WHERE idFretes = :id");
        $st->bindValue(':id', $id, PDO::PARAM_INT);
        $st->execute();

        // Retorna JSON se for AJAX
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => true]);
            exit;
        }

        // fallback para redirect normal
        redirecWith('../paginas_logista/pagamentos_fretes_logista.html', ['excluir_frete' => 'ok']);

    } catch (Throwable $e) {
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
            header('Content-Type: application/json; charset=utf-8', true, 500);
            echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
            exit;
        }
        redirecWith('../paginas_logista/pagamentos_fretes_logista.html', ['erro_frete' => $e->getMessage()]);
    }
}





/* ============================ LISTAR FRETES ============================ */
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["listar"])) {
  try {
    // Busca fretes no banco com campos padronizados
    $sqllistar = "SELECT idFretes AS id, bairro, valor, transportadora
                    FROM Fretes
                 ORDER BY bairro ASC, valor ASC";

    $stmtlistar = $pdo->query($sqllistar);
    $listar = $stmtlistar->fetchAll(PDO::FETCH_ASSOC);

    // Define formato de saída (json ou html)
    $formato = isset($_GET["format"]) ? strtolower($_GET["format"]) : "html";

    if ($formato === "json") {
      // Retorna como JSON
      $saida = array_map(function ($item) {
        return [
          "id"             => (int)$item["id"],
          "bairro"         => $item["bairro"],
          "valor"          => (float)$item["valor"],
          "transportadora" => $item["transportadora"],
        ];
      }, $listar);

      header("Content-Type: application/json; charset=utf-8");
      echo json_encode(["ok" => true, "fretes" => $saida], JSON_UNESCAPED_UNICODE);
      exit;
    }

    // Retorna como HTML (para tabela)
    header("Content-Type: text/html; charset=utf-8");

    if (empty($listar)) {
      echo "<tr><td colspan='4' class='text-center'>Nenhum frete cadastrado</td></tr>";
    } else {
      foreach ($listar as $f) {
        $id     = (int)$f["id"];
        $bairro = htmlspecialchars($f["bairro"], ENT_QUOTES, "UTF-8");
        $transp = htmlspecialchars($f["transportadora"] ?? "-", ENT_QUOTES, "UTF-8");
        $valorFmt = number_format((float)$f["valor"], 2, ",", ".");
        echo "<tr>
                <td>{$id}</td>
                <td>{$bairro}</td>
                <td>{$transp}</td>
                <td>R$ {$valorFmt}</td>
              </tr>\n";
      }
    }
    exit;

  } catch (Throwable $e) {
    // Tratamento de erro
    if (isset($_GET["format"]) && strtolower($_GET["format"]) === "json") {
      header("Content-Type: application/json; charset=utf-8", true, 500);
      echo json_encode(
        ["ok" => false, "error" => "Erro ao listar fretes", "detail" => $e->getMessage()],
        JSON_UNESCAPED_UNICODE
      );
    } else {
      header("Content-Type: text/html; charset=utf-8", true, 500);
      echo "<tr><td colspan='4' class='text-center text-danger'>Erro ao carregar fretes</td></tr>";
    }
    exit;
  }
}


/* ============================ CADASTRAR FRETE ============================ */
try {
  // Se o método não for POST, redireciona com erro
  if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    redirecWith("../paginas_logista/frete_pagamento_logista.html", [
      "erro" => "Método inválido"
    ]);
  }

  // Lê dados do formulário
  $bairro = trim($_POST["bairro"] ?? '');
  $valor = (double)($_POST["valor"] ?? 0);
  $transportadora = trim($_POST["transportadora"] ?? '');

  // Validação
  $erros_validacao = [];
  if ($bairro === '' || $valor <= 0) {
    $erros_validacao[] = "Preencha todos os campos obrigatórios corretamente.";
  }

  if (!empty($erros_validacao)) {
    redirecWith("../paginas_logista/frete_pagamento_logista.html", [
      "erro" => implode(" | ", $erros_validacao)
    ]);
  }

  // Inserir no banco
  $sql = "INSERT INTO Fretes (bairro, valor, transportadora)
          VALUES (:bairro, :valor, :transportadora)";
  $stmt = $pdo->prepare($sql);
  $ok = $stmt->execute([
    ":bairro"        => $bairro,
    ":valor"         => $valor,
    ":transportadora"=> $transportadora
  ]);

  if ($ok) {
    redirecWith("../paginas_logista/frete_pagamento_logista.html", [
      "cadastro" => "ok"
    ]);
  } else {
    redirecWith("../paginas_logista/frete_pagamento_logista.html", [
      "erro" => "Erro ao cadastrar o frete no banco de dados."
    ]);
  }

} catch (Throwable $e) {
  redirecWith("../paginas_logista/frete_pagamento_logista.html", [
    "erro" => "Erro no banco de dados: " . $e->getMessage()
  ]);
}

?>