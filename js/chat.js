const CHAT_VISITOR_KEY = 'isokoHubChatVisitor';

function chatEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getChatVisitor() {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_VISITOR_KEY) || 'null');
    return stored?.id && stored?.name ? stored : null;
  } catch (error) {
    return null;
  }
}

function saveChatVisitor(name) {
  const visitor = { id: crypto.randomUUID ? crypto.randomUUID() : `visitor-${Date.now()}`, name: name.trim() };
  localStorage.setItem(CHAT_VISITOR_KEY, JSON.stringify(visitor));
  return visitor;
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  const requestedConversationId = params.get('conversation');
  const status = document.getElementById('chat-status');
  const identity = document.getElementById('chat-identity');
  const productContext = document.getElementById('chat-product-context');
  const picker = document.getElementById('chat-conversation-picker');
  const messagesEl = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-message');
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  let activeConversation = null;
  let realtimeChannel = null;

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.className = `chat-status ${type}`;
  };

  if (!window.supabase || !productId) {
    setStatus(!productId ? 'Choose a product before opening chat.' : 'Chat is temporarily unavailable.', 'error');
    return;
  }

  const { data: product, error: productError } = await supabase.from('products').select('*').eq('id', productId).single();
  if (productError || !product) {
    setStatus('This listing could not be found.', 'error');
    return;
  }

  const productImage = Array.isArray(product.image) ? product.image[0] : product.image;
  productContext.innerHTML = `
    <div class="chat-product-card">
      <img src="${chatEscape(productImage || 'assets/logo.png')}" alt="${chatEscape(product.name || 'Product')}">
      <div><strong>${chatEscape(product.name || 'Product')}</strong><span>${chatEscape(formatPrice(product.price || 0))}</span><small>${chatEscape(product.district || 'Local listing')}</small></div>
    </div>
    <a class="chat-profile-link" href="seller-profile.html?id=${encodeURIComponent(product.seller_id || '')}"><i class="fa-solid fa-user"></i> View seller profile</a>
  `;

  const sellerId = product.seller_id || product.sellerId || null;
  const isSeller = Boolean(currentUser?.id && sellerId && currentUser.id === sellerId);
  let visitor = getChatVisitor();

  if (!isSeller && !visitor) {
    identity.innerHTML = `<label for="chat-name">Choose a display name</label><div class="chat-identity-row"><input id="chat-name" maxlength="60" placeholder="e.g. Aline" required><button id="chat-start" type="button">Start chat</button></div><small>This name is visible to the seller and admins.</small>`;
    setStatus('Introduce yourself before sending a message.');
    document.getElementById('chat-start').addEventListener('click', () => {
      const name = document.getElementById('chat-name').value.trim();
      if (name.length < 2) return setStatus('Please enter at least two characters.', 'error');
      visitor = saveChatVisitor(name);
      initializeChat();
    });
  } else {
    initializeChat();
  }

  async function initializeChat() {
    const participantId = isSeller ? sellerId : visitor.id;
    const participantName = isSeller ? (currentUser.name || currentUser.email || 'Seller') : visitor.name;
    identity.innerHTML = `<div class="chat-identity-active"><span class="chat-avatar">${chatEscape(participantName.slice(0, 2).toUpperCase())}</span><div><strong>${chatEscape(participantName)}</strong><small>${isSeller ? 'Seller inbox' : 'Chatting as a demo name'}</small></div></div>`;
    if (isSeller) {
      const { data } = await supabase.from('marketplace_conversations').select('*').eq('seller_id', sellerId).order('last_message_at', { ascending: false });
      const conversations = data || [];
      picker.hidden = false;
      picker.innerHTML = conversations.length ? conversations.map((conversation) => `<button type="button" data-conversation="${conversation.id}"><strong>${chatEscape(conversation.visitor_name)}</strong><small>${chatEscape(conversation.product_name || 'Listing')}</small></button>`).join('') : '<p>No buyer conversations yet.</p>';
      if (conversations.length) {
        picker.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => selectConversation(conversations.find((item) => item.id === button.dataset.conversation))));
        selectConversation(conversations.find((item) => item.id === requestedConversationId) || conversations[0]);
      }
      return;
    }

    let conversationQuery = supabase.from('marketplace_conversations').select('*').eq('product_id', product.id).eq('visitor_id', visitor.id);
    if (requestedConversationId) conversationQuery = conversationQuery.eq('id', requestedConversationId);
    const { data: conversations } = await conversationQuery.order('created_at', { ascending: false }).limit(1);
    activeConversation = conversations?.[0] || null;
    if (!activeConversation) {
      const result = await supabase.from('marketplace_conversations').insert([{ product_id: product.id, seller_id: sellerId, visitor_id: visitor.id, visitor_name: visitor.name, seller_name: 'Seller', product_name: product.name }]).select().single();
      activeConversation = result.data;
    }
    if (activeConversation) selectConversation(activeConversation);
  }

  async function selectConversation(conversation) {
    if (!conversation) return;
    activeConversation = conversation;
    form.hidden = false;
    const { data: messages } = await supabase.from('marketplace_messages').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: true });
    renderMessages(messages || []);
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    realtimeChannel = supabase.from(`chat-${conversation.id}`).on('INSERT', (payload) => {
      if (payload.new.conversation_id === conversation.id) renderMessages([...Array.from(messagesEl.querySelectorAll('[data-message-id]')).map((node) => ({ id: node.dataset.messageId, sender_name: node.dataset.senderName, sender_role: node.dataset.senderRole, body: node.dataset.body, created_at: node.dataset.createdAt })), payload.new]);
    }).subscribe();
    setStatus(isSeller ? `Conversation with ${conversation.visitor_name}` : 'You are connected with the seller.', 'success');
  }

  function renderMessages(messages) {
    const normalized = messages.filter(Boolean).reduce((all, message) => all.some((item) => item.id === message.id) ? all : [...all, message], []);
    messagesEl.innerHTML = normalized.length ? normalized.map((message) => `<div class="chat-message ${message.sender_role === (isSeller ? 'seller' : 'visitor') ? 'mine' : ''}" data-message-id="${message.id}" data-sender-name="${chatEscape(message.sender_name)}" data-sender-role="${message.sender_role}" data-body="${chatEscape(message.body)}" data-created-at="${message.created_at}"><span>${chatEscape(message.sender_name)}</span><p>${chatEscape(message.body)}</p><small>${new Date(message.created_at).toLocaleString()}${message.delivery_status ? ` · ${chatEscape(message.delivery_status)}` : ''}</small></div>`).join('') : '<div class="chat-empty"><i class="fa-regular fa-message"></i><p>No messages yet. Start the conversation.</p></div>';
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body || !activeConversation) return;
    const senderName = isSeller ? (currentUser.name || currentUser.email || 'Seller') : visitor.name;
    const senderRole = isSeller ? 'seller' : 'visitor';
    const result = await supabase.from('marketplace_messages').insert([{ conversation_id: activeConversation.id, sender_id: isSeller ? sellerId : null, sender_name: senderName, sender_role: senderRole, body }]);
    if (result.error) return setStatus('Message could not be sent. Please try again.', 'error');
    await supabase.from('marketplace_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeConversation.id);
    const deliveredMessage = Array.isArray(result.data) ? result.data[0] : result.data;
    if (deliveredMessage) renderMessages([...Array.from(messagesEl.querySelectorAll('[data-message-id]')).map((node) => ({ id: node.dataset.messageId, sender_name: node.dataset.senderName, sender_role: node.dataset.senderRole, body: node.dataset.body, created_at: node.dataset.createdAt })), { ...deliveredMessage, delivery_status: 'Delivered' }]);
    setStatus('Message delivered.', 'success');
    input.value = '';
  });
});
