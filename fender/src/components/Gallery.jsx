export const Gallery = ({ gallery, onDelete }) => (
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
                  <button className="btn btn-secondary" style={{ padding: "8px 12px", color: "#ff4d4d" }} onClick={() => onDelete(vid.title, vid.id)}>
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
);
