export const InfoSection = () => (
  <section className="info-grid-section">
    <div className="info-row">
      <div className="info-content">
        <span className="badge">Performance</span>
        <h3>Vitesse de téléchargement <br/><span className="gradient-text">sans limite</span></h3>
        <p>FENDER utilise des algorithmes de pointe pour traiter vos requêtes en quelques millisecondes. Pas d'attente, pas de file d'attente.</p>
        <ul className="info-list">
          <li><i className="fas fa-check-circle"></i> Serveurs haut débit optimisés</li>
          <li><i className="fas fa-check-circle"></i> Compression intelligente sans perte</li>
          <li><i className="fas fa-check-circle"></i> Reprise de téléchargement supportée</li>
        </ul>
      </div>
      <div className="info-image-placeholder">
        <i className="fas fa-gauge-high"></i>
      </div>
    </div>

    <div className="info-row reverse">
      <div className="info-content">
        <span className="badge">Universalité</span>
        <h3>Support multi-plateforme <br/><span className="gradient-text">tout-en-un</span></h3>
        <p>Plus besoin de 10 sites différents. FENDER est compatible avec la majorité des réseaux sociaux et sites de streaming.</p>
        <div className="mini-platforms">
          <span>YouTube</span>
          <span>TikTok</span>
          <span>Instagram</span>
          <span>Facebook</span>
          <span>X (Twitter)</span>
          <span>Vimeo</span>
        </div>
      </div>
      <div className="info-image-placeholder">
        <i className="fas fa-globe-africa"></i>
      </div>
    </div>
  </section>
);
