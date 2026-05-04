export const DownloadCard = ({ 
  url, 
  setUrl, 
  onAnalyze, 
  loading, 
  downloading, 
  videoInfo, 
  quality, 
  setQuality, 
  onDownload,
  inputRef 
}) => {
  return (
    <section className="card">
      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          className="url-input"
          placeholder="Collez l'URL de la vidéo ici..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
          disabled={loading || downloading}
        />
        <button 
          className="btn btn-primary" 
          onClick={onAnalyze}
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
              onClick={onDownload}
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
  );
};
