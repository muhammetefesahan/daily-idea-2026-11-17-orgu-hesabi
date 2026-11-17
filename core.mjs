// Örgü Hesabı: örnek parçadan (ilmek ve sıra sıklığı) bir giysinin parçalarını,
// artırma/eksiltme planını ve gereken ipi hesaplamak.
// Uzunluklar cm, ağırlık gram, para kuruş.

// Örnek parçadan sıklık: 1 cm'de kaç ilmek, kaç sıra; 1 cm² örgü kaç gram?
export function siklik(o) {
  return {
    ilmekCm: o.ilmek / o.gen,
    siraCm: o.sira / o.yuk,
    gramCm2: o.gram > 0 ? o.gram / (o.gen * o.yuk) : null,
  };
}

// R sıra boyunca d kez değişiklik (her seferinde iki kenarda birer ilmek) nereye düşsün?
// Örgü tariflerindeki gibi: R sırayı d + 1 parçaya bölüyorum (son parça değişikliksiz düz kısım).
// Parçalar a ya da a + 1 sıra; uzun olanlar başta. Böylece tarif en çok iki blok olur:
// "önce şu kadar kez her (a+1). sırada, sonra şu kadar kez her a. sırada".
export function dagit(R, d) {
  if (d <= 0 || R <= 0) return [];
  const n = d + 1, a = Math.floor(R / n), r = R - a * n;
  const sira = [];
  let t = 0;
  for (let k = 0; k < d; k++) { t += k < r ? a + 1 : a; sira.push(Math.max(1, t)); }
  return sira;
}

// [7, 14, 20, 26] -> [{ aralik: 7, kez: 1 }, { aralik: 6, kez: 2 }]
export function araliklar(sira) {
  if (!sira.length) return [];
  const gruplar = [];
  for (let i = 1; i < sira.length; i++) {
    const a = sira[i] - sira[i - 1];
    const son = gruplar[gruplar.length - 1];
    if (son && son.aralik === a) son.kez++; else gruplar.push({ aralik: a, kez: 1 });
  }
  return gruplar;
}

export function planYazisi(sira, tur) {
  if (!sira.length) return 'Düz ör, artırma ya da eksiltme yok.';
  const fiil = tur === 'artir' ? 'artır' : 'eksilt';
  const g = araliklar(sira);
  const ilk = `${sira[0]}. sırada iki kenardan birer ilmek ${fiil}`;
  if (!g.length) return ilk + '.';
  return `${ilk}; sonra ${g.map(x => (x.aralik === 0 ? `${x.kez} kez aynı sırada yine` : `${x.kez} kez her ${x.aralik}. sırada`)).join(', ')} tekrarla.`;
}

// Bir parça: { ad, alt (cm), ust (cm), boy (cm), adet }  — alt: başladığın kenar, ust: bitirdiğin kenar
export function parcaHesabi(p, s, olcek = 1) {
  const alt = p.alt * olcek, ust = p.ust * olcek, boy = p.boy * olcek;
  const ilmekAlt = Math.max(1, Math.round(alt * s.ilmekCm));
  let ilmekUst = Math.max(1, Math.round(ust * s.ilmekCm));
  const sira = Math.max(1, Math.round(boy * s.siraCm));
  // İki kenarda simetrik artırıp eksilttiğim için fark çift olmalı; tekse üst kenarı hedefe en yakın çift farka yuvarla
  let duzeltme = 0;
  if ((ilmekUst - ilmekAlt) % 2 !== 0) {
    const hedef = ust * s.ilmekCm;
    const yukari = ilmekUst + 1, asagi = ilmekUst - 1;
    const yeni = Math.abs(yukari - hedef) <= Math.abs(asagi - hedef) || asagi < 1 ? yukari : asagi;
    duzeltme = yeni - ilmekUst; ilmekUst = yeni;
  }
  const kenarBasi = Math.abs(ilmekUst - ilmekAlt) / 2;
  const tur = ilmekUst > ilmekAlt ? 'artir' : ilmekUst < ilmekAlt ? 'eksilt' : 'duz';
  const plan = dagit(sira, kenarBasi);
  const alan = ((alt + ust) / 2) * boy;                        // cm², bir tane
  const ilmekToplam = Math.round(((ilmekAlt + ilmekUst) / 2) * sira);   // bir tanede örülecek ilmek
  return {
    ad: p.ad, adet: p.adet, alt, ust, boy,
    ilmekAlt, ilmekUst, sira, duzeltme, tur, kenarBasi, plan,
    imkansiz: kenarBasi > sira,                                 // her sıra değiştirsen bile yetişmez
    planYazi: planYazisi(plan, tur),
    alan, alanToplam: alan * p.adet, ilmekToplam: ilmekToplam * p.adet,
  };
}

