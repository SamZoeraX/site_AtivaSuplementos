// === LISTAR CATEGORIAS (para selects) ===
async function listarcategorias(nomeid) {
  const sel = document.querySelector(nomeid);
  try {
    const r = await fetch("../PHP/cadastro_categorias.php?listar=1");
    if (!r.ok) throw new Error("Falha ao listar categorias!");
    sel.innerHTML = await r.text();
  } catch (e) {
    console.error(e);
    sel.innerHTML = "<option disabled>Erro ao carregar</option>";
  }
}


// === LISTAR MARCAS (para selects) ===
async function listamarcasselec(nomeid) {
  const sel = document.querySelector(nomeid);
  try {
    const r = await fetch("../PHP/cadastro_marcas.php?listar=1");
    if (!r.ok) throw new Error("Falha ao listar marcas!");

    const dados = await r.json();
    if (!dados.ok || !Array.isArray(dados.marcas)) throw new Error("Formato inválido!");

    sel.innerHTML = "<option value=''>Selecione uma marca</option>";
    dados.marcas.forEach(marca => {
      const opt = document.createElement("option");
      opt.value = marca.idMarcas;
      opt.textContent = marca.nome;
      sel.appendChild(opt);
    });

  } catch (e) {
    console.error("Erro ao carregar marcas:", e);
    sel.innerHTML = "<option disabled>Erro ao carregar marcas</option>";
  }
}


// === LISTAR MARCAS (em tabela com imagem) ===
function listarMarcas(nometabelamarcas) {
  const tbody = document.querySelector(nometabelamarcas);
  if (!tbody) return console.error("Elemento da tabela não encontrado:", nometabelamarcas);

  const url = "../PHP/cadastro_marcas.php?listar=1";

  // util 1: escapa caracteres HTML
  const esc = s => (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // util 2: placeholder quando não há imagem
  const ph = n => 'data:image/svg+xml;base64,' + btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
       <rect width="100%" height="100%" fill="#eee"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="sans-serif" font-size="14" fill="#999">
         ${(n || '?').slice(0, 2).toUpperCase()}
       </text>
     </svg>`
  );

  // util 3: gera linha da tabela
  const row = m => {
    const src = m.imagem && m.imagem.trim() !== ""
      ? `data:image/png;base64,${m.imagem}` // troque para image/jpeg se necessário
      : ph(m.nome);

    return `
      <tr>
        <td style="width:70px">
          <img src="${src}" alt="${esc(m.nome || 'Marca')}"
               style="width:60px;height:60px;object-fit:cover;border-radius:8px">
        </td>
        <td>${esc(m.nome || '-')}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-warning" data-id="${m.idMarcas}">Editar</button>
          <button class="btn btn-sm btn-danger" data-id="${m.idMarcas}">Excluir</button>
        </td>
      </tr>`;
  };

  // busca e preenche tabela
  fetch(url, { cache: 'no-store' })
    .then(r => r.json())
    .then(d => {
      if (!d.ok) throw new Error(d.error || 'Erro ao listar marcas.');

      tbody.innerHTML = d.marcas?.length
        ? d.marcas.map(row).join('')
        : `<tr><td colspan="3" class="text-center">Nenhuma marca cadastrada.</td></tr>`;
    })
    .catch(err => {
      console.error("Erro ao carregar marcas:", err);
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Falha ao carregar: ${esc(err.message)}</td></tr>`;
    });
}




// === CHAMADAS ===
listarMarcas("#tabelaMarcas");   // <tbody id="tabelaMarcas">
listamarcasselec("#pMarca");     // <select id="pMarca">
listarcategorias("#categlista"); // <select id="categlista">
listarcategorias("aProdutos");    // <select id="prodCat">


