// ============================ LISTAR FORMAS DE PAGAMENTO ============================ //
function listarPagamentos(tbpag) {
  const run = async () => {
    const tbody = document.getElementById(tbpag);
    if (!tbody) {
      console.warn(`listarPagamentos: tbody "${tbpag}" não encontrado`);
      return;
    }

    const url = '../PHP/cadastro_formas_pagamento.php?listar=1&format=json';
    let byId = new Map();

    const esc = s => (s == null ? '' : String(s))
      .replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));

    const rowHtml = f => {
      const id = Number(f.id) || 0;
      const nome = esc(f.nome || '-');
      byId.set(String(id), f);
      return `
        <tr data-id="${id}">
          <td>${id}</td>
          <td>${nome}</td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-warning btn-edit" data-id="${id}">Selecionar</button>
          </td>
        </tr>`;
    };

    try {
      const r = await fetch(url, { cache: 'no-store' });

      const ct = r.headers.get('content-type') || '';
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(text || `HTTP ${r.status}`);
      }
      if (!ct.includes('application/json')) {
        const text = await r.text().catch(() => '');
        throw new Error('Resposta inesperada do servidor (esperado JSON). Conteúdo: ' + text.slice(0, 500));
      }

      const d = await r.json();
      if (!d || d.ok !== true || !Array.isArray(d.pagamentos)) {
        throw new Error(d && d.error ? d.error : 'Formato de resposta inválido.');
      }

      const arr = d.pagamentos;
      tbody.innerHTML = arr.length ? arr.map(rowHtml).join('') :
        `<tr><td colspan="3" class="text-center text-muted">Nenhuma forma de pagamento cadastrada.</td></tr>`;

      // Listener (remoção para evitar duplicação)
      tbody.removeEventListener('click', tbody._pagListener);
      const listener = ev => {
        const btn = ev.target.closest('button');
        if (!btn || !btn.classList.contains('btn-edit')) return;

        const id = btn.getAttribute('data-id') || btn.closest('tr')?.getAttribute('data-id');
        if (!id) {
          alert('ID não encontrado.');
          return;
        }
        const pag = byId.get(String(id));
        if (!pag) {
          alert('Dados não encontrados.');
          console.error('byId keys:', Array.from(byId.keys()));
          return;
        }
        preencherFormPagamento(pag);
      };
      tbody.addEventListener('click', listener);
      tbody._pagListener = listener;

    } catch (err) {
      console.error('listarPagamentos error:', err);
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Falha ao carregar: ${esc(err.message)}</td></tr>`;
    }
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', run, { once: true });
  else
    run();
}


// ============================ PREENCHER FORMULÁRIO ============================ //
function preencherFormPagamento(pag) {
  const form = document.getElementById('formPagamento') || document.querySelector('form');
  if (!form) {
    console.warn('preencherFormPagamento: formulário não encontrado');
    return;
  }

  const acaoInput = document.getElementById('acao') || form.querySelector('input[name="acao"]');
  const idInput   = document.getElementById('idPagamento') || form.querySelector('input[name="id"]');
  const inNome    = form.querySelector('input[name="nome"]');

  if (inNome) inNome.value = pag.nome ?? '';
  if (idInput) idInput.value = pag.id ?? '';
  if (acaoInput) acaoInput.value = 'atualizar';

  const btnCadastrar = document.getElementById('btnCadastrar');
  const btnCancelar = document.getElementById('btnCancelarEdicao');
  if (btnCadastrar) {
    btnCadastrar.textContent = 'Salvar alterações';
    btnCadastrar.classList.remove('btn-primary');
    btnCadastrar.classList.add('btn-success');
  }
  if (btnCancelar) btnCancelar.classList.remove('d-none');

  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ============================ BOTÃO "EDITAR" -> UPDATE ============================ //
document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('formPagamento') || document.querySelector('form');
  const btnEditar = document.getElementById('btnEditar');
  const acaoInput = document.getElementById('acao')      || form.querySelector('input[name="acao"]');
  const idInput   = document.getElementById('idPagamento')   || form.querySelector('input[name="id"]');

  if (!form || !btnEditar) return;

  btnEditar.addEventListener('click', () => {
    if (!idInput.value) {
      alert('Selecione uma forma de pagamento na tabela antes de editar.');
      return;
    }
    acaoInput.value = 'atualizar';
    form.submit();
  });
});


// ============================ BOTÃO "EXCLUIR" -> DELETE ============================ //
document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('formPagamento') || document.querySelector('form');
  const btnExcluir   = document.getElementById('btnExcluir');
  const idInput      = document.getElementById('idPagamento')   || form.querySelector('input[name="id"]');
  const btnCadastrar = document.getElementById('btnCadastrar');
  const acaoInput    = document.getElementById('acao')          || form.querySelector('input[name="acao"]');

  if (!form || !btnExcluir) return;

  btnExcluir.addEventListener('click', async () => {
    const id = idInput.value.trim();
    if (!id) {
      alert('Selecione uma forma de pagamento para excluir.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta forma de pagamento?')) return;

    try {
      const fd = new FormData();
      fd.append('acao', 'excluir');
      fd.append('id', id);

      const r = await fetch('../PHP/cadastro_formas_pagamento.php', {
        method: 'POST',
        body: fd,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await r.text();
        throw new Error('Resposta inesperada do servidor: ' + text.slice(0, 200));
      }

      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || 'Falha na exclusão');

      alert(d.msg || 'Forma de pagamento excluída com sucesso!');

      form.reset();
      idInput.value = '';
      acaoInput.value = '';

      if (btnCadastrar) {
        btnCadastrar.textContent = 'Cadastrar';
        btnCadastrar.classList.remove('btn-success');
        btnCadastrar.classList.add('btn-primary');
      }

      listarPagamentos('tbPagamentos');
    } catch (e) {
      alert('Erro ao excluir: ' + (e.message || e));
      console.error(e);
    }
  });
});



// listarFretes: busca JSON e popula a tabela <tbody id="tbFretes">
function listarFretes(tbfrete) {
  const run = async () => {
    const tbody = document.getElementById(tbfrete);
    if (!tbody) {
      console.warn(`listarFretes: tbody "${tbfrete}" não encontrado`);
      return;
    }

    const url = '../PHP/cadastro_frete.php?listar=1&format=json';
    let byId = new Map();

    const esc = s => (s == null ? '' : String(s))
      .replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));

    const rowHtml = f => {
      const id = Number(f.id) || 0;
      const bairro = esc(f.bairro || '-');
      const transp = esc(f.transportadora || '-');
      const valor = Number(f.valor || 0).toFixed(2).replace('.', ',');
      byId.set(String(id), f);
      return `
        <tr data-id="${id}">
          <td>${id}</td>
          <td>${bairro}</td>
          <td>${transp}</td>
          <td class="text-end">R$ ${valor}</td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-warning btn-edit" data-id="${id}">Selecionar</button>
          </td>
        </tr>`;
    };

    try {
      const r = await fetch(url, { cache: 'no-store' });

      // diagnóstico de conteúdo
      const ct = r.headers.get('content-type') || '';
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(text || `HTTP ${r.status}`);
      }
      if (!ct.includes('application/json')) {
        const text = await r.text().catch(() => '');
        throw new Error('Resposta inesperada do servidor (esperado JSON). Conteúdo: ' + text.slice(0, 500));
      }

      const d = await r.json();
      if (!d || d.ok !== true || !Array.isArray(d.fretes)) {
        throw new Error(d && d.error ? d.error : 'Formato de resposta inválido.');
      }

      const arr = d.fretes;
      tbody.innerHTML = arr.length ? arr.map(rowHtml).join('') :
        `<tr><td colspan="5" class="text-center text-muted">Nenhum frete cadastrado.</td></tr>`;

      // delegação de eventos: apenas uma vez (remove listener anterior para evitar duplicação)
      tbody.removeEventListener('click', tbody._fretesListener);
      const listener = (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        if (!btn.classList.contains('btn-edit')) return;

        const id = btn.getAttribute('data-id') || btn.closest('tr')?.getAttribute('data-id');
        if (!id) {
          alert('ID do frete não encontrado.');
          return;
        }
        const frete = byId.get(String(id));
        if (!frete) {
          alert('Dados do frete não encontrados.');
          console.error('byId keys:', Array.from(byId.keys()));
          return;
        }
        // chama a função que preenche o formulário
        preencherFormFrete(frete);
      };
      tbody.addEventListener('click', listener);
      // guarda referência para possível remoção futura
      tbody._fretesListener = listener;

    } catch (err) {
      console.error('listarFretes error:', err);
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Falha ao carregar: ${esc(err.message)}</td></tr>`;
    }
  };

  // Se DOM ainda carregando, aguarda; caso contrário executa agora.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}


