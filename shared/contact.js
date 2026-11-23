// Native POST remains available when JavaScript is unavailable.
document.querySelectorAll('.contact-form').forEach(form => {
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.querySelector('span');
  const status = form.querySelector('[role="status"]');
  const message = form.querySelector('textarea');
  let sending = false;
  let sent = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || sent || !form.reportValidity()) return;
    const data = new FormData(form);
    const newsletterRequested = data.get('newsletter_consent') === 'Yes';
    const newsletterEmail = data.get('email');
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
        sent = true;
        const container = form.closest('.contact-message');
        const heading = container.querySelector('h2, h3');
        const confirmation = document.createElement('div');
        confirmation.className = 'contact-confirmation';
        confirmation.tabIndex = -1;
        confirmation.setAttribute('role', 'region');
        confirmation.setAttribute('aria-label', 'Message sent');
        const title = document.createElement(heading.tagName.toLowerCase());
        title.textContent = 'Thank you for getting in touch.';
        const copy = document.createElement('p');
        copy.textContent = 'Your message has been sent. I’ll get back to you within two working days.';
        const signature = document.createElement('p');
        signature.className = 'contact-signature';
        signature.textContent = 'Joe';
        confirmation.append(title, copy, signature);
        let newsletterStatus;
        if (newsletterRequested) {
          newsletterStatus = document.createElement('p');
          newsletterStatus.className = 'newsletter-result';
          newsletterStatus.setAttribute('role', 'status');
          newsletterStatus.textContent = 'Your message is sent. Submitting your newsletter signup…';
          confirmation.append(newsletterStatus);
        }
        container.append(confirmation);
        container.classList.add('is-sent');
        confirmation.focus({ preventScroll: true });
        confirmation.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        if (newsletterRequested) {
          const newsletterController = new AbortController();
          const newsletterTimeout = setTimeout(() => newsletterController.abort(), 15000);
          try {
            const signupForm = document.querySelector('form[data-sv-form="10230985"]');
            if (!signupForm) throw new Error('Newsletter form unavailable');
            const signupData = new FormData();
            signupData.append('email_address', newsletterEmail);
            const signupResponse = await fetch(signupForm.action, {
              method: 'POST', body: signupData,
              headers: { Accept: 'application/json' },
              signal: newsletterController.signal
            });
            const signupResult = await signupResponse.json();
            // Kit may require an additional consent or verification step.
            if (!signupResponse.ok || signupResult.status !== 'success' || signupResult.consent?.enabled) {
              throw new Error('Newsletter signup needs another step');
            }
            newsletterStatus.textContent = 'Your newsletter signup has been received. Check your email to confirm your subscription.';
          } catch {
            newsletterStatus.textContent = 'Your message was sent, but we couldn’t confirm your newsletter signup. ';
            const signupLink = document.createElement('a');
            signupLink.href = '#newsletter-title';
            signupLink.textContent = 'Complete your newsletter signup below.';
            newsletterStatus.append(signupLink);
          } finally {
            clearTimeout(newsletterTimeout);
          }
        }
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
