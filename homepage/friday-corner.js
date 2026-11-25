(() => {
  const feed = document.querySelector('#friday-live-widget');
  const embed = feed.querySelector('[data-embed-id]');

  function loadFeed() {
    // The provider creates an open shadow root when it mounts the feed.
    const mountObserver = new MutationObserver(() => {
      const root = embed.shadowRoot;
      if (!root) return;
      const styles = new CSSStyleSheet();
      styles.replaceSync('.sk-post-body a[href] { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .15em; }');
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, styles];
      mountObserver.disconnect();
    });
    mountObserver.observe(embed, { attributes: true });
    const script = document.createElement('script');
    script.src = 'https://widgets.sociablekit.com/linkedin-profile-posts/widget.js';
    script.addEventListener('error', () => mountObserver.disconnect(), { once: true });
    document.head.append(script);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        loadFeed();
      }
    }, { rootMargin: '700px 0px' });
    observer.observe(feed);
  } else {
    loadFeed();
  }
})();
