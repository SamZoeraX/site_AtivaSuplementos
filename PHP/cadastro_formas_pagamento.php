<?php
// ============================ CONEXÃO COM O BANCO ============================ //
require_once __DIR__ . "/conexao.php";

// Função auxiliar para redirecionar com parâmetros na URL
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


/* ============================ ATUALIZAR PAGAMENTO ============================ */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'atualizar') {
    try {
        $id   = (int)($_POST['id'] ?? 0);
        $nome = trim($_POST['nome'] ?? '');

        if ($id <= 0) {
            redirecWith('../paginas_logista/frete_pagamento_logista.html', [
                'erro_pagamento' => 'ID inválido para atualização.'
            ]);
        }

        if ($nome === '') {
            redirecWith('../paginas_logista/frete_pagamento_logista.html', [
                'erro_pagamento' => 'O nome da forma de pagamento é obrigatório.'
            ]);
        }

        // Atualizar no banco
        $sql = "UPDATE Formas_pagamento SET nome = :n WHERE idFormas_pagamento = :id";
        $st = $pdo->prepare($sql);
        $ok = $st->execute([
            ':n'  => $nome,
            ':id' => $id
        ]);

        if ($ok) {
            redirecWith('../paginas_logista/frete_pagamento_logista.html', [
                'editar_pagamento' => 'ok'
            ]);
        } else {
            redirecWith('../paginas_logista/frete_pagamento_logista.html', [
                'erro_pagamento' => 'Falha ao atualizar a forma de pagamento.'
            ]);
        }

    } catch (Throwable $e) {
        redirecWith('../paginas_logista/frete_pagamento_logista.html', [
            'erro_pagamento' => 'Erro ao atualizar: ' . $e->getMessage()
        ]);
    }
}



/* ============================ EXCLUIR PAGAMENTO ============================ */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'excluir') {
    try {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) throw new Exception('ID inválido.');

        $st = $pdo->prepare("DELETE FROM Formas_pagamento WHERE idFormas_pagamento = :id");
        $st->bindValue(':id', $id, PDO::PARAM_INT);
        $st->execute();

        // Se for requisição AJAX (fetch)
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => true]);
            exit;
        }

        // Redireciona em fallback (acesso direto)
        redirecWith('../paginas_logista/frete_pagamento_logista.html', [
            'excluir_pagamento' => 'ok'
        ]);

    } catch (Throwable $e) {
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
            header('Content-Type: application/json; charset=utf-8', true, 500);
            echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
            exit;
        }
        redirecWith('../paginas_logista/frete_pagamento_logista.html', [
            'erro_pagamento' => $e->getMessage()
        ]);
    }
}



/* ============================ LISTAR PAGAMENTOS ============================ */
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["listar"])) {
    try {
        $sqlListar = "SELECT idFormas_pagamento AS id, nome 
                        FROM Formas_pagamento 
                    ORDER BY nome ASC";

        $stmt = $pdo->query($sqlListar);
        $listar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formato = isset($_GET["format"]) ? strtolower($_GET["format"]) : "html";

        if ($formato === "json") {
            $saida = array_map(function ($item) {
                return [
                    "id"   => (int)$item["id"],
                    "nome" => $item["nome"]
                ];
            }, $listar);

            header("Content-Type: application/json; charset=utf-8");
            echo json_encode(["ok" => true, "pagamentos" => $saida], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // HTML padrão (caso queira renderizar direto)
        header("Content-Type: text/html; charset=utf-8");

        if (empty($listar)) {
            echo "<tr><td colspan='2' class='text-center text-muted'>Nenhuma forma de pagamento cadastrada.</td></tr>";
        } else {
            foreach ($listar as $p) {
                $id   = (int)$p["id"];
                $nome = htmlspecialchars($p["nome"], ENT_QUOTES, "UTF-8");
                echo "<tr>
                        <td>{$id}</td>
                        <td>{$nome}</td>
                      </tr>\n";
            }
        }
        exit;

    } catch (Throwable $e) {
        if (isset($_GET["format"]) && strtolower($_GET["format"]) === "json") {
            header("Content-Type: application/json; charset=utf-8", true, 500);
            echo json_encode(
                ["ok" => false, "error" => "Erro ao listar formas de pagamento", "detail" => $e->getMessage()],
                JSON_UNESCAPED_UNICODE
            );
        } else {
            header("Content-Type: text/html; charset=utf-8", true, 500);
            echo "<tr><td colspan='2' class='text-center text-danger'>Erro ao carregar formas de pagamento.</td></tr>";
        }
        exit;
    }
}



/* ============================ CADASTRAR PAGAMENTO ============================ */
try {
    // Se não for POST, ignora
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        redirecWith("../paginas_logista/frete_pagamento_logista.html", [
            "erro_pagamento" => "Método inválido."
        ]);
    }

    // Lê dados
    $nome = trim($_POST["nome"] ?? '');

    // Validação
    $erros = [];
    if ($nome === '') {
        $erros[] = "Informe o nome da forma de pagamento.";
    }

    if (!empty($erros)) {
        redirecWith("../paginas_logista/frete_pagamento_logista.html", [
            "erro_pagamento" => implode(" | ", $erros)
        ]);
    }

    // Inserir no banco
    $sql = "INSERT INTO Formas_pagamento (nome) VALUES (:n)";
    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute([':n' => $nome]);

    if ($ok) {
        redirecWith("../paginas_logista/frete_pagamento_logista.html", [
            "cadastro_pagamento" => "ok"
        ]);
    } else {
        redirecWith("../paginas_logista/frete_pagamento_logista.html", [
            "erro_pagamento" => "Erro ao cadastrar a forma de pagamento."
        ]);
    }

} catch (Throwable $e) {
    redirecWith("../paginas_logista/frete_pagamento_logista.html", [
        "erro_pagamento" => "Erro no banco de dados: " . $e->getMessage()
    ]);
}
?>
