# Markaz At-Ta’allum

Portal akademik dan manajemen pembelajaran internal berbasis HTML, CSS, JavaScript modules, dan `localStorage`.

## Menjalankan

Karena aplikasi menggunakan JavaScript ES modules, jalankan melalui web server lokal (bukan membuka HTML langsung dari `file://`). Contoh:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000` di browser.

## Akun demo

- Admin: `admin@markaz.test` / `admin123`
- Santri aktif (kelas Idadi 1): `santri@markaz.test` / `santri123`

Pendaftaran santri baru akan berstatus menunggu verifikasi. Akun demo admin dapat mengaktifkan pendaftar, lalu mengirim tautan dan informasi akses melalui WhatsApp.

## Catatan data

Data disimpan hanya pada `localStorage` browser yang sedang digunakan. Data tidak tersinkronisasi ke perangkat lain dan dapat hilang saat data browser dihapus. Ini adalah prototipe front-end; autentikasi, kata sandi, unggahan video, dan data santri harus dipindahkan ke backend aman sebelum digunakan dalam operasional nyata. Unggahan video lokal dibatasi hingga 3 MB; untuk konten lebih besar, gunakan URL video yang dapat diakses santri.
