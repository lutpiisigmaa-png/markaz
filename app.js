// ============================================================================
// MARKAZ AT-TA'ALLUM - APPLICATION CONTROLLER (app.js)
// ============================================================================

import {
  getUsers,
  saveUsers,
  getAnnouncements,
  saveAnnouncements,
  getVideos,
  saveVideos,
  getSession,
  setSession,
  clearSession,
  generateNia,
  createId,
  formatDate,
  escapeHtml,
  ALL_CLASSES,
  STUDENT_TIERS,
  BRAND_LOGO_SVG,
  MARKAZ_INFO,
  saveLargeVideoFile,
  getLargeVideoUrl,
  deleteLargeVideoFile,
  toEmbedUrl
} from './config.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const page = document.body.dataset.page;

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'SA';

function injectOfficialLogo() {
  $$('.brand-mark').forEach((node) => {
    node.innerHTML = BRAND_LOGO_SVG;
  });
}

function showToast(message, type = 'info') {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const item = document.createElement('div');
  item.className = `toast-item ${type}`;
  item.textContent = message;
  container.appendChild(item);

  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    item.style.transition = '0.25s ease';
    setTimeout(() => item.remove(), 260);
  }, 3600);
}

function populateClassSelects() {
  $$('#reg-class, #video-class').forEach((select) => {
    if (!select) return;
    const hasPlaceholder = select.id === 'reg-class';
    select.innerHTML =
      (hasPlaceholder ? '<option value="">Pilih program / kelas</option>' : '') +
      ALL_CLASSES.map((cls) => `<option value="${escapeHtml(cls)}">${escapeHtml(cls)}</option>`).join('');
  });

  const params = new URLSearchParams(location.search);
  const picked = params.get('program');
  if (picked && $('#reg-class')) {
    $('#reg-class').value = picked;
  }
}

const setMessage = (node, text) => {
  if (!node) return;
  node.textContent = text;
  node.classList.add('show');
};

const clearMessage = (node) => {
  if (!node) return;
  node.textContent = '';
  node.classList.remove('show');
};

const publishedAnnouncements = () =>
  getAnnouncements()
    .filter((item) => item.published !== false)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

function announcementCard(item) {
  return `
    <article class="announcement-card">
      <div class="announcement-meta">${escapeHtml(item.category || 'Informasi')} • ${escapeHtml(formatDate(item.createdAt))}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
    </article>`;
}

function announcementRow(item, deletable = false) {
  return `
    <article class="announcement-row">
      <div>
        <small>${escapeHtml(item.category || 'Informasi')} • ${escapeHtml(formatDate(item.createdAt))}</small>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.body)}</p>
      </div>
      ${
        deletable
          ? `<button class="btn btn-danger btn-sm" type="button" data-delete-announcement="${escapeHtml(item.id)}">Hapus</button>`
          : ''
      }
    </article>`;
}

function videoCard(video, admin = false) {
  const url = video.url || '';
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const thumbStyle = ytMatch
    ? `style="background-image: linear-gradient(rgba(20,44,67,0.35), rgba(20,44,67,0.55)), url('https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg')"`
    : '';

  return `
    <article class="video-card">
      <div class="video-thumb" ${thumbStyle} data-play-video="${escapeHtml(video.id)}" title="Klik untuk memperbesar layar belajar"></div>
      <div class="video-info">
        <span class="badge active">${escapeHtml(video.classLevel)}</span>
        <span class="badge">${escapeHtml(video.teacher || 'Asatidzah Markaz')}</span>
        <h3 style="margin-top:8px">${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.description || "Materi pembelajaran resmi Markaz At-Ta'allum.")}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:10px;">
          <button class="btn btn-sm" type="button" data-play-video="${escapeHtml(video.id)}">
            ▶ Putar Layar Besar
          </button>
          ${
            admin
              ? `<button class="btn btn-danger btn-sm" type="button" data-delete-video="${escapeHtml(video.id)}">Hapus</button>`
              : ''
          }
        </div>
      </div>
    </article>`;
}

