// função de listar formas de pagamento em tabela
function listarFormasPagamento(tabelaPG) {
  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById(tabelaPG);
    const url   = '../PHP/cadastro_formas_pagamento.php?listar=1&format=json';

    const esc = s => (s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));

    const row = f => `
      <tr>
        <td>${Number(f.idFormas_pagamento) || ''}</td>
        <td>${esc(f.nome || '-')}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-warning" data-id="${f.idFormas_pagamento}">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-danger" data-id="${f.idFormas_pagamento}">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </td>
      </tr>`;

    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao listar formas de pagamento');
        const arr = d.Formas_pagamento || d.formas || [];
        tbody.innerHTML = arr.length
          ? arr.map(row).join('')
          : `<tr><td colspan="3" class="text-center text-muted">Nenhuma forma de pagamento cadastrada.</td></tr>`;
      })
      .catch(err => {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Falha ao carregar: ${esc(err.message)}</td></tr>`;
      });
  });
}



// função de listar fretes em tabela
function listarFretes(tabelaFt) {
  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById(tabelaFt);
    const url   = '../PHP/cadastro_frete.php?listar=1&format=json';

    const esc = s => (s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));

    const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    const row = f => `
      <tr>
        <td>${Number(f.idFretes) || ''}</td>
        <td>${esc(f.bairro || '-')}</td>
        <td>${esc(f.trasportadora || '-')}</td>
        <td class="text-end">${moeda.format(parseFloat(f.valor ?? 0))}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-warning" data-id="${f.idFretes}">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-danger" data-id="${f.idFretes}">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </td>
      </tr>`;

    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao listar fretes');
        const fretes = d.fretes || [];
        tbody.innerHTML = fretes.length
          ? fretes.map(row).join('')
          : `<tr><td colspan="5" class="text-center text-muted">Nenhum frete cadastrado.</td></tr>`;
      })
      .catch(err => {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Falha ao carregar: ${esc(err.message)}</td></tr>`;
      });
  });
}


// Chama as funções para listar os dados nas tabelas correspondentes
listarFormasPagamento("tbPagamentos");
listarFretes("tbFretes");
