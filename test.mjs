import assert from 'node:assert/strict';
import { siklik, dagit, araliklar, planYazisi, parcaHesabi, giysiHesabi, kgYaz, tl, saatYaz, sayiOku, ORNEK, yedekAl, yedekOku } from './core.mjs';

let checks = 0;
const ok = fn => { fn(); checks++; };
const yakin = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

// 1. Sıklık
const s = siklik({ gen: 10, yuk: 10, ilmek: 14, sira: 20, gram: 12 });
ok(() => yakin(s.ilmekCm, 1.4)); ok(() => yakin(s.siraCm, 2)); ok(() => yakin(s.gramCm2, 0.12));
ok(() => assert.equal(siklik({ gen: 10, yuk: 10, ilmek: 14, sira: 20, gram: 0 }).gramCm2, null));

// 2. Dağıtım: rastgele durumlarda kurallar tutuyor
let tohum = 5; const rnd = () => (tohum = (tohum * 48271) % 2147483647) / 2147483647;
let hepIyi = true, enCokIkiBlok = true;
for (let t = 0; t < 2000; t++) {
  const R = 1 + Math.floor(rnd() * 400), d = Math.floor(rnd() * R);    // d < R
  const p = dagit(R, d);
  if (p.length !== d) hepIyi = false;
  if (p.some((x, i) => x < 1 || x > R || (i > 0 && x <= p[i - 1]))) hepIyi = false;      // hepsi farklı sıralarda, artan
  // Aralıklar (son düz kısım dahil) birbirinden en fazla 1 sıra farklı
  const ar = p.map((x, i) => x - (i ? p[i - 1] : 0)).concat(d ? [R - p[d - 1]] : []);
  if (d && Math.max(...ar) - Math.min(...ar) > 1) hepIyi = false;
  if (araliklar(p).length > 2) enCokIkiBlok = false;
}
ok(() => assert.ok(hepIyi));
ok(() => assert.ok(enCokIkiBlok));
ok(() => assert.deepEqual(dagit(96, 13), [7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 90]));
ok(() => assert.deepEqual(dagit(10, 0), []));
ok(() => assert.deepEqual(araliklar([7, 14, 20, 26]), [{ aralik: 7, kez: 1 }, { aralik: 6, kez: 2 }]));
ok(() => assert.equal(planYazisi([7, 14, 20], 'artir'), '7. sırada iki kenardan birer ilmek artır; sonra 1 kez her 7. sırada, 1 kez her 6. sırada tekrarla.'));
ok(() => assert.equal(planYazisi([5], 'eksilt'), '5. sırada iki kenardan birer ilmek eksilt.'));
ok(() => assert.match(planYazisi([], 'duz'), /Düz ör/));

// 3. Bir parça
const kol = parcaHesabi({ ad: 'Kol', alt: 22, ust: 40, boy: 48, adet: 2 }, s);
ok(() => assert.equal(kol.ilmekAlt, 31));                   // 22 × 1,4 = 30,8
ok(() => assert.equal(kol.ilmekUst, 57));                   // 40 × 1,4 = 56, fark tek olduğu için 57
ok(() => assert.equal(kol.duzeltme, 1));
ok(() => assert.equal(kol.sira, 96));
ok(() => assert.equal(kol.kenarBasi, 13));
ok(() => assert.equal(kol.ilmekAlt + 2 * kol.plan.length, kol.ilmekUst));   // artırmalar tam üst kenarı veriyor
ok(() => assert.equal(kol.tur, 'artir'));
ok(() => yakin(kol.alanToplam, 2 * 31 * 48));
// Ters yönde örülen parça eksiltir
const yaka = parcaHesabi({ ad: 'x', alt: 40, ust: 22, boy: 48, adet: 1 }, s);
ok(() => assert.equal(yaka.tur, 'eksilt'));
ok(() => assert.equal(yaka.ilmekAlt - 2 * yaka.plan.length, yaka.ilmekUst));
// Düz parça
const arka = parcaHesabi({ ad: 'Arka', alt: 50, ust: 50, boy: 65, adet: 1 }, s);
ok(() => assert.equal(arka.ilmekAlt, 70)); ok(() => assert.equal(arka.sira, 130)); ok(() => assert.equal(arka.plan.length, 0));
// Çok kısa parçada çok artırma: yetişmez uyarısı
ok(() => assert.ok(parcaHesabi({ ad: 'x', alt: 10, ust: 60, boy: 5, adet: 1 }, s).imkansiz));
ok(() => assert.ok(!kol.imkansiz));

// 4. Bütün giysi
const r = giysiHesabi(ORNEK);
const alan = 50 * 65 + 2 * 25 * 65 + 2 * 31 * 48;
ok(() => yakin(r.alan, alan));
ok(() => yakin(r.gram, alan * 0.12 * 1.1, 1e-6));
ok(() => assert.equal(r.yumak, 13));                      // 1251 g -> 13 yumak
ok(() => yakin(r.metre, (r.gram * 160) / 100, 1e-6));
ok(() => assert.equal(r.fiyat, 13 * 8990));
ok(() => yakin(r.dakika, r.ilmek / 20));
// Ölçek 3 kat: ip yaklaşık 9 kat (alan karesiyle büyür), ilmek sayısı kenarda 3 kat
const r3 = giysiHesabi({ ...ORNEK, olcek: 3 });
ok(() => yakin(r3.alan / r.alan, 9, 0.2));
ok(() => yakin(r3.parcalar[0].ilmekAlt / r.parcalar[0].ilmekAlt, 3, 1e-9));
// Örnek parçanın ağırlığı yoksa ip hesaplanmaz ama ilmek planı çıkar
const agirliksiz = giysiHesabi({ ...ORNEK, ornek: { ...ORNEK.ornek, gram: 0 } });
ok(() => assert.equal(agirliksiz.gram, null)); ok(() => assert.equal(agirliksiz.yumak, null));
ok(() => assert.equal(agirliksiz.parcalar[2].ilmekUst, 57));
// Yumak tam bölünüyorsa fazladan yumak eklenmiyor
ok(() => assert.equal(giysiHesabi({ ...ORNEK, ornek: { gen: 10, yuk: 10, ilmek: 10, sira: 10, gram: 10 }, parcalar: [{ ad: 'k', alt: 100, ust: 100, boy: 100, adet: 1 }], fire: 0 }).yumak, 10));

// 5. Yazma ve okuma
ok(() => assert.equal(kgYaz(1251.4), '1,25 kg')); ok(() => assert.equal(kgYaz(640), '640 g'));
ok(() => assert.equal(tl(116870).replace(/\s/g, ' '), '1.168,70 TL'));
ok(() => assert.equal(saatYaz(1332), '22 sa 12 dk')); ok(() => assert.equal(saatYaz(45), '45 dk'));
ok(() => assert.equal(sayiOku('12,5'), 12.5)); ok(() => assert.equal(sayiOku('x'), null));
ok(() => assert.deepEqual(yedekOku(yedekAl(ORNEK)), JSON.parse(JSON.stringify(ORNEK))));
ok(() => assert.throws(() => yedekOku('{"tur":"x"}')));
const y = yedekOku(JSON.stringify({ tur: 'orgu-hesabi', parcalar: [{ alt: -3, adet: 1.5 }], ornek: { ilmek: 'çok' }, olcek: 99 }));
ok(() => assert.deepEqual(y.parcalar[0], { ad: 'Parça', alt: 20, ust: 20, boy: 20, adet: 1 }));
ok(() => assert.equal(y.ornek.ilmek, 20)); ok(() => assert.equal(y.olcek, 1));

console.log(`${checks} kontrol geçti.`);
