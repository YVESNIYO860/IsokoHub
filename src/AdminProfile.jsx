import { useEffect } from 'react';

const profileStyles = `
  .admin-profile-page { min-height: 55vh; padding-bottom: 3rem; background: var(--bg-color); }
  .profile-hero { background: #10213f; color: white; padding: 2.5rem 1rem 7rem; text-align: center; }
  .profile-hero h1 { margin: 0; font-size: 1.8rem; }
  .profile-container { width: min(100% - 2rem, 1040px); margin: -4.5rem auto 0; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 2rem; position: relative; }
  .profile-grid { display: grid; grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.3fr); gap: 2rem; align-items: start; }
  .profile-img-container { text-align: center; }
  .profile-img { display: block; width: 100%; max-width: 320px; aspect-ratio: 4 / 5; margin: 0 auto; border-radius: var(--radius-md); object-fit: cover; object-position: center 35%; box-shadow: var(--shadow-sm); }
  .profile-socials { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
  .profile-socials a { display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--border-color); border-radius: 10px; background: #fff; color: var(--primary-blue) !important; font-size: 1.1rem; transition: background 180ms ease, transform 180ms ease; }
  .profile-socials a:hover { transform: translateY(-2px); background: #eff6ff; }
  .bio-content { line-height: 1.75; color: var(--text-muted); font-size: 1rem; }
  .bio-content h2 { margin: 0.4rem 0 1rem; color: var(--text-dark); font-size: 2rem; }
  .bio-content p { margin-bottom: 1rem; }
  .experience-tag { background: #eff6ff; color: #1d4ed8; padding: 0.35rem 0.65rem; border-radius: 999px; font-weight: 750; font-size: 0.75rem; display: inline-flex; margin-bottom: 0.25rem; }
  .profile-marketplace-link { display: inline-flex; margin-top: 0.5rem; }
  @media (max-width: 700px) {
    .profile-hero { padding: 2rem 1rem 6rem; }
    .profile-grid { grid-template-columns: 1fr; gap: 1.5rem; }
    .profile-container { padding: 1.1rem; }
    .profile-img { max-width: 250px; }
    .bio-content h2 { font-size: 1.6rem; }
  }
`;

export default function AdminProfile() {
  useEffect(() => {
    document.title = 'About Admin - Niyonkuru Yves';
  }, []);

  return (
    <>
      <style>{profileStyles}</style>
      <main className="admin-profile-page">
      <header className="profile-hero">
        <h1>Meet the founder of IsokoHub</h1>
      </header>

        <div className="profile-container">
          <div className="profile-grid">
            <div className="profile-img-container">
              <img src="assets/admin.jpeg" alt="Niyonkuru Yves, founder and developer of IsokoHub" className="profile-img" loading="lazy" />
              <div className="profile-socials">
                <a href="https://www.instagram.com/maverix_001/" target="_blank" rel="noreferrer" title="Instagram" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                <a href="https://www.facebook.com/profile.php?id=100073494818427&amp;sk=friends" target="_blank" rel="noreferrer" title="Facebook" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
                <a href="https://www.youtube.com/@techli_001" target="_blank" rel="noreferrer" title="YouTube" aria-label="YouTube"><i className="fa-brands fa-youtube"></i></a>
                <a href="https://www.linkedin.com/in/best-shineboy-3aa183383/" target="_blank" rel="noreferrer" title="LinkedIn" aria-label="LinkedIn"><i className="fa-brands fa-linkedin"></i></a>
                <a href="https://x.com/best_shineboy" target="_blank" rel="noreferrer" title="X" aria-label="X"><i className="fa-brands fa-x-twitter"></i></a>
                <a href="mailto:yvesniyonkuru2022@gmail.com" title="Email" aria-label="Email"><i className="fa-solid fa-envelope"></i></a>
              </div>
            </div>
            <div className="bio-content">
              <span className="experience-tag">FOUNDER · CEO · DEVELOPER</span>
              <h2>Niyonkuru Yves</h2>
              <p><strong>Niyonkuru Yves</strong> is a passionate and ambitious young Rwandan from Kamonyi District, Southern Province, Rwanda. From an early age, Yves demonstrated a natural curiosity and love for learning, exploring both academic subjects and creative pursuits with dedication and enthusiasm.</p>
              <p>He completed his secondary education at <strong>ES Runaba</strong>, where he excelled academically while actively participating in school activities and community initiatives. His time at ES Runaba instilled in him a deep appreciation for education, discipline, and teamwork, shaping the values that continue to guide him today.</p>
              <p>Currently, Yves is pursuing higher education at the <strong>University of Rwanda</strong>, balancing rigorous academics with his diverse interests. Beyond formal education, he is deeply passionate about creativity, innovation, and digital projects that combine practical solutions with artistic expression.</p>
              <p>Growing up in a supportive yet resource-limited environment, Yves learned the importance of resilience, problem-solving, and self-motivation. These qualities have driven him to explore photography, content creation, and digital projects, allowing him to express creativity while developing practical skills.</p>
              <p>Yves believes strongly in lifelong learning and personal growth, constantly seeking opportunities to expand his knowledge, contribute positively to society, and inspire others through his work. His journey reflects determination, curiosity, and creativity, making him not only the driving force behind this website but also a young Rwandan committed to making a meaningful impact in his community and beyond.</p>
              <a href="/home" className="btn btn-primary profile-marketplace-link">Back to marketplace</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
