function adminChatEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('admin-chat-status');
  const list = document.getElementById('admin-chat-list');
  const heading = document.getElementById('admin-chat-thread-heading');
  const messagesEl = document.getElementById('admin-chat-messages');
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const isAdmin = typeof isAdminUser === 'function' && isAdminUser(user);
  if (!isAdmin) {
    status.textContent = 'Admin access is required to view conversations.';
    status.className = 'chat-status error';
    return;
  }
  if (!window.supabase) return;

  const { data: conversations, error } = await supabase.from('marketplace_conversations').select('*').order('last_message_at', { ascending: false });
  if (error) {
    status.textContent = 'Conversation inbox is not ready. Run the chat migration in Supabase.';
    status.className = 'chat-status error';
    return;
  }
  const rows = conversations || [];
  list.innerHTML = rows.length ? rows.map((conversation) => `<button class="admin-conversation-row" data-id="${conversation.id}"><strong>${adminChatEscape(conversation.visitor_name)}</strong><span>${adminChatEscape(conversation.product_name || 'Listing')}</span><small>${new Date(conversation.last_message_at).toLocaleString()}</small></button>`).join('') : '<div class="admin-chat-empty">No conversations yet.</div>';

  async function openConversation(conversation) {
    const { data: messages } = await supabase.from('marketplace_messages').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: true });
    heading.innerHTML = `<strong>${adminChatEscape(conversation.visitor_name)}</strong><span>${adminChatEscape(conversation.product_name || 'Listing')}</span>`;
    messagesEl.innerHTML = (messages || []).map((message) => `<div class="chat-message ${message.sender_role === 'admin' ? 'mine' : ''}"><span>${adminChatEscape(message.sender_name)} · ${adminChatEscape(message.sender_role)}</span><p>${adminChatEscape(message.body)}</p><small>${new Date(message.created_at).toLocaleString()}</small></div>`).join('') || '<div class="chat-empty">No messages yet.</div>';
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  list.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => openConversation(rows.find((item) => item.id === button.dataset.id))));
  if (rows[0]) openConversation(rows[0]);
});
