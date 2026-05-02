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

  // Load gallery from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fender_gallery");
    if (saved) setGallery(JSON.parse(saved));
    fetchGallery(); // Sync with server files
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
          thumbnail: "https://picsum.photos/seed/" + v.name + "/480/270", // Fallback thumbnail
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

      <header className="header">
        <div className="logo">
          <div className="logo-icon"><i className="fas fa-bolt"></i></div>
          <h1 className="logo-name">FENDER</h1>
        </div>
        <h2 className="hero-title">
          Le futur du <span className="gradient-text">téléchargement</span>
        </h2>
        <p className="hero-desc">
          Une plateforme premium pour récupérer vos contenus favoris en un clic.
          Soutient YouTube, TikTok, Instagram et +1000 sites.
        </p>
      </header>

      <main className="main">
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
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-search"></i>}
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
                  {downloading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-download"></i>}
                  {downloading ? "Téléchargement..." : "Télécharger la vidéo"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="gallery">
          <h3 style={{ marginBottom: "20px", fontFamily: "var(--font-heading)" }}>Vos Téléchargements</h3>
          <div className="gallery-grid">
            {gallery.length === 0 ? (
              <p style={{ color: "var(--text-dim)", textAlign: "center", gridColumn: "1/-1", padding: "40px" }}>
                Aucun téléchargement récent.
              </p>
            ) : (
              gallery.map((vid) => (
                <div key={vid.id} className="gallery-item">
                  <img src={vid.thumbnail} className="item-thumb" alt="" />
                  <div className="item-info">
                    <p className="item-title">{vid.title}</p>
                    <div className="item-actions">
                      <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{vid.size}</span>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a href={vid.url} download className="btn btn-secondary" style={{ padding: "5px 10px" }}>
                          <i className="fas fa-play"></i>
                        </a>
                        <button className="btn btn-secondary" style={{ padding: "5px 10px", color: "#ff4d4d" }} onClick={() => deleteVideo(vid.title, vid.id)}>
                          <i className="fas fa-trash"></i>
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

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={t.type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle'}></i>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}