// ============================ PREENCHER FORMULÁRIO ============================ //
function preencherFormFrete(frete) {
  const form = document.getElementById('formFrete') || document.querySelector('form');
  if (!form) {
    console.warn('preencherFormFrete: formulário não encontrado');
    return;
  }

  const acaoInput = document.getElementById('acao') || form.querySelector('input[name="acao"]');
  const idInput   = document.getElementById('idFrete') || form.querySelector('input[name="id"]');

  // Preenche campos do formulário
  const inBairro = form.querySelector('input[name="bairro"]');
  const inValor = form.querySelector('input[name="valor"]');
  const inTransp = form.querySelector('input[name="transportadora"]');

  if (inBairro) inBairro.value = frete.bairro ?? '';
  if (inValor) {
    // assegura formato numérico com ponto para submissão
    inValor.value = (typeof frete.valor === 'number') ? frete.valor : (frete.valor ?? '');
  }
  if (inTransp) inTransp.value = frete.transportadora ?? '';

  // Corrige ID e ação (use o campo 'id' vindo do JSON)
  if (idInput) idInput.value = frete.id ?? '';
  if (acaoInput) acaoInput.value = 'atualizar';

  // Ajusta botão principal
  const btnCadastrar = document.getElementById('btnCadastrar');
  const btnCancelar = document.getElementById('btnCancelarEdicao');
  if (btnCadastrar) {
    btnCadastrar.textContent = 'Salvar alterações';
    btnCadastrar.classList.remove('btn-primary');
    btnCadastrar.classList.add('btn-success');
  }
  if (btnCancelar) {
    btnCancelar.classList.remove('d-none');
  }

  // Rola até o formulário
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}



