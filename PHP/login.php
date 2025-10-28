<?php
// PHP/login.php
session_start();
header('Content-Type: application/json; charset=utf-8');
// Conectando este arquivo ao banco de dados
require_once __DIR__ . "/conexao.php";

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$emailOrUser = isset($data['email']) ? trim($data['email']) : '';
$senha       = isset($data['senha']) ? (string)$data['senha'] : '';

if ($emailOrUser === '' || $senha === '') {
  echo json_encode(['ok' => false, 'msg' => 'Informe email e senha.']);
  exit;
}

// === 1. Tenta autenticar como Cliente ===
try {
  $sql = "SELECT idCliente, nome FROM Cliente WHERE email = :email AND senha = :senha LIMIT 1";
  $st  = $pdo->prepare($sql);
  $st->bindValue(':email', $emailOrUser);
  $st->bindValue(':senha', $senha);
  $st->execute();

  if ($cli = $st->fetch()) {
    $_SESSION['auth']      = true;
    $_SESSION['user_type'] = 'Cliente';
    $_SESSION['user_id']   = (int)$cli['idCliente'];
    $_SESSION['nome']      = $cli['nome'];
    echo json_encode(['ok' => true, 'redirect' => '../index.html']);
    exit;
  }
} catch (Throwable $e) {
  echo json_encode(['ok' => false, 'msg' => 'Erro ao verificar cliente.']);
  exit;
}

// === 2. Tenta autenticar como Empresa ===
try {
  $sql = "SELECT idEmpresa, nomefantasia FROM Empresa
          WHERE (usuario = :u OR cnpjecpf = :u) AND senha = :s LIMIT 1";
  $st  = $pdo->prepare($sql);
  $st->bindValue(':u', $emailOrUser);
  $st->bindValue(':s', $senha);
  $st->execute();

  if ($emp = $st->fetch()) {
    $_SESSION['auth']      = true;
    $_SESSION['user_type'] = 'empresa';
    $_SESSION['user_id']   = (int)$emp['idEmpresa'];
    $_SESSION['nome']      = $emp['nomefantasia'];
    echo json_encode(['ok' => true, 'redirect' => '../paginas_logista/home_lojista.html']);
    exit;
  }
} catch (Throwable $e) {
  echo json_encode(['ok' => false, 'msg' => 'Erro ao verificar empresa.']);
  exit;
}

// === 3. Falha geral ===
echo json_encode(['ok' => false, 'msg' => 'Credenciais inválidas.']);
?>