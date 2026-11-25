import { useEffect, useRef, useState } from 'react';
import './ShoppingAssistant.css';

const STORAGE_KEY = 'isokohub-shopping-assistant-v1';
const welcomeMessages = {
  en: "Hello! I'm your IsokoHub AI Shopping Assistant. I can help you find products, compare prices, discover sellers and answer questions about IsokoHub. What are you looking for today?",
  rw: 'Muraho! Ndi umufasha wa IsokoHub mu gushaka ibicuruzwa. Nshobora kugufasha gushaka ibicuruzwa, kugereranya ibiciro no gusobanura uko IsokoHub ikora. Urashaka iki uyu munsi?',
  fr: "Bonjour ! Je suis l'assistant shopping IA d'IsokoHub. Je peux vous aider à trouver des produits, comparer les prix et répondre à vos questions sur IsokoHub. Que recherchez-vous aujourd'hui ?"
};
const suggestions = {
  en: ['Find a laptop under 500,000 RWF', 'Show used phones in Huye', 'How do I contact a seller?'],
  rw: ['Nshakira mudasobwa itarengeje 500.000 RWF', 'Erekana telefoni zakoreshejwe i Huye', 'Nahura n’umucuruzi nte?'],
  fr: ['Trouve un ordinateur à moins de 500 000 RWF', 'Montre les téléphones d’occasion à Huye', 'Comment contacter un vendeur ?']
};
const labels = {
  en: { title: 'IsokoHub shopping assistant', subtitle: 'Real listings. Helpful answers.', input: 'Ask about products or IsokoHub…', send: 'Send', close: 'Close assistant', clear: 'New chat', expand: 'Open full assistant', products: 'Matching listings', compare: 'Product comparison', more: 'Show more listings', loading: 'Searching listings and preparing an answer…', empty: 'No listings to show yet.' },
  rw: { title: 'Umufasha wo guhaha wa IsokoHub', subtitle: 'Amatangazo nyayo. Ibisubizo bifasha.', input: 'Baza ku bicuruzwa cyangwa IsokoHub…', send: 'Ohereza', close: 'Funga umufasha', clear: 'Tangira ikiganiro gishya', expand: 'Fungura umufasha wuzuye', products: 'Amatangazo ahuye', compare: 'Kugereranya ibicuruzwa', more: 'Erekana andi matangazo', loading: 'Turashaka amatangazo kandi dutegura igisubizo…', empty: 'Nta matangazo arahari.' },
  fr: { title: 'Assistant shopping IsokoHub', subtitle: 'Annonces réelles. Réponses utiles.', input: 'Posez une question sur les produits ou IsokoHub…', send: 'Envoyer', close: "Fermer l'assistant", clear: 'Nouvelle discussion', expand: 'Ouvrir en plein écran', products: 'Annonces correspondantes', compare: 'Comparaison des produits', more: 'Afficher plus d’annonces', loading: 'Recherche des annonces et préparation de la réponse…', empty: 'Aucune annonce à afficher.' }
};

function readStoredMessages() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored) && stored.length) {
      return stored.filter(message => ['user', 'assistant'].includes(message.role) && typeof message.content === 'string').slice(-24);
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return [{ role: 'assistant', content: welcomeMessages.en, products: [] }];
}

function formatPrice(product) {
  const currency = product.currency || 'RWF';
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const rawMinimum = product.priceMin ?? product.price;
  const rawMaximum = product.priceMax ?? product.price;
  const minimum = rawMinimum == null || rawMinimum === '' ? NaN : Number(rawMinimum);
  const maximum = rawMaximum == null || rawMaximum === '' ? NaN : Number(rawMaximum);
  if (!Number.isFinite(minimum)) return 'Contact seller for price';
  const low = `${formatter.format(minimum)} ${currency}`;
  if (Number.isFinite(maximum) && maximum > minimum) return `${low} – ${formatter.format(maximum)} ${currency}`;
  return low;
}

function SpecificationValue({ product, names }) {
  const specifications = product.specifications || {};
  const key = names.find(name => specifications[name] || specifications[name.toLowerCase()]);
  if (!key) return 'Not provided';
  return String(specifications[key] || specifications[key.toLowerCase()]);
}

