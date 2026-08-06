document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();

  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.tool-card');

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const selected = button.dataset.filter;
      cards.forEach((card) => {
        const types = card.dataset.types.split(' ');
        card.classList.toggle('hidden', selected !== 'all' && !types.includes(selected));
      });
    });
  });

  const toast = document.querySelector('.toast');
  let toastTimer;
  document.querySelectorAll('.copy-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.closest('.prompt-box').querySelector('code').textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
    });
  });
});