// Bütün giysi
// v: { ornek: {gen, yuk, ilmek, sira, gram}, yumak: {gram, metre, fiyat}, parcalar: [...], fire (0..1), hiz (ilmek/dk), olcek }
export function giysiHesabi(v) {
  const s = siklik(v.ornek);
  const parcalar = v.parcalar.map(p => parcaHesabi(p, s, v.olcek));
  const alan = parcalar.reduce((t, p) => t + p.alanToplam, 0);
  const ilmek = parcalar.reduce((t, p) => t + p.ilmekToplam, 0);
  const gram = s.gramCm2 === null ? null : alan * s.gramCm2 * (1 + v.fire);
  const metre = gram === null || !(v.yumak.gram > 0) ? null : (gram * v.yumak.metre) / v.yumak.gram;
  const yumak = gram === null || !(v.yumak.gram > 0) ? null : Math.ceil(gram / v.yumak.gram - 1e-9);
  return {
    siklik: s, parcalar, alan, ilmek, gram, metre, yumak,
    fiyat: yumak === null ? null : yumak * v.yumak.fiyat,
    dakika: v.hiz > 0 ? ilmek / v.hiz : null,
  };
}

export const kgYaz = g => (g >= 1000 ? `${(g / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg` : `${Math.round(g)} g`);
export const tl = k => (k / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
export function saatYaz(dk) {
  const s = Math.floor(dk / 60), d = Math.round(dk % 60);
  return s ? `${s} sa${d ? ` ${d} dk` : ''}` : `${d} dk`;
}

// "12,5" / "12.5" -> 12.5
export function sayiOku(yazi) {
  const s = String(yazi).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}

// --- Uydurma örnek: kalın iple bir yetişkin hırkası ---
export const ORNEK = {
  ornek: { gen: 10, yuk: 10, ilmek: 14, sira: 20, gram: 12 },
  yumak: { gram: 100, metre: 160, fiyat: 8990 },
  parcalar: [
    { ad: 'Arka', alt: 50, ust: 50, boy: 65, adet: 1 },
    { ad: 'Ön', alt: 25, ust: 25, boy: 65, adet: 2 },
    { ad: 'Kol', alt: 22, ust: 40, boy: 48, adet: 2 },
  ],
  fire: 0.1,
  hiz: 20,
  olcek: 1,
};

export function yedekAl(v) { return JSON.stringify({ tur: 'orgu-hesabi', surum: 1, ...v }, null, 2); }
export function yedekOku(metin) {
  const d = JSON.parse(metin);
  if (d?.tur !== 'orgu-hesabi' || !Array.isArray(d.parcalar)) throw new Error('Bu dosya bir Örgü Hesabı yedeği değil.');
  const sayi = (x, a, b, v) => (typeof x === 'number' && Number.isFinite(x) && x >= a && x <= b ? x : v);
  const o = d.ornek || {}, y = d.yumak || {};
  return {
    ornek: { gen: sayi(o.gen, 1, 100, 10), yuk: sayi(o.yuk, 1, 100, 10), ilmek: sayi(o.ilmek, 1, 500, 20), sira: sayi(o.sira, 1, 500, 28), gram: sayi(o.gram, 0, 1000, 0) },
    yumak: { gram: sayi(y.gram, 1, 5000, 100), metre: sayi(y.metre, 1, 10000, 200), fiyat: sayi(y.fiyat, 0, 1e7, 0) },
    parcalar: d.parcalar.slice(0, 30).map(p => ({ ad: String(p?.ad || 'Parça').slice(0, 40), alt: sayi(p?.alt, 1, 1000, 20), ust: sayi(p?.ust, 1, 1000, 20), boy: sayi(p?.boy, 1, 1000, 20), adet: Number.isInteger(p?.adet) && p.adet >= 1 && p.adet <= 20 ? p.adet : 1 })),
    fire: sayi(d.fire, 0, 1, 0.1),
    hiz: sayi(d.hiz, 1, 200, 20),
    olcek: sayi(d.olcek, 0.1, 10, 1),
  };
}
