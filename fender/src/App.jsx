import { useState, useEffect, useRef } from "react";
import "./App.css";

// Services
import * as api from "./services/api";

// Components
import { Header } from "./components/Header";
import { Features } from "./components/Features";
import { DownloadCard } from "./components/DownloadCard";
import { Steps } from "./components/Steps";
import { InfoSection } from "./components/InfoSection";
import { Gallery } from "./components/Gallery";
import { Footer } from "./components/Footer";
import { Toast } from "./components/Toast";

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
    loadGallery();
  }, []);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadGallery = async () => {
    try {
      const data = await api.fetchVideos();
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
      const data = await api.analyzeVideo(url);
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
      const data = await api.downloadVideo(videoInfo.original_url || url, quality);
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

  const handleDelete = async (filename, id) => {
    try {
      await api.deleteVideoFile(filename);
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

      <Header />

      <main className="main">
        <Features />

        <DownloadCard 
          url={url}
          setUrl={setUrl}
          onAnalyze={handleAnalyze}
          loading={loading}
          downloading={downloading}
          videoInfo={videoInfo}
          quality={quality}
          setQuality={setQuality}
          onDownload={handleDownload}
          inputRef={inputRef}
        />

        <Steps />
        <InfoSection />
        <Gallery gallery={gallery} onDelete={handleDelete} />
      </main>

      <Footer />
      <Toast toasts={toasts} />
    </div>
  );
}