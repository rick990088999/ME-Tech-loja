/* ME Tech — lógica da loja. Produtos: produtos.js | Cupons: cupons.js */
const WHATSAPP_NUMERO = "5511932385245"; // único lugar com o telefone (DDI+DDD+número)
const LIMITE_PEDIDO_GRANDE = 5;
const AVISO_GRANDE = "Pedidos com mais de 5 unidades exigem pagamento antecipado. Combine as condições com a ME Tech pelo WhatsApp.";
const $ = s => document.querySelector(s);
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = c => brl.format(c / 100);
const cents = p => Math.round(Number(p) * 100);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = s => String(s || "").trim().toLowerCase();
const plano = s => norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
const svg = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  lupa: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  cart: svg('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 002 1.6h7.6a2 2 0 002-1.5L21 8H6"/>'),
  tema: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>'),
  cfg: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>')
};
const lista = (typeof produtos !== "undefined" && Array.isArray(produtos)) ? produtos : [];
const cupList = (typeof cupons !== "undefined" && Array.isArray(cupons)) ? cupons : [];
let prefs = load("metech_prefs", null) || {};
let cart = load("metech_cart", []);
let cupomCod = load("metech_cupom", "");
let busca = "", cat = "", nome = "", cupMsg = "";
const sel = { tema: prefs.tema || "escuro", dispositivo: prefs.dispositivo || (innerWidth < 700 ? "celular" : "computador") };
const achar = id => lista.find(p => String(p.id) === String(id));
const persist = () => { save("metech_cart", cart); atualizaBarra(); };

/* ---------- Preferências e transição ---------- */
function setTema(t) { document.documentElement.dataset.theme = t; }
function marca() {
  document.querySelectorAll("[data-t]").forEach(b => b.classList.toggle("on", b.dataset.t === sel.tema));
  document.querySelectorAll("[data-d]").forEach(b => b.classList.toggle("on", b.dataset.d === sel.dispositivo));
}
document.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { sel.tema = b.dataset.t; setTema(sel.tema); marca(); });
document.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { sel.dispositivo = b.dataset.d; marca(); });
$("#seguir").onclick = () => {
  prefs = { ...sel }; save("metech_prefs", prefs);
  document.documentElement.dataset.dispositivo = sel.dispositivo;
  const s = $("#splash"); s.classList.remove("out"); s.classList.add("go");
  setTimeout(() => document.documentElement.classList.remove("first"), 700);
  setTimeout(() => { s.classList.add("out"); setTimeout(() => s.classList.remove("go", "out"), 300); }, 1000);
};
$("#tema").onclick = () => {
  sel.tema = document.documentElement.dataset.theme === "escuro" ? "claro" : "escuro";
  setTema(sel.tema); prefs = { ...prefs, tema: sel.tema, dispositivo: prefs.dispositivo || sel.dispositivo }; save("metech_prefs", prefs);
};
$("#cfg").onclick = () => { marca(); document.documentElement.classList.add("first"); };
document.querySelectorAll("[data-ico]").forEach(e => e.insertAdjacentHTML("afterbegin", I[e.dataset.ico]));
$("#wppRodape").href = `https://wa.me/${WHATSAPP_NUMERO}`;