// ============================ BOTÃO "EDITAR" -> UPDATE ============================ //
document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('formFrete') || document.querySelector('form');
  const btnEditar = document.getElementById('btnEditar');
  const acaoInput = document.getElementById('acao')      || form.querySelector('input[name="acao"]');
  const idInput   = document.getElementById('idFrete')   || form.querySelector('input[name="id"]');

  if (!form || !btnEditar) return;

  btnEditar.addEventListener('click', () => {
    if (!idInput.value) {
      alert('Selecione um frete na tabela antes de editar.');
      return;
    }
    acaoInput.value = 'atualizar';
    form.submit(); // PHP faz o UPDATE
  });
});


// ============================ BOTÃO "EXCLUIR" -> DELETE ============================ //
document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('formFrete') || document.querySelector('form');
  const btnExcluir   = document.getElementById('btnExcluir');
  const idInput      = document.getElementById('idFrete')   || form.querySelector('input[name="id"]');
  const btnCadastrar = document.getElementById('btnCadastrar');
  const acaoInput    = document.getElementById('acao')      || form.querySelector('input[name="acao"]');

  if (!form || !btnExcluir) return;

  btnExcluir.addEventListener('click', async () => {
    const id = idInput.value.trim();
    if (!id) {
      alert('Selecione um frete na tabela para excluir.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este frete?')) return;

    try {
      const fd = new FormData();
      fd.append('acao', 'excluir');
      fd.append('id', id);

      const r = await fetch('../PHP/cadastro_frete.php', {
        method: 'POST',
        body: fd,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await r.text();
        throw new Error('Resposta inesperada do servidor: ' + text.slice(0, 200));
      }

      const d = await r.json();
      if (!r.ok || !d.ok) {
        throw new Error(d.error || 'Falha na exclusão');
      }

      alert(d.msg || 'Frete excluído com sucesso!');

      // Resetar formulário
      form.reset();
      idInput.value = '';
      acaoInput.value = '';

      if (btnCadastrar) {
        btnCadastrar.textContent = 'Cadastrar';
        btnCadastrar.classList.remove('btn-success');
        btnCadastrar.classList.add('btn-primary');
      }

      // Atualizar tabela
 listarFretes("tbFretes");

    } catch (e) {
      alert('Erro ao excluir: ' + (e.message || e));
      console.error(e);
    }
  });
});


// Chama as funções para listar os dados nas tabelas correspondentes
listarPagamentos("tbPagamentos");
listarFretes("tbFretes");
