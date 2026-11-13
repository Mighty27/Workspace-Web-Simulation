# PRD – Web Workstation (terinspirasi BrowOS)

Versi 0.1 (Draf) · 13 November 2026 · Nama kerja produk: **WebWorkstation** (belum final)

## 1. Ringkasan Eksekutif

WebWorkstation adalah ruang kerja berbasis web yang tampil seperti sistem operasi desktop di dalam browser: ada desktop, jendela yang bisa digeser dan diubah ukurannya, taskbar, Start menu, aplikasi bawaan, dan toko aplikasi. Berbeda dengan BrowOS yang berupa ekstensi Chrome pengganti tab baru, WebWorkstation berjalan sebagai aplikasi web/PWA yang bisa dibuka di browser apa pun dan di perangkat mana pun, dengan penyimpanan file nyata dan opsi sinkronisasi antar perangkat.

Dokumen ini dibuat dengan membaca langsung kode BrowOS v1.0.1 (file zip yang diunggah), lalu menerjemahkan apa yang sudah ada, apa yang belum selesai, dan apa yang harus diubah agar konsepnya bekerja sebagai produk web.

## 2. Analisis BrowOS (Hasil Pembacaan Kode)

### 2.1 Apa yang BrowOS lakukan

BrowOS adalah ekstensi Chrome Manifest V3 yang menimpa halaman tab baru (`chrome_url_overrides.newtab`) dengan antarmuka desktop. Teknologinya vanilla HTML, CSS, dan JavaScript tanpa framework dan tanpa build step. Fitur yang teridentifikasi:

| Area | Implementasi di BrowOS |
| --- | --- |
| Window manager | Jendela bisa digeser, diubah ukuran (8 arah, minimum 360×240), minimize, maximize, close, dan z-index naik saat diklik |
| Taskbar | Tombol app yang berjalan, app yang di-pin, jam, lebar bisa diatur atau otomatis, tombol Update |
| Start menu dan panel Apps | Pencarian app, bagian Default apps dan Installed apps |
| Desktop | Ikon bisa digeser (grid), diganti nama, menu klik kanan, urutkan ikon, ganti wallpaper |
| BrowStore | Katalog app (Discover, BrowOS Apps, Library), detail app diambil dari halaman resmi atau GitHub API, label Sponsored untuk penempatan berbayar |
| App bawaan | Notepad (Amit Merchant, MIT), Calculator (NEO-CALC Pro, MIT), Paint (miniPaint, MIT), Clock, Browser, Task Manager, Settings |
| Web app dan game | Spotify, 2048, A Dark Room, Clumsy Bird dibuka lewat iframe |
| Mode buka app | Tiga mode per app: di dalam BrowOS (iframe), jendela terpisah, atau tab browser |
| Jendela mengambang | Situs yang menolak iframe dibuka sebagai jendela popup Chrome yang diposisikan dan dijaga tetap di dalam area BrowOS (`chrome.windows`) |
| Personalisasi | Wallpaper (termasuk unggahan sendiri), warna aksen, tema gelap/terang, sudut jendela, gaya tombol Windows/Mac, transparansi, kursor kustom, teks desktop, animasi dan suara boot |
| Task Manager | Daftar proses berjalan dan pemakaian memori lewat izin `system.memory` |
| Pembaruan | Instalasi manual dicek sekali sehari ke `browos.pages.dev/version.json`, ada popup pengingat dan jendela What's new |
| Penyimpanan | `localStorage` (sekitar 35 titik penulisan) dan IndexedDB hanya di dalam app Notepad |

### 2.2 Celah dan keterbatasan yang ditemukan

- **Files belum ada.** Jendela Files hanya menampilkan layar "Under construction".
- **Aplikasi Browser hanya kotak pencarian.** Hasilnya selalu dibuka di tab baru, bukan browsing di dalam jendela.
- **Discover kosong.** Daftar kurasi `discoverList` masih array kosong.
- **Penyimpanan rapuh.** Wallpaper kustom disimpan sebagai data URL di `localStorage` yang batasnya sekitar 5 MB, tanpa ekspor atau impor, dan tanpa sinkronisasi antar perangkat.
- **Ketergantungan keras pada API Chrome.** `chrome.windows`, `chrome.runtime.getManifest`, dan `system.memory` tidak ada di web biasa.
- **Embedding situs pihak ketiga tidak andal.** Banyak situs memblokir iframe lewat `X-Frame-Options` atau CSP `frame-ancestors`. BrowOS menanganinya dengan bar "Page not showing?".
- **Ikon bergantung pada layanan Google.** Favicon diambil dari `google.com/s2/favicons`, sehingga setiap host yang dibuka ikut terkirim ke pihak ketiga.
- **Tidak ada model multi-pengguna, akun, atau izin per app.** Aplikasi bawaan berjalan di origin yang sama dengan shell.
- **Kode tidak modular.** Banyak variabel global dan urutan pemuatan skrip yang saling bergantung.

