document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId || !blogData[postId]) {
    alert('Article not found.');
    window.location.href = 'about.html#blog';
    return;
  }

  const post = blogData[postId];

  // Update Page Title
  document.title = `${post.title} - IsokoHub Blog`;

  // Inject Meta Data
  document.getElementById('post-category').textContent = post.category;
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-date').textContent = post.date;
  document.getElementById('post-author').textContent = post.author;
  document.getElementById('hero-img').src = post.image;
  document.getElementById('post-content').innerHTML = post.content;

  // Show View and Hide Loading
  setTimeout(() => {
    document.getElementById('loading-overlay').style.display = 'none';
    document.getElementById('post-view').style.display = 'block';
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1000);
});
