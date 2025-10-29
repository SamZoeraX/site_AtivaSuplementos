// ===================== CARROSSEL DE BANNERS (AJUSTADO PARA O PHP) ===================== //
(function () {
  const esc = s => (s ?? "").toString().replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]
  ));

  const placeholder = (w = 1200, h = 400, txt = "SEM IMAGEM") =>
    "data:image/svg+xml;base64," + btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <rect width="100%" height="100%" fill="#e9ecef"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="28" fill="#6c757d">${txt}</text>
      </svg>`
    );

  const hojeYMD = new Date().toISOString().slice(0, 10);
  const dentroDaValidade = d => (!d ? true : d >= hojeYMD);

  // Corrigido: PHP retorna imagem base64 pura
  function resolveImagemSrc(b) {
    if (!b || !b.imagem) return placeholder();

    // Se já vier em formato completo data:image
    if (b.imagem.startsWith("data:image")) {
      return b.imagem;
    }

    // Caso seja apenas o base64 cru (PHP base64_encode)
    return `data:image/jpeg;base64,${b.imagem}`;
  }

  function renderErro(container, titulo, detalhesHtml) {
    container.innerHTML = `
      <div class="carousel-item active">
        <div class="p-3">
          <div class="alert alert-danger mb-2"><strong>${esc(titulo)}</strong></div>
          <div class="alert alert-light border small" style="white-space:pre-wrap">${detalhesHtml}</div>
        </div>
      </div>`;
    const ind = document.getElementById("banners-indicators");
    if (ind) ind.innerHTML = "";
  }

  function renderCarrossel(container, indicators, banners) {
    if (!Array.isArray(banners) || !banners.length) {
      renderErro(container, "Nenhum banner disponível.", "O servidor respondeu com sucesso, porém a lista veio vazia.");
      return;
    }

    const itemsHtml = banners.map((b, i) => {
      const active = i === 0 ? "active" : "";
      const src = resolveImagemSrc(b);
      const desc = esc(b.descricao ?? "Banner");
      const link = b.link ? esc(b.link) : null;

      const imgTag = `<img src="${src}" class="d-block w-100" alt="${desc}" loading="lazy" style="object-fit:cover; height:400px;">`;
      const wrapped = link
        ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${imgTag}</a>`
        : imgTag;

      return `<div class="carousel-item ${active}">${wrapped}</div>`;
    }).join("");

    const indicatorsHtml = banners.map((_, i) =>
      `<button type="button" data-bs-target="#carouselBanners" data-bs-slide-to="${i}" class="${i === 0 ? "active" : ""}" aria-label="Slide ${i + 1}"></button>`
    ).join("");

    container.innerHTML = itemsHtml;
    if (indicators) indicators.innerHTML = indicatorsHtml;
  }

  async function listarBannersCarrossel({
    containerSelector = "#banners-home",
    indicatorsSelector = "#banners-indicators",
    urlCandidates = [
      "../PHP/banners.php?listar=1",   // se o HTML estiver em paginas_cliente/
      "PHP/banners.php?listar=1",      // se o HTML estiver na raiz
      "../../PHP/banners.php?listar=1" // se o HTML estiver mais fundo
    ],
    apenasValidos = true
  } = {}) {
    const container = document.querySelector(containerSelector);
    const indicators = document.querySelector(indicatorsSelector);
    if (!container) return;

    container.innerHTML = `<div class="carousel-item active"><div class="p-3 text-muted">Carregando banners…</div></div>`;
    if (indicators) indicators.innerHTML = "";

    let resposta = null;

    // Tenta múltiplos caminhos (dependendo da estrutura do site)
    for (const url of urlCandidates) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        if (data.ok && Array.isArray(data.banners)) {
          resposta = data.banners;
          break;
        }
      } catch (err) {
        // tenta o próximo caminho
      }
    }

    if (!resposta) {
      renderErro(container, "Não foi possível carregar os banners.",
        "Verifique se o caminho para o PHP está correto (banners.php?listar=1).");
      return;
    }

    // Filtra banners válidos
    let lista = resposta.slice();
    if (apenasValidos) lista = lista.filter(b => dentroDaValidade(b.data_validade));

    renderCarrossel(container, indicators, lista);
  }

  document.addEventListener("DOMContentLoaded", () => {
    listarBannersCarrossel({
      urlCandidates: ["../PHP/banners.php?listar=1", "PHP/banners.php?listar=1", "../../PHP/banners.php?listar=1"],
      apenasValidos: true
    });
  });
})();



