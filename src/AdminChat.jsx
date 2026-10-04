import { useEffect } from 'react';

export default function AdminChat() {
  useEffect(() => {
    document.title = 'Conversation inbox - IsokoHub';
  }, []);

  return (
    <main className="admin-chat-page">
      <div className="admin-chat-heading">
        <div>
          <span className="chat-kicker">Moderation inbox</span>
          <h1>Marketplace conversations</h1>
          <p>Review buyer and seller conversations for safety and support.</p>
        </div>
        <a href="admin.html" className="btn btn-secondary"><i className="fa-solid fa-arrow-left"></i> Admin dashboard</a>
      </div>
      <div id="admin-chat-status" className="chat-status"></div>
      <section className="admin-chat-layout">
        <aside id="admin-chat-list" className="admin-chat-list"></aside>
        <section className="admin-chat-thread">
          <div id="admin-chat-thread-heading" className="admin-chat-thread-heading">Choose a conversation</div>
          <div id="admin-chat-messages" className="chat-messages"></div>
        </section>
      </section>
    </main>
  );
}
