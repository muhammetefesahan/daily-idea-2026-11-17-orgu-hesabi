import { giysiHesabi, kgYaz, tl, saatYaz, sayiOku, ORNEK, yedekAl, yedekOku } from './core.mjs';

const $ = id => document.getElementById(id);
const ANAHTAR = 'orgu-hesabi-v1';
let veri = structuredClone(ORNEK);

function kaydet() { try { localStorage.setItem(ANAHTAR, yedekAl(veri)); } catch { /* özel pencere */ } }
function yukle() { try { const m = localStorage.getItem(ANAHTAR); if (m) veri = yedekOku(m); } catch { /* bozuk */ } }

const kacama = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sayiKutu = x => x.toLocaleString('tr-TR', { maximumFractionDigits: 2, useGrouping: false });
const yaz = x => x.toLocaleString('tr-TR', { maximumFractionDigits: 1 });

// Bir sayı kutusunu doğrulayıp veriye bağla
function bagla(el, al, koy, a, b) {
  el.value = sayiKutu(al());
  el.oninput = () => {
    const v = sayiOku(el.value), iyi = v !== null && v >= a && v <= b;
    el.classList.toggle('hatali', !iyi);
    if (iyi) { koy(v); kaydet(); hesap(); }
  };
}

function ayarlariBagla() {
  const o = veri.ornek, y = veri.yumak;
  bagla($('oGen'), () => o.gen, v => { o.gen = v; }, 1, 100);
  bagla($('oYuk'), () => o.yuk, v => { o.yuk = v; }, 1, 100);
  bagla($('oGram'), () => o.gram, v => { o.gram = v; }, 0, 1000);
  bagla($('oIlmek'), () => o.ilmek, v => { o.ilmek = v; }, 1, 500);
  bagla($('oSira'), () => o.sira, v => { o.sira = v; }, 1, 500);
  bagla($('yGram'), () => y.gram, v => { y.gram = v; }, 1, 5000);
  bagla($('yMetre'), () => y.metre, v => { y.metre = v; }, 1, 10000);
  bagla($('yFiyat'), () => y.fiyat / 100, v => { y.fiyat = Math.round(v * 100); }, 0, 100000);
  bagla($('fire'), () => veri.fire * 100, v => { veri.fire = v / 100; }, 0, 100);
  bagla($('hiz'), () => veri.hiz, v => { veri.hiz = v; }, 1, 200);
  $('olcek').value = veri.olcek;
}
$('olcek').oninput = () => { veri.olcek = +$('olcek').value; kaydet(); hesap(); };
document.querySelectorAll('[data-olcek]').forEach(b => { b.onclick = () => { veri.olcek = +b.dataset.olcek; $('olcek').value = veri.olcek; kaydet(); hesap(); }; });

