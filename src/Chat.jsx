import { useEffect } from 'react';

export default function Chat() {
  useEffect(() => {
    document.title = 'Chat - IsokoHub';
  }, []);

  return (
    <main className="chat-page">
      <section className="chat-shell" aria-label="Marketplace chat">
        <aside className="chat-context-panel">
          <span className="chat-kicker"><i className="fa-solid fa-comments"></i> IsokoHub chat</span>
          <h1>Talk directly about the listing.</h1>
          <p>Ask questions, confirm availability, and agree on the next step with the seller.</p>
          <div id="chat-product-context" className="chat-product-context"></div>
          <div className="chat-privacy-note"><i className="fa-solid fa-eye"></i><span>Chats are not end-to-end encrypted. IsokoHub administrators can review conversations for safety.</span></div>
        </aside>
        <section className="chat-panel">
          <div id="chat-status" className="chat-status" role="status"></div>
          <div id="chat-identity" className="chat-identity-card"></div>
          <div id="chat-conversation-picker" className="chat-conversation-picker" hidden></div>
          <div id="chat-messages" className="chat-messages" aria-live="polite"></div>
          <form id="chat-form" className="chat-compose" hidden>
            <label className="sr-only" htmlFor="chat-message">Your message</label>
            <textarea id="chat-message" rows="2" maxLength="2000" placeholder="Write a message to the seller..."></textarea>
            <button className="chat-send-btn" type="submit" aria-label="Send message"><i className="fa-solid fa-paper-plane"></i></button>
          </form>
        </section>
      </section>
    </main>
  );
}
