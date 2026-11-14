(() => {
  const enquiry = document.querySelector('.keynote-invitation a');
  const disclosure = document.querySelector('#keynote-message');
  if (!enquiry || !disclosure) return;
  const openMessage = () => { disclosure.open = true; };
  enquiry.addEventListener('click', () => {
    openMessage();
    disclosure.querySelector('summary').focus({ preventScroll: true });
  });
  const openFromHash = () => {
    if (location.hash === '#keynote-message') openMessage();
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
