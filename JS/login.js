document.addEventListener('DOMContentLoaded', () => {
  const form  = document.getElementById('form-login');
  const emailEl = document.getElementById('email');
  const senEl = document.getElementById('senha');

  const showMsg = (msg) => {
    alert(msg); // pode trocar por toast Bootstrap, se quiser
  };

  // Evento de envio do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtém e valida o email antes de enviar
    const email  = (emailEl.value || '').trim();
    const senha  = (senEl.value || '').trim();

    if (!email || !senha) {
      showMsg('Preencha email e senha.');
      return;
    }

    try {
      const resp = await fetch('../PHP/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      // captura a resposta do php
      const data = await resp.json();

      if (data.ok) {
        window.location.href = data.redirect; // Redireciona conforme o tipo de usuário
      } else {
        showMsg(data.msg || 'Credenciais inválidas.');
      }
    } catch (err) {
      showMsg('Erro de conexão com o servidor.');
    }
  });
});