## 3. Masalah dan Peluang

**Masalah.** Pekerja pengetahuan dan pelajar membuka puluhan tab, catatan, kalkulator, dan alat kecil yang tercecer. Alat-alat itu tidak berbagi konteks, tidak mengikuti ke perangkat lain, dan tidak bisa disusun menjadi satu ruang kerja yang konsisten.

**Peluang.** BrowOS membuktikan bahwa metafora desktop (jendela, taskbar, ikon) mudah dipahami dan menyenangkan, tetapi terkunci di satu browser dan satu perangkat. Versi web murni dapat menjangkau pengguna Firefox, Safari, Edge, ChromeOS, tablet, dan komputer bersama, sekaligus menambah hal yang tidak bisa dilakukan ekstensi tab-baru: URL yang bisa dibagikan, penyimpanan file, dan sinkronisasi.

## 4. Tujuan dan Non-Tujuan

### Tujuan

1. Memberikan pengalaman desktop yang mulus di browser modern tanpa instalasi.
2. Menyediakan penyimpanan file nyata dan pengaturan yang tidak hilang ketika data browser dibersihkan (opsional dengan akun).
3. Mempertahankan seluruh hal yang disukai dari BrowOS: ringan, bisa dipersonalisasi, dan mudah dimulai.
4. Menyediakan model aplikasi yang aman sehingga pihak ketiga bisa menambah app tanpa mengambil alih shell.
5. Berjalan baik di desktop dan tablet, dan tetap bisa dipakai di layar sentuh.

### Non-Tujuan (untuk versi 1.0)

- Bukan emulator OS atau virtual machine (tidak menjalankan Windows atau Linux sungguhan).
- Bukan pengganti browser: tidak membangun mesin render sendiri.
- Tidak ada kolaborasi real-time multi-pengguna.
- Tidak ada aplikasi native mobile (cukup PWA).
- Tidak ada pasar app dengan pembayaran di rilis awal.

## 5. Target Pengguna

| Persona | Kebutuhan utama | Contoh skenario |
| --- | --- | --- |
| **Pelajar atau mahasiswa** | Catatan, kalkulator, timer fokus, dokumen, semuanya dalam satu tempat di komputer kampus atau warnet | Membuka workstation di komputer lab, mengambil file dari sesi kemarin |
| **Pekerja remote atau freelancer** | Ruang kerja yang sama di laptop dan tablet, shortcut ke web app kerja | Menjajarkan Notepad, kalender, dan tool tim dalam beberapa jendela |
| **Hobiis dan pengguna kustomisasi** | Tema, wallpaper, kursor, dan tata letak yang bisa diatur | Berbagi konfigurasi desktop lewat file ekspor |
| **Pengembang app** | SDK sederhana untuk mengemas alat kecil sebagai app di workstation | Menerbitkan app lewat manifest dan URL |

## 6. Prinsip Produk

- **Familier lebih dulu.** Perilaku jendela, taskbar, dan klik kanan mengikuti kebiasaan desktop.
- **Cepat dan ringan.** Shell terbuka kurang dari 2 detik pada koneksi biasa dan tetap berfungsi offline.
- **Data milik pengguna.** File dan pengaturan bisa diekspor kapan saja. Akun bersifat opsional.
- **Aman secara default.** App pihak ketiga terisolasi dan meminta izin.
- **Jujur soal batas.** Bila situs tidak bisa di-embed, pengguna diberi tahu dan diberi jalan keluar, bukan layar kosong.

## 7. Cakupan Fitur dan Prioritas

P0 adalah syarat rilis MVP, P1 untuk rilis 1.0, P2 pasca-1.0.

