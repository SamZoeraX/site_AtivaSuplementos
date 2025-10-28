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
