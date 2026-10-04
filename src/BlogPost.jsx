import { useEffect } from 'react';

const blogStyles = `
  .post-hero {
    position: relative;
    height: 50vh;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
    overflow: hidden;
    background: #0f172a;
  }
  .post-hero-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(0deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 100%);
    z-index: 1;
  }
  .post-hero img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.6; }
  .post-header { position: relative; z-index: 2; max-width: 900px; padding: 0 1.5rem; }
  .post-category { background: #febd69; color: #131921; padding: 0.4rem 1rem; border-radius: 50px; font-weight: 800; font-size: 0.8rem; display: inline-block; margin-bottom: 1.5rem; letter-spacing: 1px; }
  .post-title { font-size: 3.5rem; font-weight: 800; margin-bottom: 1.5rem; line-height: 1.1; }
  .post-meta { font-size: 0.9rem; opacity: 0.8; display: flex; justify-content: center; gap: 2rem; }
  .article-container { max-width: 800px; margin: -5rem auto 5rem auto; background: white; position: relative; z-index: 10; padding: 4rem; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
  .article-content { font-size: 1.25rem; line-height: 1.8; color: #334155; }
  .article-content h3 { font-size: 2rem; color: #0f172a; margin: 3rem 0 1.5rem 0; }
  .article-content p { margin-bottom: 2rem; }
  .article-content blockquote { border-left: 5px solid #febd69; padding-left: 2rem; font-style: italic; font-size: 1.5rem; color: #475569; margin: 3rem 0; }
  .article-content ul { margin-bottom: 2rem; padding-left: 1.5rem; }
  .article-content li { margin-bottom: 1rem; }
  @media (max-width: 768px) {
    .post-title { font-size: 2.5rem; }
    .article-container { padding: 2rem; margin-top: -3rem; border-radius: 0; }
  }
`;

export default function BlogPost() {
  useEffect(() => {
    document.title = 'Loading Article... - IsokoHub Blog';
  }, []);

  return (
    <>
      <style>{blogStyles}</style>
      <div id="loading-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa-solid fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary-blue)' }}></i>
      </div>

      <div id="post-view" style={{ display: 'none' }}>
        <header className="post-hero">
          <a href="/home" className="home-return-btn" aria-label="Go to home" title="Go to home" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 3, width: '2.8rem', height: '2.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: 'rgba(255,255,255,0.16)', color: 'white', border: '1px solid rgba(255,255,255,0.26)', backdropFilter: 'blur(8px)', textDecoration: 'none', fontSize: '1.05rem' }}>
            <i className="fa-solid fa-house"></i>
          </a>
          <img id="hero-img" src="" alt="Post Header" />
          <div className="post-hero-overlay"></div>
          <div className="post-header">
            <span id="post-category" className="post-category">CATEGORY</span>
            <h1 id="post-title" className="post-title">Loading...</h1>
            <div className="post-meta">
              <span><i className="fa-solid fa-calendar"></i> <span id="post-date">...</span></span>
              <span><i className="fa-solid fa-user-edit"></i> <span id="post-author">...</span></span>
            </div>
          </div>
        </header>

        <main className="container">
          <article className="article-container">
            <div id="post-content" className="article-content"></div>
            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
              <a href="about.html#blog" className="btn btn-secondary" style={{ borderRadius: '50px', padding: '1rem 2rem' }}>&larr; Back to Blog</a>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