// ====== CATEGORIAS (chips) + PRODUTOS (cards) com filtro no BACKEND ====== //
// Página: index.html na raiz | Endpoints: PHP/cadastro_categorias.php, PHP/cadastro_produtos.php
(function () {
  // --------- Helpers ---------
  const $ = sel => document.querySelector(sel);
  const esc = s => (s ?? "").toString().replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c] || c)
  );
  const moneyBR = v => isFinite(v) ? v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) : "";

  const placeholder = (w = 600, h = 400, txt = "SEM IMAGEM") =>
    "data:image/svg+xml;base64," + btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <rect width="100%" height="100%" fill="#f2f2f2"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="18" fill="#6c757d">${txt}</text>
      </svg>`
    );

  function resolveImg(prod) {
    if (prod?.imagem && String(prod.imagem).trim().startsWith("data:")) return String(prod.imagem).trim();
    if (prod?.imagem && (/^(https?:)?\/\//i.test(prod.imagem) || String(prod.imagem).startsWith("/"))) return String(prod.imagem);
    if (prod?.imagem && /^[A-Za-z0-9+/=\s]+$/.test(String(prod.imagem).replace(/\s+/g, ""))) {
      return `data:image/jpeg;base64,${prod.imagem}`; // backend manda base64 cru
    }
    if (prod?.img_url) return String(prod.img_url);
    if (prod?.imagem_base64) return `data:image/jpeg;base64,${prod.imagem_base64}`;
    return placeholder();
  }

  function produtoCard(prod) {
    const src  = resolveImg(prod);
    const nome = esc(prod?.nome ?? "Produto");
    const alt  = esc(prod?.texto_alternativo ?? nome);
    const marca= esc(prod?.marca ?? "");
    const cat  = esc(prod?.categoria ?? "");

    const temPromo   = prod?.preco_promocional && Number(prod.preco_promocional) > 0;
    const precoNorm  = moneyBR(Number(prod?.preco));
    const precoPromo = temPromo ? moneyBR(Number(prod.preco_promocional)) : null;

    return `
      <div class="col">
        <div class="card h-100 shadow-sm">
          <img src="${src}" class="card-img-top" alt="${alt}" loading="lazy" style="object-fit:cover; aspect-ratio: 4/3;">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-1 text-truncate" title="${nome}">${nome}</h6>
            <div class="text-muted small mb-2">${marca ? `Marca: ${marca}` : ""} ${cat ? `• ${cat}` : ""}</div>
            <div class="mb-2">
              ${
                temPromo
                  ? `<div class="fw-bold">${precoPromo} <span class="text-decoration-line-through text-muted ms-2">${precoNorm}</span></div>`
                  : `<div class="fw-bold">${precoNorm}</div>`
              }
            </div>
            <div class="mt-auto d-grid gap-2">
              <button class="btn btn-primary btn-sm" data-id="${prod.idProdutos}">Adicionar ao carrinho</button>
              <button class="btn btn-outline-secondary btn-sm" data-id="${prod.idProdutos}">Detalhes</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  async function fetchJSON(url) {
    const r = await fetch(url, { headers: { "Accept": "application/json" }, credentials: "same-origin" });
    const raw = await r.text();
    let data = null; try { data = JSON.parse(raw); } catch {}
    if (!r.ok || !data) throw new Error(`Falha ${r.status} em ${url} • ${raw.slice(0,140)}`);
    return data;
  }

  // --------- Endpoints fixos (index.html na raiz) ---------
  const URLS = {
    categoriasJson: "PHP/cadastro_categorias.php?listar=1&format=json",
    categoriasOpt : "PHP/cadastro_categorias.php?listar=1",
    produtosAll   : "PHP/cadastro_produtos.php?listar=1",
    produtosByCat : (id) => `PHP/cadastro_produtos.php?listar_por_categoria=1&idCategoria=${encodeURIComponent(id)}`
  };

  // --------- Estado ---------
  const state = {
    categorias: [],     // [{id, nome}]
    catMap: new Map(),  // id -> nome
    activeCat: "",      // "" = todas
    produtos: []        // último payload exibido (para re-render somente)
  };

  // --------- UI: chips ---------
  function buildChip({ id, nome }) {
    const isActive = String(id) === String(state.activeCat);
    const base = "btn btn-sm rounded-pill px-3";
    const cls  = isActive ? `btn-primary ${base}` : `btn-outline-primary ${base}`;
    return `<button type="button" class="${cls}" data-cat="${id}" title="${esc(nome)}">${esc(nome)}</button>`;
  }

  function renderChips() {
    const wrap = $("#cats-chips");
    if (!wrap) return;
    const chips = [
      `<button type="button" class="${state.activeCat==="" ? "btn btn-primary" : "btn btn-outline-primary"} btn-sm rounded-pill px-3" data-cat="">Todas as categorias</button>`
    ].concat(state.categorias.map(buildChip));
    wrap.innerHTML = chips.join("");
  }

  function setActiveChip(catId) {
    state.activeCat = String(catId ?? "");
    renderChips();
    const sel = $("#filtro-categoria");
    if (sel) sel.value = state.activeCat;
  }

  // --------- Carregamento de categorias ---------
  async function carregarCategorias() {
    const sel = $("#filtro-categoria");
    try {
      const data = await fetchJSON(URLS.categoriasJson);
      const lista = Array.isArray(data?.categorias) ? data.categorias : (Array.isArray(data) ? data : []);
      state.categorias = lista.map(c => ({ id: Number(c.id), nome: String(c.nome) }));
      state.catMap = new Map(state.categorias.map(c => [c.id, c.nome]));
      if (sel) {
        sel.innerHTML = [`<option value="">Todas as categorias</option>`]
          .concat(state.categorias.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`)).join("");
      }
      renderChips();
    } catch {
      // fallback <option>
      try {
        const r = await fetch(URLS.categoriasOpt, { credentials: "same-origin" });
        const html = await r.text();
        if (r.ok && /<option/i.test(html) && sel) {
          sel.innerHTML = `<option value="">Todas as categorias</option>` + html;
          state.catMap.clear();
          [...sel.querySelectorAll("option")].forEach(op => {
            if (op.value) state.catMap.set(Number(op.value), op.textContent.trim());
          });
          state.categorias = [...state.catMap.entries()].map(([id, nome]) => ({ id, nome }));
        }
        renderChips();
      } catch (e2) {
        console.error("Erro carregando categorias:", e2);
        renderChips();
      }
    }
  }

  // --------- Carregamento de produtos ---------
  async function carregarProdutosAll() {
    const status = $("#produtos-status");
    const grid   = $("#produtos-grid");
    status && (status.textContent = "Carregando produtos…");
    grid && (grid.innerHTML = "");

    try {
      const data = await fetchJSON(URLS.produtosAll);
      const lista = Array.isArray(data?.produtos) ? data.produtos : (Array.isArray(data) ? data : []);
      state.produtos = lista;
      status && (status.textContent = "");
      renderProdutos(state.produtos);
    } catch (e) {
      console.error("Erro carregando produtos (todas):", e);
      status && (status.innerHTML = `<div class="alert alert-danger">Não foi possível carregar os produtos.</div>`);
    }
  }

  async function carregarProdutosPorCategoria(idCat) {
    const status = $("#produtos-status");
    const grid   = $("#produtos-grid");
    status && (status.textContent = "Carregando produtos…");
    grid && (grid.innerHTML = "");

    // Se vazio, cai para “todas”
    if (!idCat) return carregarProdutosAll();

    try {
      const data = await fetchJSON(URLS.produtosByCat(idCat));
      const lista = Array.isArray(data?.produtos) ? data.produtos : (Array.isArray(data) ? data : []);
      state.produtos = lista;
      status && (status.textContent = "");
      renderProdutos(state.produtos);
    } catch (e) {
      console.error("Erro carregando produtos por categoria:", e);
      status && (status.innerHTML = `<div class="alert alert-danger">Não foi possível carregar os produtos desta categoria.</div>`);
    }
  }

  // --------- Renderização ---------
  function renderProdutos(lista) {
    const grid   = $("#produtos-grid");
    const status = $("#produtos-status");
    if (!grid) return;

    if (!lista || !lista.length) {
      grid.innerHTML = "";
      status && (status.innerHTML = `<div class="alert alert-warning mt-3 mb-0">Nenhum produto encontrado.</div>`);
      return;
    }

    status && (status.textContent = "");
    grid.innerHTML = lista.map(produtoCard).join("");
  }

  // --------- Eventos ---------
  function wireEvents() {
    // chips
    $("#cats-chips")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      const catId = btn.getAttribute("data-cat") ?? "";
      setActiveChip(catId);
      carregarProdutosPorCategoria(catId); // usa a NOVA rota do PHP
    });

    // select (fallback)
    $("#filtro-categoria")?.addEventListener("change", (e) => {
      const catId = e.target.value ?? "";
      setActiveChip(catId);
      carregarProdutosPorCategoria(catId); // usa a NOVA rota do PHP
    });
  }

  // --------- Boot ---------
  document.addEventListener("DOMContentLoaded", async () => {
    state.activeCat = "";              // todas
    await carregarCategorias();        // popula chips/select
    await carregarProdutosAll();       // carrega produtos iniciais
    wireEvents();
  });
})();