async function openCinemaPlayer(videoId) {
  const video = getVideos().find((v) => v.id === videoId);
  if (!video) return;

  let modal = $('#cinema-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cinema-modal';
    modal.className = 'cinema-overlay';
    document.body.appendChild(modal);
  }

  const url = video.url || '';
  const isIndexedDb = url.startsWith('idb://');
  const isDirectVideo = url.startsWith('data:video/') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  const embedUrl = toEmbedUrl(url);

  let playerHtml = '';
  if (isIndexedDb) {
    const blobUrl = await getLargeVideoUrl(url.replace('idb://', ''));
    playerHtml = blobUrl
      ? `<video src="${blobUrl}" controls autoplay playsinline></video>`
      : `<div style="color:#fff;display:grid;place-items:center;height:100%">File video lokal tidak ditemukan.</div>`;
  } else if (isDirectVideo) {
    playerHtml = `<video src="${escapeHtml(url)}" controls autoplay playsinline></video>`;
  } else if (embedUrl) {
    playerHtml = `<iframe src="${escapeHtml(embedUrl)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  } else {
    playerHtml = `<div style="color:#fff;display:grid;place-items:center;height:100%;padding:20px;text-align:center">Format tautan ini tidak mendukung pemutaran di dalam layar. Silakan klik tombol Buka di YouTube/Tab Baru di bawah.</div>`;
  }

  modal.innerHTML = `
    <div class="cinema-box" role="dialog" aria-modal="true">
      <div class="cinema-header">
        <div>
          <span class="badge active" style="margin-bottom:4px">${escapeHtml(video.classLevel)}</span>
          <h3>${escapeHtml(video.title)}</h3>
        </div>
        <button type="button" class="cinema-close" id="close-cinema-btn">✕ Tutup Layar</button>
      </div>
      <div class="cinema-stage">
        ${playerHtml}
      </div>
      <div class="cinema-footer">
        <div>
          <strong>Pengajar: ${escapeHtml(video.teacher || 'Asatidzah Markaz')}</strong>
          <p>${escapeHtml(video.description || 'Simak dan catat poin penting dari materi pembelajaran ini.')}</p>
        </div>
        ${
          /^https?:\/\//i.test(url)
            ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(url)}" target="_blank" rel="noopener">Buka di YouTube / Tab Baru ↗</a>`
            : ''
        }
      </div>
    </div>`;

  requestAnimationFrame(() => modal.classList.add('open'));
const closeModal = () => {
    modal.classList.remove('open');
    setTimeout(() => {
      modal.innerHTML = '';
    }, 280);
  };

  $('#close-cinema-btn', modal)?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

document.addEventListener('click', (e) => {
  const playBtn = e.target.closest('[data-play-video]');
  if (playBtn) {
    openCinemaPlayer(playBtn.dataset.playVideo);
  }
});

async function hydrateIndexedDbVideos() {
  const nodes = $$('video[data-idb-video]');
  for (const videoEl of nodes) {
    const key = videoEl.dataset.idbVideo;
    const blobUrl = await getLargeVideoUrl(key);
    if (blobUrl) {
      videoEl.src = blobUrl;
    }
  }
}

function initLanding() {
  const yearNode = $('#year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();
  const host = $('#public-announcements');
  if (!host) return;
  const items = publishedAnnouncements().slice(0, 3);
  host.innerHTML = items.length
    ? items.map(announcementCard).join('')
    : '<div class="announcement-card"><p>Belum ada pengumuman terbaru.</p></div>';
}

function initRegister() {
  populateClassSelects();
  const form = $('#register-form');
  const message = $('#register-message');
  if (!form) return;

  const initialClass = $('#reg-class')?.value || '';
  if ($('#reg-nia')) $('#reg-nia').value = generateNia(initialClass);

  $('#reg-class')?.addEventListener('change', (e) => {
    if ($('#reg-nia')) $('#reg-nia').value = generateNia(e.target.value);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage(message);
    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const email = String(data.get('email')).trim().toLowerCase();
    const phone = String(data.get('phone')).trim();
    const password = String(data.get('password'));
    const chosenClass = String(data.get('classLevel'));

    if (password !== String(data.get('confirmPassword'))) {
      return setMessage(message, 'Kata sandi dan konfirmasi tidak sama.');
    }
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return setMessage(message, 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
    }
    if (!name || !phone) {
      return setMessage(message, 'Lengkapi semua data terlebih dahulu.');
    }

    const user = {
      id: createId('student'),
      nia: generateNia(chosenClass),
      name,
      email,
      phone,
      password,
      role: 'student',
      status: 'pending',
      classLevel: chosenClass,
      tier: 'Tahap Mau',
      createdAt: new Date().toISOString()
    };

    if (!saveUsers([...users, user])) {
      return setMessage(message, 'Data belum dapat disimpan di browser.');
    }

    showToast('Pendaftaran terkirim! Menunggu verifikasi Admin.', 'success');
    form.innerHTML = `
      <div class="form-success">
        <strong>Marhaban Bikum! Pendaftaran berhasil dikirim.</strong><br>
        NIA Sementara Anda: <strong>${escapeHtml(user.nia)}</strong> (${escapeHtml(user.classLevel)}).<br>
        Akun Anda sedang ditinjau Admin Markaz At-Ta'allum. Setelah diaktifkan, Admin akan mengirimkan konfirmasi ke WhatsApp Anda.
      </div>
      <a class="btn full" href="login.html">Ke Halaman Masuk →</a>`;
  });
}

function initLogin() {
  const form = $('#login-form');
  const message = $('#login-message');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage(message);
    const data = new FormData(form);
    const identifier = String(data.get('email')).trim().toLowerCase();
    const password = String(data.get('password'));

    const user = getUsers().find(
      (item) =>
        (item.email.toLowerCase() === identifier ||
          item.nia.toLowerCase() === identifier ||
          (item.role === 'admin' && (identifier === 'admin' || identifier === 'attaallumy@gmail.com'))) &&
        item.password === password
    );

    if (!user) {
      return setMessage(message, 'Email/NIA atau kata sandi tidak sesuai. Periksa kembali.');
    }
    if (user.status !== 'active') {
      return setMessage(
        message,
        user.status === 'pending'
          ? 'Pendaftaranmu masih menunggu verifikasi Admin Markaz.'
          : 'Akun ini belum aktif. Silakan hubungi WhatsApp Admin (+20 155 101 8457).'
      );
    }

    setSession({ userId: user.id, role: user.role, signedInAt: new Date().toISOString() });
    showToast(`Ahlan wa Sahlan, ${user.name}!`, 'success');
    location.href = user.role === 'admin' ? 'admin-dash.html' : 'student-dash.html';
  });
}

function requireUser(role) {
  const session = getSession();
  const user = session && getUsers().find((item) => item.id === session.userId);
  if (!user || user.status !== 'active' || (role && user.role !== role)) {
    clearSession();
    location.replace('login.html');
    return null;
  }
  return user;
}

function attachLogout() {
  $$('[data-logout]').forEach((button) =>
    button.addEventListener('click', () => {
      clearSession();
      location.href = 'login.html';
    })
  );
}

function setUserLabels(user) {
  $$('[data-user-name]').forEach((node) => (node.textContent = user.name));
  $$('[data-user-nia]').forEach((node) => (node.textContent = user.nia));
  $$('[data-avatar]').forEach((node) => (node.textContent = initials(user.name)));
  const firstName = $('[data-first-name]');
  if (firstName) firstName.textContent = user.name.trim().split(/\s+/)[0];
}

function initStudent() {
  const user = requireUser('student');
  if (!user) return;
  attachLogout();
  setUserLabels(user);

  $$('[data-class-level]').forEach((node) => (node.textContent = user.classLevel || 'Program Qobul'));
  if ($('[data-nia-short]')) $('[data-nia-short]').textContent = user.nia;
  if ($('[data-student-tier]')) $('[data-student-tier]').textContent = user.tier || 'Tahap Tekad';

  const videos = getVideos()
    .filter((video) => video.classLevel === user.classLevel)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  $('#student-video-count').textContent = videos.length;
  $('#student-videos').innerHTML = videos.length
    ? videos.map((video) => videoCard(video)).join('')
    : `<div class="panel empty-state" style="grid-column:1/-1">Belum ada rekaman video untuk program <strong>${escapeHtml(user.classLevel)}</strong>. Asatidzah akan segera mengunggah materi terbaru.</div>`;

  $('#student-video-filters').innerHTML = `
    <span class="filter-chip active">Program: ${escapeHtml(user.classLevel)}</span>
    <span class="filter-chip">Level: ${escapeHtml(user.tier || 'Tahap Mau')}</span>`;

  const announcements = publishedAnnouncements();
  $('#student-announcements').innerHTML = announcements.length
    ? announcements.map((item) => announcementRow(item)).join('')
    : '<div class="panel empty-state">Belum ada pengumuman terbaru.</div>';

  hydrateIndexedDbVideos();
}

function initAdmin() {
  const admin = requireUser('admin');
  if (!admin) return;
  attachLogout();
  populateClassSelects();
  renderAdmin();

  $('#student-search')?.addEventListener('input', renderStudents);
  $('#student-status-filter')?.addEventListener('change', renderStudents);
  $('#export-csv')?.addEventListener('click', exportStudents);
  $('#announcement-form')?.addEventListener('submit', publishAnnouncement);
  $('#video-form')?.addEventListener('submit', addVideo);

  document.addEventListener('click', (event) => {
    const statusButton = event.target.closest('[data-student-action]');
    if (statusButton) updateStudent(statusButton.dataset.studentId, statusButton.dataset.studentAction);

    const announcementButton = event.target.closest('[data-delete-announcement]');
    if (announcementButton) deleteAnnouncement(announcementButton.dataset.deleteAnnouncement);

    const videoButton = event.target.closest('[data-delete-video]');
    if (videoButton) deleteVideo(videoButton.dataset.deleteVideo);

    const editNiaNode = event.target.closest('[data-edit-nia]');
    if (editNiaNode) {
      const users = getUsers();
      const idx = users.findIndex((u) => u.id === editNiaNode.dataset.editNia);
      if (idx >= 0) {
        const customNia = prompt(`Ubah NIA untuk ${users[idx].name}:`, users[idx].nia);
        if (customNia && customNia.trim()) {
          users[idx].nia = customNia.trim();
          saveUsers(users);
          renderAdmin();
          showToast('NIA berhasil diperbarui!', 'success');
        }
      }
    }
  });

  document.addEventListener('change', (event) => {
    const tierSelect = event.target.closest('[data-tier-student]');
    if (tierSelect) updateStudentTier(tierSelect.dataset.tierStudent, tierSelect.value);
  });
}

function renderAdmin() {
  const students = getUsers().filter((user) => user.role === 'student');
  const videos = getVideos();
  $('#stat-total').textContent = students.length;
  $('#stat-pending').textContent = students.filter((user) => user.status === 'pending').length;
  $('#stat-active').textContent = students.filter((user) => user.status === 'active').length;
  $('#stat-videos').textContent = videos.length;

  renderStudents();

  const announcements = publishedAnnouncements();
  $('#admin-announcements').innerHTML = announcements.length
    ? announcements.map((item) => announcementRow(item, true)).join('')
    : '<div class="empty-state">Belum ada pengumuman aktif.</div>';

  $('#admin-videos').innerHTML = videos.length
    ? videos.map((video) => videoCard(video, true)).join('')
    : '<div class="empty-state" style="grid-column:1/-1">Belum ada materi video.</div>';

  hydrateIndexedDbVideos();
}

function renderStudents() {
  const body = $('#students-table');
  if (!body) return;
  const query = ($('#student-search')?.value || '').trim().toLowerCase();
  const status = $('#student-status-filter')?.value || 'all';

  const rows = getUsers()
    .filter((user) => user.role === 'student')
    .filter((user) => status === 'all' || user.status === status)
    .filter((user) => `${user.name} ${user.nia} ${user.email} ${user.classLevel}`.toLowerCase().includes(query))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  body.innerHTML = rows.length
    ? rows
        .map((user) => {
          const tierOptions = STUDENT_TIERS.map(
            (t) => `<option value="${t}" ${user.tier === t ? 'selected' : ''}>${t}</option>`
          ).join('');

          const action =
            user.status === 'pending'
              ? `<button class="btn btn-sm" data-student-action="active" data-student-id="${escapeHtml(user.id)}">Setujui</button>
                 <button class="btn btn-danger btn-sm" data-student-action="rejected" data-student-id="${escapeHtml(user.id)}">Tolak</button>`
              : user.status === 'active'
              ? `<a class="btn btn-secondary btn-sm" target="_blank" rel="noopener" href="${whatsappLink(user)}">Kirim WA ↗</a>
                 <button class="btn btn-danger btn-sm" data-student-action="pending" data-student-id="${escapeHtml(user.id)}">Nonaktifkan</button>`
              : `<button class="btn btn-sm" data-student-action="active" data-student-id="${escapeHtml(user.id)}">Aktifkan</button>`;

          return `
            <tr>
              <td>
                <span class="table-name">${escapeHtml(user.name)}</span><br>
                <small>${escapeHtml(user.email)} • ${escapeHtml(user.phone || '-')}</small>
              </td>
              <td>
                <strong style="cursor:pointer;border-bottom:1px dashed var(--blue)" title="Klik untuk ubah NIA" data-edit-nia="${escapeHtml(user.id)}">
                  ${escapeHtml(user.nia)} ✎
                </strong>
              </td>
              <td>
                ${escapeHtml(user.classLevel || '-')}<br>
                <select data-tier-student="${escapeHtml(user.id)}" style="margin-top:4px;font-size:10px;padding:3px 6px;border-radius:6px;border:1px solid var(--line)">
                  ${tierOptions}
                </select>
              </td>
              <td>${escapeHtml(formatDate(user.createdAt))}</td>
              <td><span class="badge ${escapeHtml(user.status)}">${statusLabel(user.status)}</span></td>
              <td><div class="table-actions">${action}</div></td>
            </tr>`;
        })
        .join('')
    : '<tr><td colspan="6"><div class="empty-state">Belum ada data santri yang cocok.</div></td></tr>';
}

function statusLabel(status) {
  return { pending: 'Menunggu', active: 'Aktif', rejected: 'Ditolak' }[status] || status;
}

function whatsappLink(user) {
  const phone = String(user.phone || '').replace(/\D/g, '').replace(/^0/, '62');
  const loginUrl = `${location.origin}${location.pathname.replace(/admin-dash\.html$/, 'login.html')}`;
  const text =
    `Assalamu'alaikum warahmatullahi wabarakatuh ${user.name},\n\n` +
    `Marhaban Bikum di *Markaz At-Ta'allum* (${MARKAZ_INFO.location}). Pendaftaran Anda telah *DISETUJUI*.\n\n` +
    `📌 *Detail Akun Akademik:*\n` +
    `• NIA: *${user.nia}*\n` +
    `• Program/Kelas: *${user.classLevel}*\n` +
    `• Tahap Saat Ini: *${user.tier || 'Tahap Mau'}*\n` +
    `• Email Login: ${user.email}\n` +
    `• Kata Sandi: ${user.password}\n\n` +
    `Silakan masuk ke portal pembelajaran kami:\n${loginUrl}\n\n` +
    `_Menerangi Ilmu dengan Hati_`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function updateStudent(id, status) {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === id && user.role === 'student');
  if (index < 0) return;
  users[index].status = status;
  if (!saveUsers(users)) return showToast('Gagal menyimpan perubahan.', 'error');
  renderAdmin();
  showToast(`Status santri ${users[index].name} diperbarui menjadi ${statusLabel(status)}.`, 'success');

  if (status === 'active') {
    const user = users[index];
    if (user.phone && confirm(`Santri ${user.name} telah aktif. Buka WhatsApp sekarang untuk mengirim akses akun?`)) {
      window.open(whatsappLink(user), '_blank', 'noopener');
    }
  }
}

