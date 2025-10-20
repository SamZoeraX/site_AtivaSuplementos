function listarcategorias(nomeid){
(async () => {
    // selecionando o elemento html da tela de cadastro de produtos
    const sel = document.querySelector(nomeid);
    try {
        // criando a váriavel que guardar os dados vindo do php, que estão no metodo de listar
        const r = await fetch("../PHP/cadastro_categorias.php?listar=1");
        // se o retorno do php vier false, significa que não foi possivel listar os dados
        if (!r.ok) throw new Error("Falha ao listar categorias!");
        /* se vier dados do php, ele joga as 
        informações dentro do campo html em formato de texto
        innerHTML- inserir dados em elementos html
        */
        sel.innerHTML = await r.text();
    } catch (e) {
        // se dê erro na listagem, aparece Erro ao carregar dentro do campo html
        sel.innerHTML = "<option disable>Erro ao carregar</option>"
    }
})();
}


// função de listar banners em tabela
function listarBanners(nometabelabanners) {
  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById(nometabelabanners);
    const url = '../PHP/banners.php?listar=1&format=json'; // backend que retorna JSON

    // --- util 1) esc(): escapa caracteres especiais
    const esc = s => (s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    // --- util 2) ph(): placeholder SVG se não tiver imagem
    const ph = n => 'data:image/svg+xml;base64,' + btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
         <rect width="100%" height="100%" fill="#eee"/>
         <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
               font-family="sans-serif" font-size="12" fill="#999">
           ${(n || '?').slice(0, 2).toUpperCase()}
         </text>
       </svg>`
    );

    // --- util 3) row(): gera o <tr> para cada banner
    const row = b => `
      <tr>
        <td>
          <img
            src="${b.imagem || ph(b.descricao)}"
            alt="${esc(b.descricao || 'Banner')}"
            style="width:80px;height:80px;object-fit:cover;border-radius:8px">
        </td>
        <td>${esc(b.descricao || '-')}</td>
        <td>${esc(b.categoria || '-')}</td>
        <td>${esc(b.data_validade || '-')}</td>
        <td><a href="${esc(b.link || '#')}" target="_blank">${esc(b.link || '')}</a></td>
        <td class="text-end">
          <button class="btn btn-sm btn-warning" data-id="${b.id}">Editar</button>
          <button class="btn btn-sm btn-danger"  data-id="${b.id}">Excluir</button>
        </td>
      </tr>`;

    // --- Requisição ao backend
    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao listar');
        tbody.innerHTML = d.banners?.length
          ? d.banners.map(row).join('')
          : `<tr><td colspan="6" class="text-center text-muted">Nenhum banner cadastrado.</td></tr>`;
      })
      .catch(err => {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Falha ao carregar: ${esc(err.message)}</td></tr>`;
      });
  });
}

// --- Prévia da imagem no cadastro
document.addEventListener('DOMContentLoaded', () => {
  const bannerInput = document.getElementById('bannerInput');
  const bannerPreview = document.getElementById('bannerPreview');

  if (!bannerInput || !bannerPreview) return;

  bannerInput.addEventListener('change', () => {
    const file = bannerInput.files[0];

    if (!file) {
      bannerPreview.innerHTML = '<span class="text-muted">Prévia</span>';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      bannerPreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Prévia da imagem';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      bannerPreview.appendChild(img);
    };

    reader.readAsDataURL(file);
  });
});


function listarCupons(nometabelacupom) {
  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById(nometabelacupom);
    const url   = '../PHP/cupom.php?listar=1';

    // Escapa texto (evita injeção de HTML)
    const esc = s => (s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));

    // Converte data YYYY-MM-DD → DD/MM/YYYY
    const dtbr = iso => {
      if (!iso) return '-';
      const [y,m,d] = String(iso).split('-');
      return (y && m && d) ? `${d}/${m}/${y}` : '-';
    };

    // Monta a <tr> de cada cupom
    const row = c => `
      <tr>
        <td>${c.id}</td>
        <td>${esc(c.nome)}</td>
        <td>R$ ${parseFloat(c.valor).toFixed(2).replace('.', ',')}</td>
        <td>${dtbr(c.data_validade)}</td>
        <td>${c.quantidade}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-warning" data-id="${c.id}">Editar</button>
          <button class="btn btn-sm btn-danger"  data-id="${c.id}">Excluir</button>
        </td>
      </tr>`;

    // Busca os dados e preenche a tabela
    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao listar cupons');
        const arr = d.cupons || [];
        tbody.innerHTML = arr.length
          ? arr.map(row).join('')
          : `<tr><td colspan="6" class="text-center text-muted">Nenhum cupom cadastrado.</td></tr>`;
      })
      .catch(err => {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Falha ao carregar: ${esc(err.message)}</td></tr>`;
      });
  });
}




listarcategorias("#prodCat");
listarBanners("banners");
listarCupons("cupom");




