// ============================================================================
// MARKAZ AT-TA'ALLUM - DATA LAYER & INDEXED-DB VIDEO ENGINE (config.js)
// Lokasi: Hayy Sabik, Kairo | Membimbing Generasi dengan Ilmu dan Adab
// ============================================================================

export const STORAGE_KEYS = {
  users: 'mat_users_v4',
  announcements: 'mat_announcements_v4',
  videos: 'mat_videos_v4',
  session: 'mat_session_v4'
};

export const MARKAZ_INFO = {
  name: "Markaz At-Ta'allum",
  tagline: "Membimbing Generasi dengan Ilmu dan Adab",
  motto: "Menerangi Ilmu dengan Hati",
  founded: 2024,
  founder: "Hilwah Habibah",
  location: "Hayy Sabik, Kairo, Mesir",
  phone: "+20 155 101 8457",
  whatsappClean: "201551018457",
  email: "attaallumy@gmail.com",
  instagram: "@attaallumarkaz",
  spreadsheetWebhookUrl: ""
};

export const PROGRAM_CATALOG = {
  "Program Unggulan": [
    "Program Qobul",
    "Musabaqoh I'dady",
    "Musabaqoh / Mu'adalah Tsanawi",
    "Lughoh Azhary"
  ],
  "Program Istimewa": [
    "Matan Ajrumiyyah",
    "Mawaris",
    "Mantiq",
    "Tajwid",
    "Bahasa Ammiyyah",
    "Materi Umum"
  ],
  "Program Privat": [
    "Privat Materi Khusus"
  ]
};

export const ALL_CLASSES = [
  "Program Qobul",
  "Musabaqoh I'dady",
  "Musabaqoh / Mu'adalah Tsanawi",
  "Lughoh Azhary",
  "I'dadi 1",
  "I'dadi 2",
  "Tsanawi 1",
  "Tsanawi 2",
  "Matan Ajrumiyyah",
  "Mawaris & Mantiq",
  "Tajwid & Ammiyyah",
  "Privat Materi Khusus"
];

export const STUDENT_TIERS = ["Tahap Mau", "Tahap Sadar", "Tahap Tekad"];

export const BRAND_LOGO_SVG = `
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
  <path d="M26 48C36 46 46 47 54 51V25C46 21 36 20 26 22" stroke="#1677C8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32 42C40 40.5 47 41.5 54 44" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
  <path d="M18 46C10 34 12 20 22 12C16 22 15 34 21 44" fill="#1677C8"/>
  <path d="M18 56C20 40 26 20 38 6C41 16 39 24 34 29C37 29 39 30 35 35C37 36 36 39 31 43C26 47 21 52 18 56Z" fill="url(#featherGrad)"/>
  <defs>
    <linearGradient id="featherGrad" x1="18" y1="6" x2="38" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#EA580C"/>
    </linearGradient>
  </defs>
</svg>`;

const now = () => new Date().toISOString();

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Gagal membaca data lokal (${key})`, error);
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan data lokal (${key})`, error);
    return false;
  }
};

// ============================================================================
// INDEXED-DB ENGINE UNTUK UPLOAD FILE VIDEO BESAR (> 3 MB hingga Ratusan MB)
// ============================================================================
const DB_NAME = 'MarkazVideoVaultDB';
const STORE_NAME = 'videoFiles';

function openVideoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLargeVideoFile(id, fileBlob) {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(fileBlob, id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLargeVideoUrl(id) {
  try {
    const db = await openVideoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => {
        if (req.result) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteLargeVideoFile(id) {
  try {
    const db = await openVideoDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (e) {
    console.warn('Gagal menghapus file video dari IndexedDB', e);
  }
}

// ============================================================================
// SEED DATA ASLI DARI BOOKLET MARKAZ AT-TA'ALLUM
// ============================================================================
function seedData() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    write(STORAGE_KEYS.users, [
      {
        id: 'admin-demo',
        nia: 'MAT-ADMIN-001',
        name: "Admin Markaz At-Ta'allum",
        email: 'admin@markaz.test',
        phone: '201551018457',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        classLevel: 'Admin',
        tier: 'Tahap Tekad',
        createdAt: now()
      },
      {
        id: 'student-demo-1',
        nia: 'MAT-QBL-26-001 (Draft)',
        name: 'Ahmad Hijazil Mumtaz',
        email: 'santri@markaz.test',
        phone: '6281234567891',
        password: 'santri123',
        role: 'student',
        status: 'active',
        classLevel: 'Program Qobul',
        packageType: 'Program Unggulan',
        tier: 'Tahap Tekad',
        createdAt: now()
      },
      {
        id: 'student-demo-2',
        nia: 'MAT-MTS-26-002 (Draft)',
        name: 'Adinda Dania Sabrina',
        email: 'adinda@markaz.test',
        phone: '6281234567892',
        password: 'santri123',
        role: 'student',
        status: 'active',
        classLevel: "Musabaqoh / Mu'adalah Tsanawi",
        packageType: 'Program Unggulan',
        tier: 'Tahap Sadar',
        createdAt: now()
      }
    ]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.announcements)) {
    write(STORAGE_KEYS.announcements, [
      {
        id: 'ann-1',
        title: 'Pembukaan Pendaftaran Program Qobul & Musabaqoh',
        body: "Marhaban Bikum! Pendaftaran santri baru untuk Program Qobul, Musabaqoh I'dady, dan Mu'adalah Tsanawi di Hayy Sabik, Kairo telah dibuka. Dapatkan modul pembelajaran eksklusif dan bimbingan intensif.",
        category: 'Pendaftaran',
        createdAt: now(),
        published: true
      },
      {
        id: 'ann-2',
        title: 'Kelas Program Istimewa: Matan Ajrumiyyah & Mantiq',
        body: 'Bagi pelajar yang ingin memperkuat fondasi keilmuan Turats dan Bahasa Arab (Lughoh Azhary, Mawaris, Tajwid, dan Ammiyyah), kelas pekan ini dilaksanakan di ruang ber-AC Markaz.',
        category: 'Akademik',
        createdAt: now(),
        published: true
      },
      {
        id: 'ann-3',
        title: 'Pesan Founder: Menerangi Ilmu dengan Hati',
        body: 'Setiap anak memiliki potensi besar. Melalui tahapan Mau, Sadar, dan Tekad, mari tumbuh bersama dalam ilmu, adab, dan rasa percaya diri.',
        category: 'Informasi',
        createdAt: now(),
        published: true
      }
    ]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.videos)) {
    write(STORAGE_KEYS.videos, [
      {
        id: 'vid-1',
        title: 'Persiapan Imtihan Qobul: Kaidah Dasar & Strategi Ujian',
        description: "Pembahasan poin-poin inti yang sering keluar dalam Imtihan Qobul penentuan I'dadi dan Tsanawi.",
        classLevel: 'Program Qobul',
        teacher: "Tim Pengajar At-Ta'allum",
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        createdAt: now()
      },
      {
        id: 'vid-2',
        title: 'Dirosah Khossoh & Lughoh Azhary — Pertemuan 1',
        description: 'Fokus peningkatan kemahiran Bahasa Arab dengan metode interaktif, hangat, dan mudah dipahami.',
        classLevel: 'Program Qobul',
        teacher: 'Asatidzah Markaz',
        url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        createdAt: now()
      },
      {
        id: 'vid-3',
        title: "Bedah Materi Musabaqoh & Mu'adalah Tsanawi",
        description: "Rangkuman materi akselerasi dari 2 I'dadi ke 1 Tsanawi serta persiapan menuju Universitas Al-Azhar.",
        classLevel: "Musabaqoh / Mu'adalah Tsanawi",
        teacher: "Tim Mu'adalah",
        url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        createdAt: now()
      },
      {
        id: 'vid-4',
        title: 'Pengantar Matan Ajrumiyyah: Pembagian Kalam',
        description: 'Program Istimewa penguatan dasar Nahwu bagi pelajar.',
        classLevel: 'Matan Ajrumiyyah',
        teacher: 'Ustadz Pengampu',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        createdAt: now()
      }
    ]);
  }
}

seedData();

export const getUsers = () => read(STORAGE_KEYS.users, []);
export const saveUsers = (users) => write(STORAGE_KEYS.users, users);
export const getAnnouncements = () => read(STORAGE_KEYS.announcements, []);
export const saveAnnouncements = (items) => write(STORAGE_KEYS.announcements, items);
export const getVideos = () => read(STORAGE_KEYS.videos, []);
export const saveVideos = (items) => write(STORAGE_KEYS.videos, items);
export const getSession = () => read(STORAGE_KEYS.session, null);
export const setSession = (session) => write(STORAGE_KEYS.session, session);
export const clearSession = () => localStorage.removeItem(STORAGE_KEYS.session);

export function generateNia(classLevel = '') {
  const yearShort = String(new Date().getFullYear()).slice(-2);
  const codeMap = {
    'Program Qobul': 'QBL',
    "Musabaqoh I'dady": 'MSD',
    "Musabaqoh / Mu'adalah Tsanawi": 'MTS',
    'Lughoh Azhary': 'LGH',
    'Matan Ajrumiyyah': 'AJR'
  };
  const code = codeMap[classLevel] || 'STD';
  const prefix = `MAT-${code}-${yearShort}-`;
  const used = getUsers().map((u) => u.nia || '');
  let serial = getUsers().filter((u) => u.role === 'student').length + 1;
  while (used.some((n) => n.startsWith(`${prefix}${String(serial).padStart(3, '0')}`))) {
    serial += 1;
  }
  return `${prefix}${String(serial).padStart(3, '0')} (Draft)`;
}

export function getYoutubeId(url = '') {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function toEmbedUrl(url = '') {
  if (!url) return '';
  const ytId = getYoutubeId(url);
  if (ytId) return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  return '';
}

export function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', options).format(new Date(value));
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}