| ID | Fitur | Prioritas | Catatan dari BrowOS |
| --- | --- | --- | --- |
| F1 | Window manager (drag, resize, minimize, maximize, snap, z-order) | P0 | Ada di BrowOS, perlu dirombak agar sentuh dan keyboard didukung |
| F2 | Taskbar dan Start menu (pin, app berjalan, jam, pencarian) | P0 | Ada |
| F3 | Desktop (ikon, grid, klik kanan, ganti nama, wallpaper) | P0 | Ada |
| F4 | Penyimpanan lokal (IndexedDB dan OPFS) dan persistensi pengaturan | P0 | Ganti `localStorage` |
| F5 | App bawaan: Notepad, Calculator, Clock, Settings | P0 | Ada |
| F6 | Files (Virtual File System, upload, unduh, folder, pratinjau) | P0 | **Belum ada di BrowOS** |
| F7 | Task Manager | P1 | Ganti `system.memory` dengan metrik buatan sendiri |
| F8 | App Store dan katalog app dengan manifest | P1 | Ada tetapi katalog kosong |
| F9 | Web app via iframe dengan fallback tab baru | P1 | Ada, ganti jendela mengambang Chrome |
| F10 | Personalisasi lengkap (tema, aksen, kursor, boot) | P1 | Ada |
| F11 | Akun opsional dan sinkronisasi antar perangkat | P1 | **Baru** |
| F12 | Ekspor dan impor workspace (berkas konfigurasi) | P1 | **Baru** |
| F13 | Browser dalam jendela (proxy atau tab tertanam) | P2 | Di BrowOS hanya kotak pencarian |
| F14 | Multi desktop (virtual workspace) | P2 | **Baru** |
| F15 | SDK app dan izin per app | P2 | **Baru** |
| F16 | Paint dan app kreatif | P2 | Ada lewat miniPaint |
| F17 | Mode sentuh dan layout tablet | P1 | **Baru** |
| F18 | Pintasan keyboard dan palet perintah | P1 | **Baru** |

## 8. Persyaratan Fungsional

### 8.1 Window Manager (F1)

- Pengguna dapat membuka beberapa jendela sekaligus; jendela yang diklik naik ke depan.
- Jendela dapat digeser lewat header, diubah ukurannya dari 8 arah, dengan ukuran minimum yang dapat dikonfigurasi (default 360×240).
- Tombol minimize, maximize/restore, dan close. Gaya tombol dapat dipilih Windows atau Mac.
- Posisi dan ukuran jendela dipulihkan saat sesi berikutnya.
- Jendela tidak boleh keluar dari area desktop dan tidak boleh tersembunyi di balik taskbar.
- Snap ke setengah layar dan seperempat layar (P1).
- Dukungan sentuh dan pointer, bukan hanya mouse.
- Navigasi keyboard: Alt+Tab bergilir antar jendela, Esc menutup menu, fokus terlihat jelas.

### 8.2 Taskbar dan Start Menu (F2)

- Taskbar menampilkan app yang di-pin dan app yang sedang berjalan dengan indikator aktif.
- Klik kanan: pin/unpin, tutup, pengaturan taskbar.
- Jam, lebar taskbar otomatis atau manual, dan area notifikasi (P1).
- Start menu: pencarian app dan file, daftar app, akses cepat ke Files, Store, Settings, dan Keluar/Kunci sesi.
- Pencarian bersifat instan dan mencakup nama app serta file.

### 8.3 Desktop (F3)

- Ikon shortcut dapat diseret ke grid, diganti nama, dan diurutkan.
- Menu klik kanan desktop: wallpaper berikutnya, personalisasi, urutkan ikon, tambah situs, buka Store, Task Manager, refresh.
- Pengguna dapat menambahkan situs apa pun sebagai shortcut dengan nama dan ikon kustom.
- Pilihan multi-ikon dengan seleksi kotak (P1).

### 8.4 Penyimpanan dan Files (F4, F6)

- Penyimpanan data aplikasi memakai IndexedDB. Berkas besar memakai Origin Private File System (OPFS) bila tersedia, dengan fallback IndexedDB.
- Files menampilkan pohon folder, daftar berkas, buat/ubah nama/pindah/hapus, tempat sampah, drag and drop dari komputer, dan unduh.
- Pratinjau untuk teks, gambar, PDF, audio, video; berkas teks terbuka di Notepad.
- Indikator kuota dan peringatan saat penyimpanan hampir penuh. Aplikasi meminta `navigator.storage.persist()` agar data tidak dihapus otomatis.
- Notepad menyimpan catatan sebagai berkas di Files, bukan kunci tersembunyi.