function ProductCard({ product }) {
  const image = Array.isArray(product.image) ? product.image[0] : product.image;
  const specifications = product.specifications || {};
  const detailKeys = ['brand', 'model', 'memory', 'storage', 'capacity'];
  const details = detailKeys
    .map(key => specifications[key] && `${key === 'memory' ? 'Memory' : key[0].toUpperCase() + key.slice(1)}: ${specifications[key]}`)
    .filter(Boolean)
    .slice(0, 2);
  return (
    <article className="product-card assistant-product-card">
      <a className="product-card-main-link" href={`/product?id=${encodeURIComponent(product.id)}`} aria-label={`View ${product.name}`}>
        <div className="product-card-image-shell">
          {image
            ? <img className="product-card-img" src={image} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />
            : <div className="assistant-product-placeholder"><i className="fa-solid fa-box-open" aria-hidden="true"></i></div>}
        </div>
        <div className="product-card-content">
          <span className="product-category">{product.category}</span>
          <h3 className="product-title">{product.name}</h3>
          <strong className="assistant-product-price">{formatPrice(product)}</strong>
          <div className="assistant-product-meta">
            {product.condition && <span><i className="fa-solid fa-shield-halved" aria-hidden="true"></i> {product.condition}</span>}
            {product.district && <span><i className="fa-solid fa-location-dot" aria-hidden="true"></i> {product.district}</span>}
          </div>
          {details.length > 0 && <div className="assistant-product-specs">{details.map(detail => <span key={detail}>{detail}</span>)}</div>}
          <span className="assistant-product-open">View listing <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
        </div>
      </a>
    </article>
  );
}