(function categoriasCRUD(){
  document.addEventListener('DOMContentLoaded', async () => {
    // pega o form de categorias pelo action (igual ao seu HTML)
    const form = document.querySelector('form[action="../php/cadastro_categorias.php"]');
    if (!form) return;

    const sel       = document.getElementById('pCategoria');               // seu select
    const inNome    = form.querySelector('input[name="nomecategoria"]');   // campo nome
    const inDesc    = form.querySelector('input[name="desconto"]');        // campo desconto

    // garante campos ocultos (acao, id)
    let inAcao = form.querySelector('input[name="acao"]');
    if (!inAcao) {
      inAcao = document.createElement('input');
      inAcao.type = 'hidden'; inAcao.name = 'acao'; inAcao.id = 'catAcao';
      form.prepend(inAcao);
    }
    let inId = form.querySelector('input[name="id"]');
    if (!inId) {
      inId = document.createElement('input');
      inId.type = 'hidden'; inId.name = 'id'; inId.id = 'catId';
      form.prepend(inId);
    }

    // pega os 3 botões na ordem em que estão no seu HTML
    const [btnCadastrar, btnEditar, btnExcluir] = form.querySelectorAll('button');

    // util: troca rótulo/estilo do botão principal quando entrar em modo edição
    function modoEdicaoOn(){
      if (!btnCadastrar) return;
      btnCadastrar.textContent = 'Salvar alterações';
      btnCadastrar.classList.remove('btn-primary');
      btnCadastrar.classList.add('btn-success');
    }
    function modoEdicaoOff(){
      if (!btnCadastrar) return;
      btnCadastrar.textContent = 'Cadastrar';
      btnCadastrar.classList.remove('btn-success');
      btnCadastrar.classList.add('btn-primary');
      inAcao.value = '';
      inId.value = '';
    }

    // carrega mapa JSON das categorias (seu PHP já suporta ?format=json)
    // OBS: sua listagem padrão não inclui "desconto". Se puder, ajuste o PHP para
    // SELECT idCategoriaProduto AS id, nome, desconto ... quando format=json.
    let byId = new Map();
    try {
      const r = await fetch('../php/cadastro_categorias.php?listar=1&format=json', { cache: 'no-store' });
      const d = await r.json();
      if (d?.ok && Array.isArray(d.categorias)) {
        d.categorias.forEach(c => byId.set(String(c.id), c));
      }
    } catch(e) {
      // se falhar, o preenchimento usará apenas o nome digitado
    }

    // quando selecionar no combo, preenche campos e entra em modo edição
    sel?.addEventListener('change', () => {
      const id = sel.value;
      if (!id) return;

      const c = byId.get(String(id));  // pode ser undefined se backend não trouxe JSON
      inId.value   = id;
      inNome.value = c?.nome ?? inNome.value;  // se não tiver JSON, não sobrescreve

      // preenche desconto se o backend mandar no JSON (campo "desconto")
      if (c && typeof c.desconto !== 'undefined' && c.desconto !== null) {
        // converte para vírgula se você quiser ver como 0,00
        inDesc.value = String(c.desconto).replace('.', ',');
      }

      inAcao.value = 'atualizar';
      modoEdicaoOn();
    });

    // botão EDITAR -> acao=atualizar
    btnEditar?.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!inId.value) {
        alert('Selecione uma categoria em "Categorias criadas" para editar.');
        return;
      }
      inAcao.value = 'atualizar';
      form.submit();
    });

    // botão EXCLUIR -> acao=excluir
    btnExcluir?.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!inId.value) {
        alert('Selecione uma categoria em "Categorias criadas" para excluir.');
        return;
      }
      if (!confirm('Deseja realmente excluir esta categoria?')) return;
      inAcao.value = 'excluir';
      form.submit();
    });

    // se o usuário voltar a cadastrar algo novo manualmente, saia do modo edição
    inNome?.addEventListener('input', () => { if (!inId.value) modoEdicaoOff(); });
    inDesc?.addEventListener('input', () => { if (!inId.value) modoEdicaoOff(); });
  });
})();