### 8.5 Aplikasi Bawaan (F5)

- **Notepad:** teks biasa, ekspor ke .txt/.docx/.pdf, snapshot versi, penghitung kata, pewaktu fokus. Basis: Notepad oleh Amit Merchant (MIT).
- **Calculator:** standar dan ilmiah, riwayat. Basis: NEO-CALC Pro (MIT) atau implementasi baru.
- **Clock:** jam, timer, stopwatch, alarm.
- **Settings:** Personalisasi, Startup, Taskbar, Akun dan Sinkronisasi, Penyimpanan, About, Credits.
- Setiap app punya manifest (id, nama, ikon, versi, izin, jendela default).

### 8.6 App Store (F8)

- Tab Discover, Apps, dan Library. Detail app diambil dari manifest dan halaman resmi.
- Instalasi hanya menambah entri manifest dan data pengguna; hapus app juga menghapus data app atas konfirmasi.
- Kurasi dikelola tim. Penempatan berbayar wajib berlabel "Sponsored" seperti rancangan BrowStore.
- Setiap app menampilkan sumber, lisensi, dan izin yang diminta.

### 8.7 Web App dan Situs Eksternal (F9)

- Mode buka per app: di dalam workstation (iframe), tab baru, atau jendela popup (`window.open`).
- Bila iframe gagal dimuat (terdeteksi lewat batas waktu atau pesan galat), tampilkan bar bantuan dengan pilihan "Buka di tab baru" dan "Selalu buka di tab".
- Daftar situs yang diketahui memblokir iframe disimpan di katalog sehingga mode default-nya otomatis tab.
- Atribut `sandbox` dan `allow` pada iframe diatur seminimal mungkin sesuai izin app.

### 8.8 Task Manager (F7)

- Daftar jendela dan proses app yang berjalan, dengan aksi fokus dan tutup paksa.
- Metrik memori memakai `performance.measureUserAgentSpecificMemory()` atau `performance.memory` bila didukung, dan estimasi internal bila tidak.
- App yang tidak merespons (heartbeat gagal) ditandai dan dapat dimuat ulang.

### 8.9 Personalisasi (F10)

- Wallpaper bawaan dan unggahan sendiri (disimpan di OPFS, bukan data URL).
- Warna aksen, tema gelap/terang/ikut sistem, sudut jendela, gaya tombol, transparansi.
- Kursor kustom dan ukuran kursor, dengan opsi nonaktif demi aksesibilitas.
- Animasi dan suara boot dapat dimatikan; menghormati `prefers-reduced-motion`.

### 8.10 Akun dan Sinkronisasi (F11) dan Ekspor/Impor (F12)

- Mode tamu penuh tanpa akun; data tersimpan lokal.
- Akun opsional (email atau OAuth) untuk menyinkronkan pengaturan, tata letak desktop, dan berkas antar perangkat.
- Ekspor seluruh workspace sebagai satu berkas arsip (pengaturan dan berkas) dan impor kembali.
- Konflik sinkronisasi diselesaikan dengan "perubahan terbaru menang" untuk pengaturan, dan dengan salinan konflik untuk berkas.

### 8.11 Pembaruan

- Karena berupa aplikasi web, pembaruan terjadi otomatis lewat service worker. Mekanisme cek `version.json` BrowOS tidak diperlukan.
- Tampilkan jendela "What's new" setelah versi baru aktif dan sediakan changelog di Settings → About.

## 9. Persyaratan Non-Fungsional

| Aspek | Target |
| --- | --- |
| Performa | Shell interaktif dalam kurang dari 2 detik (koneksi 4G, perangkat menengah); jendela terbuka dalam kurang dari 150 ms; 60 fps saat drag dengan 10 jendela terbuka |
| Offline | Shell dan app bawaan berfungsi tanpa internet lewat service worker |
| Browser | Chrome, Edge, Firefox, Safari (dua versi mayor terakhir); fitur yang hanya ada di Chromium harus punya fallback |
| Responsif | Desktop, tablet, dan layar sentuh; di ponsel tampil sebagai launcher satu jendela |
| Aksesibilitas | WCAG 2.2 AA, navigasi keyboard penuh, label ARIA, kontras warna aksen divalidasi |
| Keamanan | Lihat bagian 12 |
| Ukuran | Bundel awal di bawah 300 KB (gzip) tanpa app; app dimuat malas |
| Lokalisasi | Bahasa Inggris dan Indonesia sejak awal, struktur i18n untuk bahasa lain |
| Ketahanan data | Tidak ada kehilangan data saat tab ditutup mendadak; penyimpanan bersifat transaksional |