// ---------- Parçalar ----------
function parcalariCiz() {
  const tb = $('parcalar');
  tb.innerHTML = '';
  veri.parcalar.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input maxlength="40" value="${kacama(p.ad)}" aria-label="${i + 1}. parça adı"></td>
      <td><input inputmode="decimal" value="${sayiKutu(p.alt)}" aria-label="${i + 1}. parçanın başlangıç eni (cm)"></td>
      <td><input inputmode="decimal" value="${sayiKutu(p.ust)}" aria-label="${i + 1}. parçanın bitiş eni (cm)"></td>
      <td><input inputmode="decimal" value="${sayiKutu(p.boy)}" aria-label="${i + 1}. parçanın boyu (cm)"></td>
      <td><input type="number" min="1" max="20" value="${p.adet}" aria-label="${i + 1}. parçadan kaç tane"></td>
      <td><button class="sil" aria-label="${i + 1}. parçayı sil">×</button></td>`;
    const [ad, alt, ust, boy, adet] = tr.querySelectorAll('input');
    ad.oninput = () => { p.ad = ad.value.trim() || 'Parça'; kaydet(); hesap(); };
    for (const [el, alan] of [[alt, 'alt'], [ust, 'ust'], [boy, 'boy']]) {
      el.oninput = () => { const v = sayiOku(el.value), iyi = v !== null && v >= 1 && v <= 1000; el.classList.toggle('hatali', !iyi); if (iyi) { p[alan] = v; kaydet(); hesap(); } };
    }
    adet.oninput = () => { const v = Number(adet.value), iyi = adet.value !== '' && Number.isInteger(v) && v >= 1 && v <= 20; adet.classList.toggle('hatali', !iyi); if (iyi) { p.adet = v; kaydet(); hesap(); } };
    tr.querySelector('.sil').onclick = () => { veri.parcalar.splice(i, 1); kaydet(); parcalariCiz(); hesap(); };
    tb.append(tr);
  });
}
$('parcaEkle').onclick = () => {
  if (veri.parcalar.length >= 30) return;
  veri.parcalar.push({ ad: `Parça ${veri.parcalar.length + 1}`, alt: 20, ust: 20, boy: 20, adet: 1 });
  kaydet(); parcalariCiz(); hesap();
};

// Parçanın küçük şekli: alttan başlayıp yukarı örülüyor
function sekil(p, enBuyuk) {
  const k = 60 / enBuyuk, a = p.alt * k, u = p.ust * k, h = Math.min(66, p.boy * k);
  const y0 = 70, y1 = y0 - h, cx = 37;
  return `<svg viewBox="0 0 74 74" aria-hidden="true"><polygon points="${cx - a / 2},${y0} ${cx + a / 2},${y0} ${cx + u / 2},${y1} ${cx - u / 2},${y1}" fill="#c8322b" fill-opacity="0.35" stroke="#ff6f61" stroke-width="1.5"/><path d="M${cx},${y1 + 4} L${cx},${y0 - 4} M${cx - 3},${y1 + 8} L${cx},${y1 + 4} L${cx + 3},${y1 + 8}" fill="none" stroke="#c9b9a0" stroke-width="1"/></svg>`;
}

// ---------- Sonuç ----------
function hesap() {
  $('olcekYazi').textContent = '×' + veri.olcek.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  const r = giysiHesabi(veri);
  const s = r.siklik;
  $('ozet').innerHTML = `<h2>Alışveriş listesi</h2>
    ${r.yumak === null
      ? `<div class="dev">? yumak</div><p class="not">Örnek parçanın ağırlığını yazarsan ip miktarını da hesaplarım.</p>`
      : `<div class="dev">${r.yumak} yumak <small>${kgYaz(r.gram)} ip</small></div>`}
    <div class="kutular">
      <div><b>${r.metre === null ? '–' : `${Math.round(r.metre).toLocaleString('tr-TR')} m`}</b><span>ip uzunluğu</span></div>
      <div><b>${r.fiyat === null ? '–' : tl(r.fiyat)}</b><span>ip parası</span></div>
      <div><b>${r.ilmek.toLocaleString('tr-TR')}</b><span>toplam ilmek</span></div>
      <div><b>${r.dakika === null ? '–' : saatYaz(r.dakika)}</b><span>örme süresi (dikiş hariç)</span></div>
    </div>
    <p class="not">10 cm'de ${yaz(s.ilmekCm * 10)} ilmek, ${yaz(s.siraCm * 10)} sıra. ${r.yumak !== null ? `Hepsini aynı boya partisinden (lot) birden al; sonradan alınan yumağın tonu farklı çıkabilir.` : ''}</p>`;

  const enBuyuk = Math.max(1, ...r.parcalar.map(p => Math.max(p.alt, p.ust, p.boy)));
  $('tarif').innerHTML = r.parcalar.map(p => `<li>
      ${sekil(p, enBuyuk)}
      <div>
        <div class="ust">${kacama(p.ad)}<span>${p.adet > 1 ? `${p.adet} tane` : '1 tane'}</span></div>
        <div class="sayilar"><b>${p.ilmekAlt}</b> ilmek başla, <b>${p.sira}</b> sıra ör${p.tur !== 'duz' ? `, <b>${p.ilmekUst}</b> ilmekle bitir` : ''}.</div>
        <div class="plan">${kacama(p.planYazi)}</div>
        ${p.imkansiz ? `<div class="uyari">⚠️ Bu kadar kısa bir parçada bu kadar ${p.tur === 'artir' ? 'artırma' : 'eksiltme'} yetişmez; her sırada birden fazla yapman ya da ölçüleri değiştirmen gerek.</div>` : ''}
        ${p.duzeltme ? `<div class="bilgi">İki kenarda eşit ${p.tur === 'artir' ? 'artırabilmek' : 'eksiltebilmek'} için bitiş enini ${p.duzeltme > 0 ? '1 ilmek fazla' : '1 ilmek az'} aldım.</div>` : ''}
        <div class="bilgi">${yaz(p.alt)} → ${yaz(p.ust)} cm en, ${yaz(p.boy)} cm boy</div>
      </div>
    </li>`).join('') || '<li><div></div><div>Parça ekleyince tarif burada çıkacak.</div></li>';

  $('metin').value = ['🧶 Örgü tarifi', `Sıklık: 10 cm'de ${yaz(s.ilmekCm * 10)} ilmek, ${yaz(s.siraCm * 10)} sıra`, '',
    ...r.parcalar.map(p => `${p.ad} (${p.adet} tane): ${p.ilmekAlt} ilmek başla, ${p.sira} sıra ör${p.tur !== 'duz' ? `, ${p.ilmekUst} ilmekle bitir` : ''}. ${p.planYazi}`),
    '', r.yumak === null ? '' : `İp: ${r.yumak} yumak (${kgYaz(r.gram)}, yaklaşık ${Math.round(r.metre)} m)`].join('\n').trim();
}

$('kopyala').onclick = async () => {
  try { await navigator.clipboard.writeText($('metin').value); $('kopyala').textContent = '✓ Kopyalandı'; }
  catch { $('metin').select(); $('kopyala').textContent = 'Seçildi, kopyalayabilirim'; }
  setTimeout(() => { $('kopyala').textContent = '📋 Kopyala'; }, 1800);
};

// ---------- Örnek, yedek ----------
function hepsi() { ayarlariBagla(); parcalariCiz(); hesap(); }
$('ornek').onclick = () => { veri = structuredClone(ORNEK); kaydet(); hepsi(); $('islemYazi').textContent = 'Örnek yüklendi. Ölçüler ve fiyat uydurma.'; };
$('yedekAl').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([yedekAl(veri)], { type: 'application/json' }));
  a.download = 'orgu-hesabi-yedek.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('yedekYukle').onchange = async ev => {
  const f = ev.target.files[0];
  if (!f) return;
  try { veri = yedekOku(await f.text()); kaydet(); hepsi(); $('islemYazi').textContent = `Yedek yüklendi: ${veri.parcalar.length} parça.`; }
  catch (err) { $('islemYazi').textContent = err instanceof SyntaxError ? 'Bu dosyayı okuyamadım.' : err.message; }
  ev.target.value = '';
};

if (!new URLSearchParams(location.search).has('ornek')) yukle();
hepsi();