function updateStudentTier(id, newTier) {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index < 0) return;
  users[index].tier = newTier;
  saveUsers(users);
  showToast(`Tahap perkembangan ${users[index].name} diubah ke ${newTier}.`, 'success');
}

function publishAnnouncement(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const announcement = {
    id: createId('announcement'),
    title: String(data.get('title')).trim(),
    body: String(data.get('body')).trim(),
    category: String(data.get('category')),
    createdAt: $('#announcement-date').value
      ? new Date(`${$('#announcement-date').value}T12:00:00`).toISOString()
      : new Date().toISOString(),
    published: true
  };
  if (!announcement.title || !announcement.body) return;
  if (!saveAnnouncements([announcement, ...getAnnouncements()])) {
    return showToast('Pengumuman gagal disimpan.', 'error');
  }
  form.reset();
  renderAdmin();
  showToast('Pengumuman berhasil diterbitkan!', 'success');
}

function deleteAnnouncement(id) {
  if (!confirm('Hapus pengumuman ini?')) return;
  saveAnnouncements(getAnnouncements().filter((item) => item.id !== id));
  renderAdmin();
  showToast('Pengumuman dihapus.', 'info');
}

async function addVideo(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = $('#video-file')?.files[0];
  let url = String(data.get('url') || '').trim();
  const videoId = createId('video');

  if (file) {
    if (!file.type.startsWith('video/')) {
      return showToast('Pilih format file video yang valid (MP4/WebM/MKV).', 'error');
    }
    try {
      showToast('Menyimpan file video berukuran besar ke Vault lokal...', 'info');
      await saveLargeVideoFile(videoId, file);
      url = `idb://${videoId}`;
    } catch (error) {
      return showToast('Gagal menyimpan video ke IndexedDB: ' + error.message, 'error');
    }
  }

  if (!url) {
    return showToast('Masukkan URL video (YouTube/GDrive) atau pilih file video dari perangkat.', 'error');
  }

  const video = {
    id: videoId,
    title: String(data.get('title')).trim(),
    description: String(data.get('description') || '').trim(),
    classLevel: String(data.get('classLevel')),
    teacher: String(data.get('teacher') || 'Asatidzah Markaz').trim(),
    url,
    createdAt: new Date().toISOString()
  };

  const videos = getVideos();
  if (!saveVideos([video, ...videos])) {
    return showToast('Materi gagal disimpan.', 'error');
  }

  form.reset();
  renderAdmin();
  showToast(`Materi "${video.title}" berhasil disimpan untuk kelas ${video.classLevel}!`, 'success');
}

async function deleteVideo(id) {
  if (!confirm('Hapus materi video ini?')) return;
  await deleteLargeVideoFile(id);
  saveVideos(getVideos().filter((video) => video.id !== id));
  renderAdmin();
  showToast('Materi video dihapus.', 'info');
}

function exportStudents() {
  const students = getUsers().filter((user) => user.role === 'student');
  const rows = [
    ['NIA', 'Nama Lengkap', 'Email', 'WhatsApp', 'Program / Kelas', 'Tahap (Mau-Sadar-Tekad)', 'Status', 'Tanggal Daftar'],
    ...students.map((user) => [
      user.nia,
      user.name,
      user.email,
      user.phone,
      user.classLevel,
      user.tier || 'Tahap Mau',
      statusLabel(user.status),
      formatDate(user.createdAt)
    ])
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Database-Santri-Attaallum-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('File CSV berhasil diunduh untuk Google Spreadsheet!', 'success');
}

injectOfficialLogo();
if (page === 'landing') initLanding();
if (page === 'register') initRegister();
if (page === 'login') initLogin();
if (page === 'student') initStudent();
if (page === 'admin') initAdmin();