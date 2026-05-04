export const Header = () => (
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

    <div className="platform-icons">
      <i className="fab fa-youtube" title="YouTube"></i>
      <i className="fab fa-tiktok" title="TikTok"></i>
      <i className="fab fa-instagram" title="Instagram"></i>
      <i className="fab fa-facebook" title="Facebook"></i>
      <i className="fab fa-vimeo-v" title="Vimeo"></i>
      <i className="fab fa-twitter" title="Twitter/X"></i>
    </div>
  </header>
);
