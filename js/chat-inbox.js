function inboxEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('chat-inbox-status');
  const list = document.getElementById('chat-inbox-list');
  const searchBox = document.querySelector('.chat-inbox-search-box');
  const searchInput = document.getElementById('chat-inbox-search');
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  let visitor = null;
  try { visitor = JSON.parse(localStorage.getItem('isokoHubChatVisitor') || 'null'); } catch (error) { visitor = null; }

  if (!window.supabase) {
    status.textContent = 'Messages are temporarily unavailable.';
    status.className = 'chat-status error';
    return;
  }

  let query = supabase.from('marketplace_conversations').select('*').order('last_message_at', { ascending: false });
  if (user?.id) {
    query = query.eq('seller_id', user.id);
  } else if (visitor?.id) {
    query = query.eq('visitor_id', visitor.id);
  } else {
    status.textContent = 'Start a product chat first and your conversations will appear here.';
    list.innerHTML = '<div class="chat-inbox-empty"><i class="fa-regular fa-message"></i><h2>No messages yet</h2><p>Open any product and choose Chat online.</p><a class="btn btn-primary" href="products.html">Find a product</a></div>';
    return;
  }

  const { data: conversations, error } = await query;
  if (error) {
    status.textContent = 'Run the chat migration in Supabase to enable your inbox.';
    status.className = 'chat-status error';
    return;
  }

  const rows = conversations || [];
  status.textContent = user?.id ? 'Seller inbox' : `Messages for ${visitor.name}`;
  if (!rows.length) {
    list.innerHTML = '<div class="chat-inbox-empty"><i class="fa-regular fa-message"></i><h2>No conversations yet</h2><p>Open a product and start a conversation.</p><a class="btn btn-primary" href="products.html">Browse products</a></div>';
    return;
  }

  if (searchBox) searchBox.hidden = false;
  list.innerHTML = rows.map((conversation) => `
    <a class="chat-inbox-row" href="chat.html?product=${encodeURIComponent(conversation.product_id || '')}&conversation=${encodeURIComponent(conversation.id)}">
      <span class="chat-inbox-row-icon"><i class="fa-solid fa-comments"></i></span>
      <span class="chat-inbox-row-content"><strong>${inboxEscape(user?.id ? conversation.visitor_name : conversation.seller_name || 'Seller')}</strong><span>${inboxEscape(conversation.product_name || 'Marketplace listing')}</span><small>${new Date(conversation.last_message_at).toLocaleString()}</small></span>
      <i class="fa-solid fa-chevron-right chat-inbox-arrow"></i>
    </a>
  `).join('');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      const conversationRows = Array.from(list.querySelectorAll('.chat-inbox-row'));
      const visibleRows = conversationRows.filter((row) => {
        const matches = row.textContent.toLowerCase().includes(query);
        row.hidden = !matches;
        return matches;
      });
      let emptyMessage = list.querySelector('.chat-inbox-filter-empty');
      if (!emptyMessage && !visibleRows.length) {
        emptyMessage = document.createElement('div');
        emptyMessage.className = 'chat-inbox-filter-empty';
        emptyMessage.textContent = 'No conversations match your search.';
        list.appendChild(emptyMessage);
      } else if (emptyMessage && visibleRows.length) {
        emptyMessage.remove();
      }
    });
  }
});
