document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();

  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.tool-card');
  const filterHelp = document.querySelector('.filter-help');
  const filterMessages = {
    starter: '第一次使用，先试这 3 个：一个在线工具、一个工作 Skill、一个输出 Skill。',
    work: '适合会议、周报、表格分析和项目推进。遇到哪类任务，就装哪一个。',
    learn: '适合查找现成 Skill、吃透资料、分析数据和验证想法。',
    create: '适合把已有材料做成文章、口播或 PPT，不需要从空白开始。',
    all: '这里是全部 10 个工具。已经知道自己要做什么时，再从完整清单里挑。'
  };

  const applyFilter = (selected) => {
    cards.forEach((card) => {
      const types = card.dataset.types.split(' ');
      card.classList.toggle('hidden', selected !== 'all' && !types.includes(selected));
    });
    filterHelp.textContent = filterMessages[selected];
  };

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const selected = button.dataset.filter;
      applyFilter(selected);
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });

  applyFilter(document.querySelector('.filter.active').dataset.filter);

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
