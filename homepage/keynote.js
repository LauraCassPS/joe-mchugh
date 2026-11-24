(() => {
  const enquiry = document.querySelector('.keynote-invitation a[href="#keynote-message"]');
  const disclosure = document.querySelector('#keynote-message');
  if (!disclosure) return;
  const openMessage = () => { disclosure.open = true; };
  enquiry?.addEventListener('click', () => {
    openMessage();
    disclosure.querySelector('summary').focus({ preventScroll: true });
  });
  const openFromHash = () => {
    if (location.hash === '#keynote-message') openMessage();
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
