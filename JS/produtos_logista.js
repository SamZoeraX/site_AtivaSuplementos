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
listarcategorias("#prodCat");    // <select id="prodCat">
