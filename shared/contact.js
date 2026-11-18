// Native POST remains available when JavaScript is unavailable.
document.querySelectorAll('.contact-form').forEach(form => {
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.querySelector('span');
  const status = form.querySelector('[role="status"]');
  const message = form.querySelector('textarea');
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const data = new FormData(form);
    const controls = Array.from(form.querySelectorAll('input, textarea, button'));
    const disabledStates = controls.map(control => control.disabled);
    sending = true;
    controls.forEach(control => { control.disabled = true; });
    button.setAttribute('aria-busy', 'true');
    buttonLabel.textContent = 'Sending…';
    status.textContent = 'Sending your message…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: data, headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (response.ok) {
        form.reset();
        message.style.height = '74px';
        status.textContent = 'Thank you — your message has been sent to Joe.';
      } else {
        const result = await response.json().catch(() => ({}));
        const errors = Array.isArray(result.errors)
          ? result.errors.map(error => error.message).filter(value => typeof value === 'string').join(' ')
          : '';
        status.textContent = response.status === 429
          ? 'Your message wasn’t sent. Please wait a moment and try again. Your details are still here.'
          : `Your message wasn’t sent. ${errors || 'Please try again in a moment.'} Your details are still here.`;
      }
    } catch {
      status.textContent = 'We couldn’t confirm that your message was sent. Check your connection and try again. Your details are still here.';
    } finally {
      clearTimeout(timeout);
      controls.forEach((control, index) => { control.disabled = disabledStates[index]; });
      button.removeAttribute('aria-busy');
      buttonLabel.textContent = 'Send Message';
      sending = false;
    }
  });
  message.addEventListener('input', () => {
    message.style.height = 'auto';
    message.style.height = `${Math.min(240, Math.max(74, message.scrollHeight + 2))}px`;
  });
});
function revealMessageFromHash() {
  if (location.hash === '#keynote-message') {
    const disclosure = document.getElementById('keynote-message');
    if (disclosure) disclosure.open = true;
  }
}
revealMessageFromHash();
window.addEventListener('hashchange', revealMessageFromHash);