## 10. Arsitektur yang Diusulkan

### 10.1 Pemetaan dari BrowOS ke Web

| BrowOS (ekstensi) | WebWorkstation (web/PWA) |
| --- | --- |
| `chrome_url_overrides.newtab` | URL aplikasi sendiri, dapat dipasang sebagai PWA dan dijadikan beranda |
| `chrome.windows` untuk jendela mengambang | `window.open` popup, atau iframe di dalam shell, dengan fallback tab |
| `system.memory` | `performance.memory` / `measureUserAgentSpecificMemory`, fallback estimasi |
| `chrome.runtime.getManifest().version` | Konstanta versi hasil build |
| `localStorage` | IndexedDB (data terstruktur) dan OPFS (berkas) |
| Cek `version.json` manual | Service worker dan pemberitahuan versi baru |
| Favicon dari layanan Google | Pengambilan ikon lewat endpoint sendiri dengan cache |
| Tanpa akun | Mode tamu ditambah akun opsional dan sinkronisasi |

### 10.2 Rekomendasi Stack

- **Frontend:** TypeScript, framework komponen (React atau Svelte), Vite, state terpusat untuk window manager.
- **Penyimpanan klien:** IndexedDB lewat pustaka pembungkus, OPFS untuk berkas, service worker (Workbox) untuk offline.
- **Backend (hanya untuk fitur akun/sinkron):** API REST atau tRPC, PostgreSQL, penyimpanan objek untuk berkas, autentikasi OAuth.
- **Isolasi app:** iframe dengan `sandbox`, origin terpisah untuk app pihak ketiga, komunikasi lewat `postMessage` dengan skema pesan terdefinisi.
- **Mesin jendela:** modul tersendiri dengan API: `open`, `close`, `focus`, `minimize`, `setBounds`, dan event; semua UI memakai API ini, tidak ada akses DOM langsung.

### 10.3 Komponen Utama

1. **Shell:** desktop, taskbar, Start menu, pengelola jendela.
2. **Kernel layanan:** registri app, pengelola proses, pengelola izin, bus pesan.
3. **Virtual File System:** lapisan abstraksi di atas OPFS/IndexedDB dan penyimpanan jarak jauh.
4. **Pengelola setelan:** skema setelan bertipe dengan migrasi versi.
5. **Store:** katalog, manifest, instalasi, dan pembaruan app.
6. **Sinkronisasi:** antrean perubahan, penyelesaian konflik, dan enkripsi dalam perjalanan.

## 11. Model Data (Ringkas)

- **Setting:** kunci, nilai, versi skema, waktu ubah.
- **App:** id, nama, ikon, versi, jenis (bawaan, web, pihak ketiga), URL atau paket, izin, mode buka, sumber, lisensi.
- **Shortcut:** id app, posisi (x, y), nama kustom, lokasi (desktop atau taskbar).
- **WindowState:** id app, posisi, ukuran, status (normal, minimize, maximize), urutan z.
- **File:** id, induk, nama, tipe MIME, ukuran, waktu buat dan ubah, blob atau referensi OPFS, status sampah.
- **User (opsional):** id, email, preferensi sinkron, perangkat terdaftar.

Setiap struktur disimpan dengan nomor versi skema agar migrasi (seperti perubahan nama `helium` menjadi `browser` di BrowOS) dapat dijalankan secara terkontrol.

## 12. Keamanan, Privasi, dan Lisensi

- **Isolasi app:** app pihak ketiga berjalan di iframe `sandbox` pada origin terpisah; tidak boleh membaca penyimpanan shell.
- **Izin:** manifest mendeklarasikan izin (berkas, jaringan, notifikasi, papan klip); pengguna menyetujui saat instal.
- **CSP ketat** pada shell; tidak ada skrip inline; semua dependensi di-pin versinya.
- **Privasi:** tidak ada pelacakan pihak ketiga; analitik bersifat agregat dan opsional; ikon situs diambil lewat proxy sendiri agar host yang dibuka tidak bocor ke layanan luar.
- **Data:** enkripsi saat transit (TLS) dan saat disimpan di server; pengguna dapat menghapus akun dan seluruh data.
- **Konten sponsor:** wajib berlabel jelas.
- **Lisensi dan atribusi:** BrowOS menyertakan komponen pihak ketiga berlisensi MIT (Notepad, Calculator, miniPaint) dan wallpaper dengan lisensi CC0/CC BY 4.0. Setiap komponen yang dipakai ulang harus mempertahankan atribusi dan halaman Credits. Lisensi kode BrowOS sendiri perlu diperiksa dan dipenuhi sebelum menyalin kodenya.