/* ---------- Catálogo ---------- */
const img = p => `<div class="ph">ME Tech</div>${p.imagem ? `<img src="${esc(p.imagem)}" alt="${esc(p.nome)}" loading="lazy" onerror="this.remove()">` : ""}`;
function card(p, i = 0) {
  const ok = p.disponivel === true;
  return `<article class="card ${ok ? "" : "off"}" data-ver="${esc(p.id)}" tabindex="0" role="button" aria-label="Ver ${esc(p.nome)}" style="animation-delay:${Math.min(i, 8) * 40}ms"><div class="img">${img(p)}${ok ? "" : '<span class="tag no">Esgotado</span>'}</div>
<div class="info"><h3>${esc(p.nome)}</h3><strong class="price">${fmt(cents(p.preco))}</strong></div></article>`;
}
function renderCats() {
  const cs = [...new Set(lista.map(p => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  $("#cats").innerHTML = `<button class="chip ${cat ? "" : "on"}" data-c="">Todos</button>` + cs.map(c => `<button class="chip ${cat === c ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
}
function renderLoja() {
  renderCats();
  const q = plano(busca);
  const f = lista.filter(p => (!cat || p.categoria === cat) && (!q || plano([p.nome, p.categoria, p.descricaoSimples, p.descricaoDetalhada, ...(p.caracteristicas || [])].join(" ")).includes(q)));
  $("#grid").innerHTML = f.map((p, i) => card(p, i)).join("");
  $("#catTit").textContent = cat || (q ? "Resultados da busca" : "Catálogo");
  const m = $("#msgVazio");
  m.hidden = f.length > 0;
  m.textContent = lista.length ? "Nenhum produto encontrado." : "O catálogo está sendo preparado. Volte em breve!";
  // Novidades: só aparece com mais de 4 produtos (senão repetiria o catálogo todo) e sem filtros ativos.
  const nov = [...lista].filter(p => p.dataAdicao).sort((a, b) => String(b.dataAdicao).localeCompare(String(a.dataAdicao))).slice(0, 4);
  $("#novSec").hidden = !(lista.length > 4 && nov.length && !cat && !q);
  $("#novGrid").innerHTML = nov.map((p, i) => card(p, i)).join("");
  // "Mais vendidos" não existe: não há fonte confiável de vendas neste projeto.
}
$("#busca").oninput = e => { busca = e.target.value; renderLoja(); };
$("#cats").onclick = e => { const b = e.target.closest("[data-c]"); if (b) { cat = b.dataset.c; renderLoja(); } };

/* ---------- Detalhes ---------- */
let detQ = 1;
function abrirDetalhes(id) {
  const p = achar(id); if (!p) return; const ok = p.disponivel === true; detQ = 1;
  const car = Array.isArray(p.caracteristicas) && p.caracteristicas.length ? `<ul>${p.caracteristicas.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : "";
  $("#mcont").innerHTML = `<div class="mgrid"><div class="img" style="border-radius:12px">${img(p)}<span class="tag ${ok ? "ok" : "no"}">${ok ? "Disponível" : "Esgotado"}</span></div>
<div><h2>${esc(p.nome)}</h2><p>${esc(p.descricaoDetalhada || p.descricaoSimples)}</p>${car}<strong class="price" style="font-size:1.5rem">${fmt(cents(p.preco))}</strong>
${ok ? "" : '<p class="mut">Esgotado — em breve de volta!</p>'}
<div class="qsel"><span>Quantidade</span><button data-qd="-1" aria-label="Diminuir">−</button><b id="dq">1</b><button data-qd="1" aria-label="Aumentar">+</button></div>
<button class="btn" style="width:100%" ${ok ? "data-add" : "data-pre"}="${esc(p.id)}">${ok ? "Adicionar ao carrinho" : "Encomendar antecipadamente"}</button></div></div>`;
  $("#modal").hidden = false; document.body.style.overflow = "hidden";
}
function fechar() { $("#modal").hidden = true; document.body.style.overflow = ""; }
$("#modal").onclick = e => { if (e.target.id === "modal" || e.target.closest("[data-fechar]")) fechar(); };
addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });

/* ---------- Carrinho ---------- */
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 1600); }
function addCart(id, pre, n = 1) {
  const p = achar(id); if (!p) return;
  const i = cart.find(x => String(x.id) === String(id));
  if (i) { i.qtd = Math.min(99, i.qtd + n); if (pre) i.pre = true; } else cart.push({ id: p.id, qtd: n, pre: !!pre });
  persist(); toast(pre ? "Encomenda antecipada adicionada" : "Adicionado ao carrinho");
  const ic = document.querySelector('a.ib[href="#carrinho"]'); ic.classList.remove("bump"); void ic.offsetWidth; ic.classList.add("bump");
}
function resolver() { // revalida o carrinho com o catálogo atual
  let ch = false;
  cart = cart.filter(i => { if (!achar(i.id)) { ch = true; return false; } return true; });
  cart.forEach(i => { i.qtd = Math.max(1, Math.min(99, parseInt(i.qtd) || 1)); if (achar(i.id).disponivel === true && i.pre) { i.pre = false; ch = true; } });
  if (ch) save("metech_cart", cart);
}
function cupomAtual() {
  const c = cupList.find(c => c.ativo === true && norm(c.codigo) === norm(cupomCod));
  return c && Number(c.percentual) > 0 && Number(c.percentual) <= 100 ? c : null;
}
function totais() {
  resolver();
  const linhas = cart.map(i => { const p = achar(i.id), u = cents(p.preco); return { i, p, u, sub: u * i.qtd }; });
  const sub = linhas.reduce((a, l) => a + l.sub, 0), cp = cupomAtual();
  const desc = cp ? Math.round(sub * Number(cp.percentual) / 100) : 0;
  return { linhas, sub, cp, desc, total: sub - desc, un: cart.reduce((a, i) => a + i.qtd, 0) };
}
function atualizaBarra() {
  const t = totais(), b = $("#bar"), bd = $("#badge");
  bd.hidden = !t.un; bd.textContent = t.un;
  $("#carRodape").textContent = t.un ? `Ver carrinho (${t.un})` : "Ver carrinho";
  b.hidden = !t.un || location.hash === "#carrinho";
  b.textContent = `${t.un} ${t.un === 1 ? "produto" : "produtos"} no carrinho · ${fmt(t.total)} · Finalizar pedido`;
}
function renderCarrinho() {
  const el = $("#carrinho"), t = totais();
  if (!cart.length) { el.innerHTML = `<div class="vazio"><p>Seu carrinho está vazio.</p><a class="btn" href="#">Ver produtos</a></div>`; return; }
  const pend = t.linhas.filter(l => !l.i.pre && l.p.disponivel !== true);
  const pendHtml = pend.map(l => `<div class="aviso"><b>${esc(l.p.nome)}</b> ficou esgotado. Deseja mantê-lo como encomenda antecipada?<br><button class="mini" data-keep="${esc(l.p.id)}">Manter como encomenda</button> <button class="mini" data-rm="${esc(l.p.id)}">Remover</button></div>`).join("");
  const linhas = t.linhas.map(l => `<div class="linha"><div><b>${esc(l.p.nome)}</b>${l.i.pre ? ' <span class="tag no" style="position:static">Encomenda antecipada</span>' : ""}<div class="mut">${fmt(l.u)} cada</div></div>
<div><b>${fmt(l.sub)}</b></div><div class="qty"><button data-q="${esc(l.p.id)}:-1" aria-label="Diminuir">−</button><span>${l.i.qtd}</span><button data-q="${esc(l.p.id)}:1" aria-label="Aumentar">+</button></div><button class="link" data-rm="${esc(l.p.id)}">Remover</button></div>`).join("");
  const cupHtml = t.cp ? `<div class="row"><span>Cupom <b>${esc(t.cp.codigo)}</b> aplicado</span><button class="link" data-semcupom>Remover cupom</button></div>`
    : `<div class="cup"><input id="cupIn" placeholder="Código do cupom" aria-label="Código do cupom"><button class="btn" data-cupom>Aplicar</button></div>`;
  el.innerHTML = `${pendHtml}${linhas}
<div class="box"><b>Cupom</b>${cupHtml}${cupMsg ? `<p class="err">${esc(cupMsg)}</p>` : ""}</div>
<div class="box"><div class="row"><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
${t.cp ? `<div class="row"><span>Desconto (${esc(t.cp.codigo)} — ${Number(t.cp.percentual)}%)</span><span>-${fmt(t.desc)}</span></div>` : ""}
<div class="row t"><span>Total</span><span>${fmt(t.total)}</span></div></div>
${t.un > LIMITE_PEDIDO_GRANDE ? `<div class="aviso">${AVISO_GRANDE}</div>` : ""}
<div class="box"><label for="nomeIn"><b>Seu nome</b></label><input id="nomeIn" value="${esc(nome)}" placeholder="Como podemos te chamar?" autocomplete="name"><p class="err" id="erro"></p></div>
<button class="btn" id="enviar" ${pend.length ? "disabled" : ""} style="width:100%;font-size:1.05rem">Enviar pedido pelo WhatsApp</button>
<p class="mut">Ao clicar, o WhatsApp abrirá com seu pedido pronto. Abrir o WhatsApp não confirma o pedido: ele só vale após a confirmação da ME Tech.</p>`;
}
function mensagem() {
  const t = totais(); let m = `Olá! Quero fazer um pedido na ME Tech.\n\nCliente: ${nome.trim()}\n\n`;
  t.linhas.forEach(l => {
    m += (l.i.qtd === 1 ? `1x ${l.p.nome} — ${fmt(l.u)}` : `${l.i.qtd}x ${l.p.nome} — ${fmt(l.u)} cada (subtotal ${fmt(l.sub)})`) + (l.i.pre ? " [ENCOMENDA ANTECIPADA]" : "") + "\n";
  });
  m += `\nSubtotal: ${fmt(t.sub)}\n`;
  if (t.cp) m += `Cupom: ${t.cp.codigo}\nDesconto: ${Number(t.cp.percentual)}% (-${fmt(t.desc)})\n`;
  m += `Total: ${fmt(t.total)}\n`;
  if (t.un > LIMITE_PEDIDO_GRANDE) m += `\n${AVISO_GRANDE}\n`;
  return m + "\nAguardo a confirmação do pedido!";
}
function enviar() {
  const t = totais(), erro = $("#erro");
  if (t.linhas.some(l => !l.i.pre && l.p.disponivel !== true)) { erro.textContent = "Resolva os produtos esgotados antes de enviar."; return; }
  if (!nome.trim()) { erro.textContent = "Informe seu nome para enviar o pedido."; $("#nomeIn").focus(); return; }
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem())}`;
  const w = window.open(url, "_blank"); if (w) w.opener = null; else location.href = url;
}
document.addEventListener("click", e => {
  const g = a => e.target.closest(`[${a}]`);
  let b;
  if ((b = g("data-add"))) { addCart(b.dataset.add, false, detQ); if (!$("#modal").hidden) fechar(); }
  else if ((b = g("data-pre"))) { addCart(b.dataset.pre, true, detQ); if (!$("#modal").hidden) fechar(); }
  else if ((b = g("data-qd"))) { detQ = Math.max(1, Math.min(99, detQ + Number(b.dataset.qd))); $("#dq").textContent = detQ; }
  else if ((b = g("data-ver"))) abrirDetalhes(b.dataset.ver);
  else if ((b = g("data-q"))) { const [id, d] = b.dataset.q.split(":"), i = cart.find(x => String(x.id) === id); if (i) { i.qtd = Math.max(1, Math.min(99, i.qtd + Number(d))); persist(); renderCarrinho(); } }
  else if ((b = g("data-rm"))) { cart = cart.filter(x => String(x.id) !== b.dataset.rm); persist(); renderCarrinho(); }
  else if ((b = g("data-keep"))) { const i = cart.find(x => String(x.id) === b.dataset.keep); if (i) i.pre = true; persist(); renderCarrinho(); }
  else if (g("data-cupom")) {
    const cod = $("#cupIn").value, c = cupList.find(c => norm(c.codigo) === norm(cod));
    if (!norm(cod)) cupMsg = "Digite o código do cupom.";
    else if (!c) cupMsg = "Cupom inválido.";
    else if (c.ativo !== true) cupMsg = "Este cupom está inativo.";
    else { cupomCod = c.codigo; save("metech_cupom", cupomCod); cupMsg = ""; }
    renderCarrinho();
  }
  else if (g("data-semcupom")) { cupomCod = ""; cupMsg = ""; save("metech_cupom", ""); renderCarrinho(); }
  else if (e.target.id === "enviar") enviar();
});
document.addEventListener("input", e => { if (e.target.id === "nomeIn") nome = e.target.value; });

/* ---------- Rotas e início ---------- */
function rota() {
  const c = location.hash === "#carrinho";
  $("#loja").hidden = c; $("#pagCarrinho").hidden = !c;
  if (c) renderCarrinho(); else renderLoja();
  atualizaBarra(); scrollTo(0, 0);
}
addEventListener("hashchange", rota);
setTema(sel.tema); marca(); rota();
addEventListener("keydown", e => { const c = e.target.closest && e.target.closest(".card"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abrirDetalhes(c.dataset.ver); } });
