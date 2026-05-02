import { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = "/api";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [quality, setQuality] = useState("medium");
  const [gallery, setGallery] = useState([]);
  const [toasts, setToasts] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("fender_gallery");
    if (saved) setGallery(JSON.parse(saved));
    fetchGallery();
  }, []);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch(`${API_BASE}/videos`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const serverVideos = data.map(v => ({
          id: v.name,
          title: v.name,
          thumbnail: "https://picsum.photos/seed/" + v.name + "/480/270",
          url: v.url,
          size: v.size,
          date: new Date(v.date).toLocaleDateString()
        }));
        setGallery(serverVideos);
      }
    } catch (e) {
      console.error("Gallery fetch error", e);
    }
  };

  const handleAnalyze = async () => {
    if (!url) return addToast("Veuillez entrer une URL", "error");
    
    setLoading(true);
    setVideoInfo(null);
    try {
      const res = await fetch(`${API_BASE}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoInfo(data);
        addToast("Analyse terminée !", "success");
      } else {
        addToast(data.error || "Erreur lors de l'analyse", "error");
      }
    } catch (e) {
      addToast("Impossible de contacter le serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;
    
    setDownloading(true);
    addToast("Téléchargement lancé...", "info");
    
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoInfo.original_url || url, quality }),
      });
      
      const data = await res.json();
      if (data.success) {
        const newEntry = {
          id: Date.now(),
          title: data.filename,
          thumbnail: videoInfo.thumbnail,
          url: data.url,
          size: (data.size / 1024 / 1024).toFixed(2) + " MB",
          date: new Date().toLocaleDateString()
        };
        const updated = [newEntry, ...gallery].slice(0, 20);
        setGallery(updated);
        localStorage.setItem("fender_gallery", JSON.stringify(updated));
        addToast("Vidéo prête !", "success");
        setVideoInfo(null);
        setUrl("");
      } else {
        addToast(data.error || "Erreur au téléchargement", "error");
      }
    } catch (e) {
      addToast("Erreur réseau", "error");
    } finally {
      setDownloading(false);
    }
  };

  const deleteVideo = async (filename, id) => {
    try {
      await fetch(`${API_BASE}/videos/${encodeURIComponent(filename)}`, { method: "DELETE" });
      const updated = gallery.filter(v => v.id !== id);
      setGallery(updated);
      localStorage.setItem("fender_gallery", JSON.stringify(updated));
      addToast("Supprimé", "info");
    } catch (e) {
      addToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <div className="app">
      <div className="blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* --- HEADER --- */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon"><i className="fas fa-bolt"></i></div>
          <h1 className="logo-name">FENDER</h1>
        </div>
        <h2 className="hero-title">
          Le futur du <span className="gradient-text">téléchargement</span>
        </h2>
        <p className="hero-desc">
          Une plateforme premium conçue par <span className="dev-name">Daniel_Tech</span> pour récupérer vos contenus favoris en un clic.
          Soutient YouTube, TikTok, Instagram et +1000 sites.
        </p>

        {/* --- PLATFORM ICONS --- */}
        <div className="platform-icons">
          <i className="fab fa-youtube" title="YouTube"></i>
          <i className="fab fa-tiktok" title="TikTok"></i>
          <i className="fab fa-instagram" title="Instagram"></i>
          <i className="fab fa-facebook" title="Facebook"></i>
          <i className="fab fa-vimeo-v" title="Vimeo"></i>
          <i className="fab fa-twitter" title="Twitter/X"></i>
        </div>
      </header>

      <main className="main">
        {/* --- FEATURES SECTION --- */}
        <div className="features-grid">
          <div className="feature-item">
            <i className="fas fa-rocket feature-icon"></i>
            <div>
              <h4>Ultra Rapide</h4>
              <p>Moteur de téléchargement haute performance.</p>
            </div>
          </div>
          <div className="feature-item">
            <i className="fas fa-shield-halved feature-icon"></i>
            <div>
              <h4>Sécurisé</h4>
              <p>Sans publicités intrusives ni malwares.</p>
            </div>
          </div>
          <div className="feature-item">
            <i className="fas fa-crown feature-icon"></i>
            <div>
              <h4>Qualité Max</h4>
              <p>Supporte la 4K et le son haute fidélité.</p>
            </div>
          </div>
        </div>

        {/* --- DOWNLOAD CARD --- */}
        <section className="card">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              className="url-input"
              placeholder="Collez l'URL de la vidéo ici..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              disabled={loading || downloading}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze}
              disabled={loading || downloading || !url}
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
              {loading ? "Analyse..." : "Analyser"}
            </button>
          </div>

          {videoInfo && (
            <div className="info-panel">
              <div className="thumbnail-container">
                <img src={videoInfo.thumbnail} className="thumbnail" alt="preview" />
                <span className="platform-tag">{videoInfo.platform}</span>
              </div>
              <div className="video-details">
                <h2>{videoInfo.title}</h2>
                <div className="meta-info">
                  <span><i className="far fa-clock"></i> {videoInfo.duration}</span>
                  <span><i className="far fa-user"></i> {videoInfo.uploader}</span>
                  <span><i className="far fa-eye"></i> {videoInfo.views}</span>
                </div>

                <div className="quality-options">
                  {["low", "medium", "high"].map((q) => (
                    <div 
                      key={q} 
                      className={`quality-chip ${quality === q ? 'active' : ''}`}
                      onClick={() => setQuality(q)}
                    >
                      <i className={q === 'high' ? 'fas fa-crown' : q === 'medium' ? 'fas fa-star' : 'fas fa-compress'}></i>
                      {q.toUpperCase()}
                    </div>
                  ))}
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{ width: "100%" }}
                >
                  {downloading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-cloud-arrow-down"></i>}
                  {downloading ? "Téléchargement..." : "Télécharger la vidéo"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* --- GALLERY --- */}
        <section className="gallery">
          <div className="gallery-header">
             <h3 style={{ fontFamily: "var(--font-heading)" }}><i className="fas fa-box-archive"></i> Vos Téléchargements</h3>
             {gallery.length > 0 && <span className="gallery-count">{gallery.length} fichiers</span>}
          </div>
          <div className="gallery-grid">
            {gallery.length === 0 ? (
              <div className="empty-gallery">
                <i className="fas fa-film fa-3x"></i>
                <p>Aucun téléchargement récent.</p>
              </div>
            ) : (
              gallery.map((vid) => (
                <div key={vid.id} className="gallery-item">
                  <img src={vid.thumbnail} className="item-thumb" alt="" />
                  <div className="item-info">
                    <p className="item-title">{vid.title}</p>
                    <div className="item-actions">
                      <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                        <i className="fas fa-file-video"></i> {vid.size}
                      </span>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a href={vid.url} download className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                          <i className="fas fa-play"></i>
                        </a>
                        <button className="btn btn-secondary" style={{ padding: "8px 12px", color: "#ff4d4d" }} onClick={() => deleteVideo(vid.title, vid.id)}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="footer-top">
           <div className="footer-logo">FENDER</div>
           <p>Le meilleur outil de téléchargement vidéo, gratuit et sécurisé.</p>
        </div>
        <div className="footer-bottom">
           <p>© 2026 Développé avec <i className="fas fa-heart" style={{color: "var(--primary)"}}></i> par <span className="dev-highlight">Daniel_Tech</span></p>
           <div className="social-links">
             <i className="fab fa-github"></i>
             <i className="fab fa-discord"></i>
             <i className="fab fa-twitter"></i>
           </div>
        </div>
      </footer>

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={t.type === 'success' ? 'fas fa-check-circle' : t.type === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-info-circle'}></i>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}