## 13. Metrik Keberhasilan

| Metrik | Target 3 bulan setelah rilis 1.0 |
| --- | --- |
| Pengguna aktif mingguan | 5.000 |
| Retensi minggu ke-4 | 30% |
| Sesi dengan 2 jendela atau lebih | 50% |
| Pengguna yang menyimpan setidaknya 1 berkas di Files | 40% |
| Waktu muat shell (p75) | Di bawah 2 detik |
| Tingkat galat JavaScript per sesi | Di bawah 1% |
| Pengguna yang mengaktifkan sinkronisasi | 15% dari pengguna aktif |
| Skor kepuasan (CSAT) | 4,2 dari 5 |

Angka di atas adalah titik awal untuk didiskusikan, bukan hasil riset pasar.

## 14. Roadmap

| Fase | Durasi perkiraan | Isi |
| --- | --- | --- |
| **0. Fondasi** | 2–3 minggu | Keputusan stack, desain sistem, prototipe window manager, skema data |
| **1. MVP (P0)** | 6–8 minggu | Shell, window manager, taskbar, desktop, penyimpanan IndexedDB, Notepad, Calculator, Clock, Settings, Files dasar |
| **2. Rilis 1.0 (P1)** | 8–10 minggu | Store dan manifest, web app via iframe, Task Manager, personalisasi penuh, akun dan sinkronisasi, ekspor/impor, mode sentuh, pintasan keyboard |
| **3. Pasca 1.0 (P2)** | Berkelanjutan | Browser dalam jendela, multi desktop, SDK dan izin app, Paint, ekosistem pihak ketiga |

Estimasi mengasumsikan tim kecil (2–3 orang) dan perlu divalidasi setelah fase 0.

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Situs populer memblokir iframe | App web terlihat rusak | Daftar situs yang diketahui, fallback tab, komunikasi yang jujur kepada pengguna |
| Kuota penyimpanan browser terbatas atau dihapus | Kehilangan data | Minta `storage.persist()`, indikator kuota, ekspor berkala, sinkronisasi opsional |
| Perbedaan antar-browser (OPFS, memori, popup) | Fitur tidak konsisten | Deteksi fitur, fallback terdokumentasi, uji lintas browser otomatis |
| Performa menurun dengan banyak jendela | Pengalaman buruk | Pemuatan malas, iframe ditangguhkan saat minimize, batas jendela |
| Keamanan app pihak ketiga | Pencurian data | Sandbox, origin terpisah, izin eksplisit, tinjauan katalog |
| Masalah lisensi dan atribusi | Risiko hukum | Inventaris lisensi, halaman Credits otomatis dari manifest |
| Cakupan terlalu luas | Proyek terlambat | Disiplin prioritas P0/P1/P2 dan rilis bertahap |

## 16. Pertanyaan Terbuka

1. Apa nama produk final dan siapa audiens utama yang ingin dituju lebih dulu?
2. Apakah akun dan sinkronisasi masuk rilis 1.0, atau cukup mode lokal dengan ekspor/impor?
3. Apakah kode BrowOS akan dipakai ulang (perlu cek lisensi) atau ditulis ulang dari nol dengan BrowOS sebagai referensi?
4. Apakah app pihak ketiga perlu didukung sejak awal, atau katalog tertutup dulu?
5. Model bisnis: gratis, freemium (penyimpanan sinkron berbayar), atau penempatan sponsor di Store?
6. Seberapa penting dukungan ponsel dibanding desktop dan tablet?
7. Apakah ada kebutuhan khusus seperti mode kiosk untuk sekolah atau warnet?

## Lampiran A. Daftar Berkas BrowOS yang Dianalisis

`manifest.json`, `index.html`, `CHANGELOG.md`, `js/apps.js`, `js/app-list.js`, `js/browstore.js`, `js/windows.js`, `js/floating-windows.js`, `js/update.js`, `js/task-manager.js`, `js/files.js`, `js/shortcuts.js`, `js/wallpaper.js`, serta struktur folder `css/`, `apps/`, dan `icons/`.
