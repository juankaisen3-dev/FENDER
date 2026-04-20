// Configuration
const API_BASE = '/api'; // À adapter si backend sur un autre port

// État global
let currentVideoInfo = null;
let selectedQuality = 'medium';

// DOM Elements
const elements = {
  urlInput: document.getElementById('videoUrl'),
  fetchBtn: document.getElementById('fetchInfoBtn'),
  infoPanel: document.getElementById('infoPanel'),
  thumbnail: document.getElementById('thumbnail'),
  videoTitle: document.getElementById('videoTitle'),
  duration: document.getElementById('duration'),
  uploader: document.getElementById('uploader'),
  qualityBtns: document.querySelectorAll('.quality-btn'),
  downloadBtn: document.getElementById('downloadBtn'),
  downloadStatus: document.getElementById('downloadStatus'),
  gallery: document.getElementById('gallery'),
  refreshBtn: document.getElementById('refreshGalleryBtn')
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  setupEventListeners();
});

function setupEventListeners() {
  elements.fetchBtn.addEventListener('click', fetchVideoInfo);
  elements.downloadBtn.addEventListener('click', startDownload);
  elements.refreshBtn.addEventListener('click', loadGallery);
  
  elements.qualityBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.qualityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedQuality = btn.dataset.quality;
    });
  });

  // Touche Entrée dans l'input
  elements.urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchVideoInfo();
  });
}

// ========== API Calls ==========
async function fetchVideoInfo() {
  const url = elements.urlInput.value.trim();
  if (!url) {
    showToast('Veuillez entrer une URL', 'error');
    return;
  }

  showToast('Analyse de la vidéo...', 'info');
  elements.fetchBtn.disabled = true;
  elements.fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyse...';

  try {
    const response = await fetch(`${API_BASE}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) throw new Error('URL non supportée ou serveur indisponible');
    
    const data = await response.json();
    currentVideoInfo = data;
    
    // Mettre à jour l'interface
    elements.thumbnail.src = data.thumbnail || 'https://via.placeholder.com/160x90/2a1f4c/a78bfa?text=No+Preview';
    elements.videoTitle.textContent = data.title || 'Titre inconnu';
    elements.duration.innerHTML = `<i class="far fa-clock"></i> ${formatDuration(data.duration)}`;
    elements.uploader.innerHTML = `<i class="far fa-user"></i> ${data.uploader || 'Inconnu'}`;
    
    elements.infoPanel.classList.remove('hidden');
    elements.downloadStatus.textContent = '';
    
    showToast('Vidéo analysée avec succès', 'success');
  } catch (error) {
    showToast(error.message, 'error');
    elements.infoPanel.classList.add('hidden');
  } finally {
    elements.fetchBtn.disabled = false;
    elements.fetchBtn.innerHTML = '<i class="fas fa-magnifying-glass"></i> Analyser';
  }
}

async function startDownload() {
  if (!currentVideoInfo) {
    showToast('Analysez d\'abord une vidéo', 'error');
    return;
  }

  const url = elements.urlInput.value.trim();
  elements.downloadBtn.disabled = true;
  elements.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
  elements.downloadStatus.textContent = '⏳ Démarrage du téléchargement...';

  try {
    const response = await fetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality: selectedQuality })
    });

    const data = await response.json();
    
    if (response.ok) {
      elements.downloadStatus.innerHTML = `<i class="fas fa-check-circle" style="color:#6ee7b7;"></i> ${data.message || 'Téléchargement lancé !'}`;
      showToast('Téléchargement démarré !', 'success');
      
      // Réinitialiser après un court délai
      setTimeout(() => {
        elements.infoPanel.classList.add('hidden');
        elements.urlInput.value = '';
        currentVideoInfo = null;
      }, 2000);
      
      // Rafraîchir la galerie après quelques secondes
      setTimeout(loadGallery, 4000);
    } else {
      throw new Error(data.error || 'Erreur serveur');
    }
  } catch (error) {
    elements.downloadStatus.textContent = `❌ ${error.message}`;
    showToast(error.message, 'error');
  } finally {
    elements.downloadBtn.disabled = false;
    elements.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Télécharger';
  }
}

async function loadGallery() {
  try {
    const response = await fetch(`${API_BASE}/videos`);
    const videos = await response.json();
    
    if (videos.length === 0) {
      elements.gallery.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-video-slash"></i>
          <p>Aucune vidéo pour le moment</p>
        </div>
      `;
      return;
    }

    elements.gallery.innerHTML = videos.map(video => `
      <div class="video-card">
        <div class="video-thumb">
          <i class="fas fa-film"></i>
        </div>
        <div class="video-info">
          <h4 title="${video.name}">${video.name}</h4>
          <div class="video-meta">
            <span><i class="far fa-hdd"></i> ${video.size}</span>
            <span><i class="far fa-calendar"></i> ${new Date(video.date).toLocaleDateString()}</span>
          </div>
          <div class="video-actions">
            <a href="${video.url}" download class="btn-icon" title="Télécharger">
              <i class="fas fa-download"></i>
            </a>
            <button class="btn-icon delete-btn" data-filename="${encodeURIComponent(video.name)}" title="Supprimer">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attacher les événements de suppression
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const filename = btn.dataset.filename;
        deleteVideo(filename);
      });
    });

  } catch (error) {
    console.error('Erreur galerie:', error);
    showToast('Impossible de charger la bibliothèque', 'error');
  }
}

async function deleteVideo(filename) {
  if (!confirm('Supprimer définitivement cette vidéo ?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/videos/${filename}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      showToast('Vidéo supprimée', 'success');
      loadGallery();
    } else {
      throw new Error('Échec de la suppression');
    }
  } catch (error) {
    showToast('Erreur lors de la suppression', 'error');
  }
}

// ========== Utilitaires ==========
function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  
  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}