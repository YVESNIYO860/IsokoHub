import { useEffect } from 'react';

export default function ChatInbox() {
  useEffect(() => {
    document.title = 'Messages - IsokoHub';
  }, []);

  return (
    <main className="chat-inbox-page">
      <div className="chat-inbox-heading">
        <div>
          <span className="chat-kicker">IsokoHub messages</span>
          <h1>Your conversations</h1>
          <p>Keep track of your questions and seller replies in one place.</p>
        </div>
        <a href="products.html" className="btn btn-primary"><i className="fa-solid fa-magnifying-glass"></i> Browse products</a>
      </div>
      <div id="chat-inbox-status" className="chat-status" role="status" aria-live="polite">Loading your conversations...</div>
      <div className="chat-inbox-search-box" hidden>
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <label className="sr-only" htmlFor="chat-inbox-search">Search conversations</label>
        <input id="chat-inbox-search" type="search" placeholder="Search conversations" />
      </div>
      <section id="chat-inbox-list" className="chat-inbox-list" aria-label="Conversations" aria-live="polite"></section>
    </main>
  );
}
