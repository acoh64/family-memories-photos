(function () {
  'use strict';

  const gallery = document.getElementById('gallery');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const tagsBar = document.getElementById('tagsBar');
  const viewBtns = document.querySelectorAll('.view-btn');

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDate = document.getElementById('lightboxDate');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxTags = document.getElementById('lightboxTags');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  const lightboxClose = document.querySelector('.lightbox-close');

  let memories = [];
  let activeTag = null;
  let currentView = 'grid';
  let currentLightbox = null;
  let currentPhotoIndex = 0;

  async function loadMemories() {
    try {
      const res = await fetch('data/memories.json');
      if (!res.ok) throw new Error('Failed to load');
      memories = await res.json();
    } catch {
      memories = [];
    }
    buildTagBar();
    render();
  }

  /* ---- Tag bar ---- */

  function buildTagBar() {
    const allTags = new Set();
    memories.forEach(m => (m.tags || []).forEach(t => allTags.add(t)));
    tagsBar.innerHTML = '';
    allTags.forEach(tag => {
      const chip = document.createElement('button');
      chip.className = 'tag-chip';
      chip.textContent = tag;
      chip.addEventListener('click', () => {
        activeTag = activeTag === tag ? null : tag;
        document.querySelectorAll('.tag-chip').forEach(c =>
          c.classList.toggle('active', c.textContent === activeTag)
        );
        render();
      });
      tagsBar.appendChild(chip);
    });
  }

  /* ---- Filtering & sorting ---- */

  function getFiltered() {
    const query = searchInput.value.toLowerCase().trim();
    let list = memories;

    if (activeTag) {
      list = list.filter(m => (m.tags || []).includes(activeTag));
    }
    if (query) {
      list = list.filter(m =>
        m.title.toLowerCase().includes(query) ||
        (m.description || '').toLowerCase().includes(query) ||
        (m.tags || []).some(t => t.toLowerCase().includes(query))
      );
    }

    const dir = sortSelect.value === 'oldest' ? 1 : -1;
    list = [...list].sort((a, b) => dir * (new Date(b.date) - new Date(a.date)));
    return list;
  }

  /* ---- Rendering ---- */

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function createCard(mem) {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const hasPhoto = mem.photos && mem.photos.length > 0 && mem.photos[0];
    const photoEl = hasPhoto
      ? `<img class="card-photo" src="photos/${mem.photos[0]}" alt="${mem.title}" loading="lazy" onerror="this.classList.add('placeholder-photo');this.removeAttribute('src');">`
      : '<div class="card-photo placeholder-photo"></div>';

    const tags = (mem.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('');

    card.innerHTML = `
      ${photoEl}
      <div class="card-body">
        <h3 class="card-title">${mem.title}</h3>
        <time class="card-date" datetime="${mem.date}">${formatDate(mem.date)}</time>
        <p class="card-desc">${mem.description || ''}</p>
        <div class="card-tags">${tags}</div>
      </div>
    `;

    card.addEventListener('click', () => openLightbox(mem));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(mem); }
    });

    return card;
  }

  function render() {
    const list = getFiltered();
    gallery.innerHTML = '';
    gallery.className = currentView === 'timeline' ? 'gallery timeline-view' : 'gallery grid-view';

    if (list.length === 0) {
      emptyState.hidden = false;
      gallery.hidden = true;
      return;
    }

    emptyState.hidden = true;
    gallery.hidden = false;

    list.forEach(mem => {
      const card = createCard(mem);
      gallery.appendChild(card);
    });

    observeCards();
  }

  /* ---- Scroll animations ---- */

  function observeCards() {
    const cards = gallery.querySelectorAll('.memory-card');
    if (!('IntersectionObserver' in window)) {
      cards.forEach(c => c.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(c => obs.observe(c));
  }

  /* ---- Lightbox ---- */

  function openLightbox(mem) {
    currentLightbox = mem;
    currentPhotoIndex = 0;
    updateLightboxPhoto();

    lightboxTitle.textContent = mem.title;
    lightboxDate.textContent = formatDate(mem.date);
    lightboxDate.setAttribute('datetime', mem.date);
    lightboxDesc.textContent = mem.description || '';
    lightboxTags.innerHTML = (mem.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('');

    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    setTimeout(() => { lightbox.hidden = true; }, 300);
    document.body.style.overflow = '';
    currentLightbox = null;
  }

  function updateLightboxPhoto() {
    const photos = currentLightbox.photos || [];
    if (photos.length > 0 && photos[currentPhotoIndex]) {
      lightboxImg.src = 'photos/' + photos[currentPhotoIndex];
      lightboxImg.alt = currentLightbox.title;
      lightboxImg.classList.remove('placeholder');
      lightboxImg.onerror = function () {
        this.classList.add('placeholder');
        this.removeAttribute('src');
      };
    } else {
      lightboxImg.removeAttribute('src');
      lightboxImg.alt = '';
      lightboxImg.classList.add('placeholder');
    }

    const total = photos.length;
    lightboxCounter.textContent = total > 1 ? `${currentPhotoIndex + 1} / ${total}` : '';
    lightboxPrev.style.display = total > 1 ? '' : 'none';
    lightboxNext.style.display = total > 1 ? '' : 'none';
  }

  lightboxPrev.addEventListener('click', e => {
    e.stopPropagation();
    if (!currentLightbox) return;
    const photos = currentLightbox.photos || [];
    currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
    updateLightboxPhoto();
  });

  lightboxNext.addEventListener('click', e => {
    e.stopPropagation();
    if (!currentLightbox) return;
    const photos = currentLightbox.photos || [];
    currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
    updateLightboxPhoto();
  });

  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!currentLightbox) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev.click();
    if (e.key === 'ArrowRight') lightboxNext.click();
  });

  /* ---- Controls ---- */

  searchInput.addEventListener('input', render);
  sortSelect.addEventListener('change', render);

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      currentView = btn.dataset.view;
      render();
    });
  });

  /* ---- Init ---- */

  loadMemories();
})();
