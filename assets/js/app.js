/* ===================== CONFIG ===================== */
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl5rtBY94kiWBeL5yMK9uoKLbRsirFc9XNFHqPEbN_0JGaTJzxWkdVX1Gjb7bC2YguiNXYo5nu15df/pub?gid=0&single=true&output=csv";
const TARGET_SELECTOR = ".products-grid";
const USE_HEADER_ROW = true;        // 1re ligne = en-têtes
const AUTO_REFRESH_MS = 0;          // ex. 300000 pour 5 min; 0 = off
/* ================================================== */

function setStatus(msg){ const el = document.getElementById("sheet-status-inline"); if (el) el.textContent = msg; }

// Parser CSV robuste
function parseCSV(text){
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = []; let row = [], val = "", inQuotes = false;
  for (let i=0; i<text.length; i++){
    const c = text[i], n = text[i+1];
    if (inQuotes){
      if (c === '"' && n === '"'){ val += '"'; i++; }
      else if (c === '"'){ inQuotes = false; }
      else { val += c; }
    } else {
      if (c === '"'){ inQuotes = true; }
      else if (c === ','){ row.push(val); val = ""; }
      else if (c === '\n'){ row.push(val); rows.push(row); row = []; val = ""; }
      else if (c === '\r'){ /* ignore */ }
      else { val += c; }
    }
  }
  if (val.length || row.length){ row.push(val); rows.push(row); }
  while (rows.length && rows[rows.length-1].every(x => x === "")) rows.pop();
  return rows;
}

function headerIndexMap(headers){ const map = {}; headers.forEach((h,i)=>{ const k=(h||"").toString().trim().toLowerCase(); if(k) map[k]=i; }); return map; }
function getByHeader(row, map, ...aliases){ for(const name of aliases){ const key=name.toLowerCase(); if(key in map) return (row[map[key]] ?? "").toString().trim(); } return ""; }
function formatEUR(val){
  if (val===""||val===null||typeof val==="undefined") return "";
  let s=String(val).replace(/[€\s]/g,"").replace(",",".");
  let n=Number(s);
  if(Number.isNaN(n)) return String(val);
  return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n);
}

function renderProducts(rows, filterText=""){
  const container = document.querySelector(TARGET_SELECTOR);
  if (!container) return console.warn("Container non trouvé:", TARGET_SELECTOR);
  container.innerHTML="";

  if (!rows || !rows.length){ setStatus("Aucune donnée."); return; }

  let start=0, map={};
  if (USE_HEADER_ROW){
    const headers=rows[0].map(h=>(h||"").toString().trim());
    map=headerIndexMap(headers);
    start=1;
  } else {
    map = { "emoji":0, "titre":1, "description":2, "prix":3, "image":4, "alt":5, "fit":6, "badge":7 };
  }

  const q=(filterText||"").toLowerCase(); let count=0;

  for(let r=start; r<rows.length; r++){
    const row = rows[r];
    if(!row || row.every(c => (c??"").toString().trim()==="")) continue;

    const emoji = getByHeader(row,map,"emoji","icone","icon");
    const titre = getByHeader(row,map,"titre","title","nom","produit");
    let description = getByHeader(row,map,"description","desc","texte");
    const prixRaw = getByHeader(row,map,"prix","price","tarif","€","eur");
    const image = getByHeader(row,map,"image","photo","img","url");
    const alt   = getByHeader(row,map,"alt","texte alt","alt text") || titre || "Produit";
    const fit   = (getByHeader(row,map,"fit","image_fit") || "cover").toLowerCase();
    const badgeRaw = getByHeader(row,map,"badge","tag","etiquette");
    const hasBadge = /^(nouveau|nouveaute|nouveauté|new)$/i.test(
      (badgeRaw||"").normalize("NFD").replace(/\p{Diacritic}/gu,"").trim()
    );

    description = description.replace(/\r?\n/g,"<br>");
    const prixFmt = formatEUR(prixRaw);

    // Filtre
    const hay = (titre + " " + description.replace(/<br>/g," ") + " " + prixFmt).toLowerCase();
    if (q && !hay.includes(q)) continue;

    // safe alt
    const safeAlt = alt.replace(/"/g, "&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

    // Bloc image (avec badge si présent)
    const badgeHTML = hasBadge ? `<span class="badge">Nouveauté</span>` : "";
    let imageBlock = "";
    if (image) {
      imageBlock = `<div class="product-image" ${fit==="contain" ? 'data-fit="contain"' : ""}>${badgeHTML}<img src="${image}" alt="${safeAlt}" loading="lazy" decoding="async"/></div>`;
    } else {
      imageBlock = `<div class="product-image">${badgeHTML}${emoji || "🪵"}</div>`;
    }

    const card = document.createElement("div");
    card.className="product-card";
    card.innerHTML = `
      ${imageBlock}
      <div class="product-content">
        <h3 class="product-title">${titre || "Sans titre"}</h3>
        ${prixFmt ? `<div class="price-tag">${prixFmt}</div>` : ""}
        <p class="product-description">${description || ""}</p>
      </div>
    `;
    container.appendChild(card);
    count++;
  }

  setStatus(count ? `Dernière mise à jour : ${new Date().toLocaleString()} • ${count} élément(s)` : "Aucun résultat.");
}

async function loadCSV(){
  try{
    setStatus("Chargement des créations depuis Google Sheets…");
    const res = await fetch(CSV_URL, { cache:"no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    window.__rows = parseCSV(text);
    renderProducts(window.__rows);
  } catch(e){
    console.error(e);
    setStatus("Erreur de chargement : " + (e.message || e));
  }
}

// Filtre en direct
document.addEventListener("DOMContentLoaded", () => {
  const input=document.getElementById("filter-input");
  if(input) input.addEventListener("input", ()=>{ renderProducts(window.__rows||[], input.value); });
});
loadCSV();
if (AUTO_REFRESH_MS > 0) setInterval(loadCSV, AUTO_REFRESH_MS);