function Comparison({ comparison, language }) {
  if (!comparison?.products?.length) return null;
  const words = labels[language] || labels.en;
  const fields = [
    ['Price', (product) => formatPrice(product)],
    ['Brand', (product) => <SpecificationValue product={product} names={['brand']} />],
    ['Model', (product) => <SpecificationValue product={product} names={['model']} />],
    ['Memory', (product) => <SpecificationValue product={product} names={['memory', 'ram', 'memory_size']} />],
    ['Capacity / storage', (product) => <SpecificationValue product={product} names={['capacity', 'storage', 'storage_capacity']} />],
    ['Condition', (product) => product.condition || 'Not provided'],
    ['Color', (product) => <SpecificationValue product={product} names={['color']} />],
    ['Warranty', (product) => <SpecificationValue product={product} names={['warranty']} />],
    ['Location', (product) => product.district || 'Not provided']
  ];
  return (
    <section className="assistant-comparison" aria-label={words.compare}>
      <h4><i className="fa-solid fa-scale-balanced" aria-hidden="true"></i> {words.compare}</h4>
      <div className="assistant-comparison-scroll">
        <table>
          <thead><tr><th>Details</th>{comparison.products.map(product => <th key={product.id}>{product.name}</th>)}</tr></thead>
          <tbody>{fields.map(([label, renderValue]) => (
            <tr key={label}><th>{label}</th>{comparison.products.map(product => <td key={product.id}>{renderValue(product)}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function ShoppingAssistant({ fullPage = false }) {
  const [messages, setMessages] = useState(readStoredMessages);
  const [language, setLanguage] = useState('auto');
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(fullPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const conversationRef = useRef(null);
  const composerInputRef = useRef(null);
  const launcherRef = useRef(null);
  const copy = labels[language === 'rw' || language === 'fr' ? language : 'en'];

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-24)));
  }, [messages]);

  useEffect(() => {
    if (conversationRef.current) conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (!isOpen || fullPage) return undefined;
    composerInputRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [fullPage, isOpen]);

  async function requestAssistant(payload) {
    const response = await fetch('/api/shopping-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'The assistant could not respond. Please try again.');
    return result;
  }

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isLoading) return;
    const userMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage].slice(-12);
    setMessages(previous => [...previous, userMessage].slice(-24));
    setInput('');
    setError('');
    setIsOpen(true);
    setIsLoading(true);
    try {
      const result = await requestAssistant({
        language,
        messages: nextMessages.map(({ role, content: messageContent, productIds }) => ({ role, content: messageContent, productIds }))
      });
      setMessages(previous => [...previous, {
        role: 'assistant',
        content: result.reply || '',
        products: Array.isArray(result.products) ? result.products : [],
        comparison: result.comparison || null,
        productIds: Array.isArray(result.productIds) ? result.productIds : [],
        nextPage: result.hasMore && result.nextOffset != null ? { offset: result.nextOffset } : null,
        searchFilters: result.searchFilters || null
      }].slice(-24));
    } catch (requestError) {
      setError(requestError.message || 'The assistant could not respond. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function showMore(message) {
    if (!message.nextPage || isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      const result = await requestAssistant({
        language,
        page: {
          filters: message.searchFilters || {},
          offset: message.nextPage.offset
        }
      });
      setMessages(previous => previous.map(item => item === message
        ? {
          ...item,
          products: [...(item.products || []), ...(result.products || [])],
          productIds: [...(item.productIds || []), ...(result.productIds || [])].slice(-8),
          nextPage: result.hasMore && result.nextOffset != null ? { offset: result.nextOffset } : null
        }
        : item));
    } catch (requestError) {
      setError(requestError.message || 'Could not load more listings.');
    } finally {
      setIsLoading(false);
    }
  }

  function startNewChat() {
    const selectedLanguage = language === 'rw' || language === 'fr' ? language : 'en';
    setMessages([{ role: 'assistant', content: welcomeMessages[selectedLanguage], products: [] }]);
    setError('');
  }

  const conversation = (
    <div className={`assistant-chat ${fullPage ? 'assistant-chat-full' : ''}`}>
      <div className="assistant-chat-header">
        <div className="assistant-avatar"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></div>
        <div className="assistant-chat-heading"><strong>{copy.title}</strong><span>{copy.subtitle}</span></div>
        <label className="assistant-language-picker">
          <span className="visually-hidden">Assistant language</span>
          <select value={language} onChange={event => setLanguage(event.target.value)} aria-label="Assistant language">
            <option value="auto">Auto</option><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">Français</option>
          </select>
        </label>
        <button type="button" className="assistant-icon-button" onClick={startNewChat} aria-label={copy.clear} title={copy.clear}><i className="fa-solid fa-rotate-right" aria-hidden="true"></i></button>
        {!fullPage && <button type="button" className="assistant-icon-button" onClick={() => { setIsOpen(false); launcherRef.current?.focus(); }} aria-label={copy.close}><i className="fa-solid fa-xmark" aria-hidden="true"></i></button>}
      </div>
      <div className="assistant-conversation" ref={conversationRef} aria-live="polite">
        {messages.map((message, index) => (
          <div className={`assistant-message-row ${message.role === 'user' ? 'assistant-message-user' : ''}`} key={`${index}-${message.role}`}>
            {message.role === 'assistant' && <span className="assistant-message-avatar"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span>}
            <div className="assistant-message-content">
              <div className="assistant-message-bubble">{message.content}</div>
              {message.products?.length > 0 && (
                <section className="assistant-results">
                  <h4>{copy.products}</h4>
                  <div className="assistant-product-grid">{message.products.map(product => <ProductCard key={product.id} product={product} />)}</div>
                  <Comparison comparison={message.comparison} language={language === 'rw' || language === 'fr' ? language : 'en'} />
                  {message.nextPage && <button type="button" className="assistant-load-more" onClick={() => showMore(message)}>{copy.more}</button>}
                </section>
              )}
              {!message.products?.length && message.comparison && <Comparison comparison={message.comparison} language={language === 'rw' || language === 'fr' ? language : 'en'} />}
            </div>
          </div>
        ))}
        {messages.length <= 1 && !isLoading && (
          <div className="assistant-suggestions">
            {(suggestions[language === 'rw' || language === 'fr' ? language : 'en']).map(suggestion => (
              <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>
            ))}
          </div>
        )}
        {isLoading && <div className="assistant-loading" role="status"><span className="assistant-spinner"></span>{copy.loading}</div>}
      </div>
      {error && <div className="assistant-error" role="alert">{error}</div>}
      {!fullPage && <a className="assistant-full-link" href="/shopping-assistant">{copy.expand}<i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>}
      <form className="assistant-composer" onSubmit={event => { event.preventDefault(); sendMessage(); }}>
        <textarea
          ref={composerInputRef}
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder={copy.input}
          aria-label={copy.input}
          rows="1"
          maxLength="1600"
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading} aria-label={copy.send}><i className="fa-solid fa-paper-plane" aria-hidden="true"></i><span>{copy.send}</span></button>
      </form>
    </div>
  );

  if (fullPage) {
    return <main className="assistant-page"><div className="assistant-page-intro"><span><i className="fa-solid fa-sparkles" aria-hidden="true"></i> ISOKOHUB AI</span><h1>Shop smarter with IsokoHub</h1><p>Search real listings, compare details, and get help in English, Kinyarwanda, or French.</p></div>{conversation}</main>;
  }

  return (
    <div className="assistant-widget">
      {isOpen && <div id="isokohub-assistant-dialog" className="assistant-floating-panel" role="dialog" aria-label={copy.title}>{conversation}</div>}
      <button ref={launcherRef} type="button" className="assistant-launcher" onClick={() => setIsOpen(open => !open)} aria-haspopup="dialog" aria-controls="isokohub-assistant-dialog" aria-expanded={isOpen} aria-label={isOpen ? copy.close : copy.title}>
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-wand-magic-sparkles'}`} aria-hidden="true"></i>
        {!isOpen && <span>Ask Isoko AI</span>}
      </button>
    </div>
  );
}
