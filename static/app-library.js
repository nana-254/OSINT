/* Enhanced library experience for OSINT asset management. */
const state = {
  items: [],
  activeTypes: new Set(),
  search: '',
  sortKey: 'date'
};

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('library-grid');
  const emptyState = document.getElementById('library-empty');
  const tpl = document.getElementById('card-tpl');
  const refreshBtn = document.getElementById('refresh-btn');
  const uploadInput = document.getElementById('upload-input');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const filterRow = document.getElementById('filter-row');
  const statTotal = document.getElementById('stat-total');
  const statVisible = document.getElementById('stat-visible');
  const statTypes = document.getElementById('stat-types');
  const statRefresh = document.getElementById('stat-refresh');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalBody = document.getElementById('modal-body');
  const previewPane = document.getElementById('preview-pane');
  const modalFooter = document.getElementById('modal-footer');
  const modalClose = document.getElementById('modal-close');
  const rootArea = document.getElementById('library-root');

  refreshBtn.addEventListener('click', loadItems);
  searchInput.addEventListener('input', onSearchChange);
  sortSelect.addEventListener('change', onSortChange);
  modalClose.addEventListener('click', hideModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) hideModal(); });

  uploadInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const uploads = files.map((file, index) => normalizeItem({
      id: `local-${Date.now()}-${index}`,
      title: file.name,
      type: file.type || 'file',
      url: URL.createObjectURL(file),
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      description: 'Local upload — not persisted',
      date: new Date().toISOString(),
      source: 'Local upload'
    }));
    state.items = [...uploads, ...state.items];
    refreshFilters();
    applyFilters();
  });

  rootArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    rootArea.classList.add('drag-over');
  });
  rootArea.addEventListener('dragleave', () => rootArea.classList.remove('drag-over'));
  rootArea.addEventListener('drop', async (event) => {
    event.preventDefault();
    rootArea.classList.remove('drag-over');
    const files = Array.from(event.dataTransfer.files || []);
    if (!files.length) return;
    const uploads = files.map((file, index) => normalizeItem({
      id: `drop-${Date.now()}-${index}`,
      title: file.name,
      type: file.type || 'file',
      url: URL.createObjectURL(file),
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      description: 'Dropped local upload — not persisted',
      date: new Date().toISOString(),
      source: 'Drag & drop'
    }));
    state.items = [...uploads, ...state.items];
    refreshFilters();
    applyFilters();
  });

  async function tryFetchManifests() {
    const candidates = ['/library_manifest.json', '/OSINT.json', '/static/library_manifest.json'];
    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, { cache: 'no-store' });
        if (!response.ok) continue;
        const json = await response.json();
        if (candidate.endsWith('OSINT.json')) {
          return Array.isArray(json) ? json : json.items || [];
        }
        return Array.isArray(json) ? json : json.items || [];
      } catch (error) {
        // ignore invalid manifest candidates
      }
    }
    return [];
  }

  async function loadItems() {
    const manifest = await tryFetchManifests();
    state.items = manifest.length ? manifest.map(normalizeItem) : getSampleData();
    refreshFilters();
    applyFilters();
    statRefresh.textContent = new Date().toLocaleString();
  }

  function normalizeItem(item) {
    const typeLabel = getTypeLabel(item.type || item.filetype || 'file');
    return {
      id: item.id || item.title || `asset-${Math.random().toString(36).slice(2, 10)}`,
      title: item.title || item.name || 'Untitled asset',
      type: typeLabel.key,
      label: typeLabel.label,
      description: item.description || item.summary || 'No description available.',
      date: item.date || item.created || item.timestamp || new Date().toISOString(),
      thumbnail: item.thumbnail || item.preview || item.image || item.url || getPlaceholder(item),
      url: item.url || item.path || item.href || null,
      source: item.source || 'Manifest'
    };
  }

  function getTypeLabel(rawType) {
    const normalized = (rawType || '').toString().toLowerCase();
    if (normalized.includes('image')) return { key: 'image', label: 'Image' };
    if (normalized.includes('pdf')) return { key: 'document', label: 'Document' };
    if (normalized.includes('video')) return { key: 'video', label: 'Video' };
    if (normalized.includes('audio')) return { key: 'audio', label: 'Audio' };
    if (normalized.includes('zip') || normalized.includes('archive')) return { key: 'archive', label: 'Archive' };
    if (normalized.includes('text') || normalized.includes('json') || normalized.includes('xml')) return { key: 'text', label: 'Text' };
    return { key: 'file', label: 'File' };
  }

  function getPlaceholder(item) {
    const label = item.type ? item.type.toString().toUpperCase() : 'FILE';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#070b11"/><text x="50%" y="50%" fill="#5fcfff" font-family="Inter,Arial,sans-serif" font-size="32" text-anchor="middle" alignment-baseline="central">${label}</text></svg>`
    );
  }

  function getSampleData() {
    return [
      normalizeItem({
        id: 's1',
        title: 'Ultimate 3-Tier OSINT Master Workflow',
        type: 'document/pdf',
        url: 'https://example.com/sample.pdf',
        thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=900&q=60',
        description: 'Master workflow summary and operational playbook exported as PDF.',
        date: '2026-05-31'
      }),
      normalizeItem({
        id: 's2',
        title: 'Dashboard Preview',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=60',
        thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&q=60',
        description: 'Screenshot preview of the tactical dashboard and analytics pane.',
        date: '2026-05-31'
      }),
      normalizeItem({
        id: 's3',
        title: 'Collected Media Pack',
        type: 'archive/zip',
        url: 'https://example.com/media.zip',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=60',
        description: 'Zipped collection of captured artifacts, images, and report packets.',
        date: '2026-05-30'
      })
    ];
  }

  function refreshFilters() {
    const types = [...new Set(state.items.map((item) => item.label))];
    filterRow.innerHTML = '';
    types.forEach((type) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'filter-chip';
      chip.textContent = type;
      chip.dataset.type = type;
      if (state.activeTypes.has(type)) chip.classList.add('active');
      chip.addEventListener('click', () => {
        if (state.activeTypes.has(type)) {
          state.activeTypes.delete(type);
        } else {
          state.activeTypes.add(type);
        }
        refreshFilters();
        applyFilters();
      });
      filterRow.appendChild(chip);
    });
    if (types.length) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'filter-chip';
      clear.textContent = 'Clear filters';
      clear.addEventListener('click', () => {
        state.activeTypes.clear();
        refreshFilters();
        applyFilters();
      });
      filterRow.appendChild(clear);
    }
  }

  function onSearchChange(event) {
    state.search = event.target.value.trim().toLowerCase();
    applyFilters();
  }

  function onSortChange(event) {
    state.sortKey = event.target.value;
    applyFilters();
  }

  function applyFilters() {
    const filtered = state.items.filter((item) => {
      const matchesSearch = state.search
        ? `${item.title} ${item.description} ${item.label}`.toLowerCase().includes(state.search)
        : true;
      const matchesType = state.activeTypes.size ? state.activeTypes.has(item.label) : true;
      return matchesSearch && matchesType;
    });
    const sorted = [...filtered].sort(sortItems);
    renderGrid(sorted);
    updateStats(sorted);
  }

  function sortItems(a, b) {
    if (state.sortKey === 'name') {
      return a.title.localeCompare(b.title);
    }
    if (state.sortKey === 'type') {
      return a.label.localeCompare(b.label) || new Date(b.date) - new Date(a.date);
    }
    return new Date(b.date) - new Date(a.date);
  }

  function updateStats(filteredItems) {
    statTotal.textContent = state.items.length;
    statVisible.textContent = filteredItems.length;
    statTypes.textContent = [...new Set(state.items.map((item) => item.label))].length;
  }

  function renderGrid(items) {
    grid.innerHTML = '';
    if (!items.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    items.forEach((item) => {
      const node = tpl.content.cloneNode(true);
      const img = node.querySelector('img');
      const title = node.querySelector('.card-title');
      const badge = node.querySelector('.type-badge');
      const desc = node.querySelector('.card-desc');
      const filetype = node.querySelector('.detail-filetype');
      const date = node.querySelector('.detail-date');
      const openBtn = node.querySelector('.open-btn');
      const detailsBtn = node.querySelector('.details-btn');

      img.src = item.thumbnail;
      img.alt = item.title;
      title.textContent = item.title;
      badge.textContent = item.label;
      desc.textContent = item.description;
      filetype.textContent = `Type: ${item.label}`;
      date.textContent = `Date: ${new Date(item.date).toLocaleDateString()}`;

      openBtn.addEventListener('click', () => openAsset(item));
      detailsBtn.addEventListener('click', () => showDetails(item));
      grid.appendChild(node);
    });
  }

  function openAsset(item) {
    if (!item.url) return;
    window.open(item.url, '_blank', 'noreferrer');
  }

  function showDetails(item) {
    modalTitle.textContent = item.title;
    modalMeta.innerHTML = `
      <span>Type: ${item.label}</span>
      <span>Date: ${new Date(item.date).toLocaleString()}</span>
      <span>Source: ${item.source}</span>
    `;
    previewPane.innerHTML = '';
    modalBody.innerHTML = '';
    modalFooter.innerHTML = '';

    const preview = createPreview(item);
    previewPane.appendChild(preview);

    const detailsList = document.createElement('div');
    detailsList.innerHTML = `
      <p><strong>Description</strong><br>${item.description}</p>
      <p><strong>Asset ID</strong><br>${item.id}</p>
      <p><strong>Original URL</strong><br>${item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">${item.url}</a>` : 'Not available'}</p>
    `;
    modalBody.appendChild(detailsList);

    const openButton = document.createElement('a');
    openButton.href = item.url || '#';
    openButton.target = '_blank';
    openButton.rel = 'noreferrer';
    openButton.textContent = item.url ? 'Open raw asset' : 'No link available';
    openButton.className = item.url ? '' : 'disabled';
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copy asset ID';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(item.id).catch(() => {});
    });
    modalFooter.appendChild(openButton);
    modalFooter.appendChild(copyButton);
    modal.classList.add('active');
  }

  function createPreview(item) {
    const lower = (item.url || '').toLowerCase();
    if (!item.url) {
      return createPreviewMessage('No preview available for this item.');
    }
    if (item.label === 'Image' || lower.match(/\.(png|jpe?g|gif|webp|bmp)$/)) {
      const image = document.createElement('img');
      image.src = item.url;
      image.alt = item.title;
      return image;
    }
    if (item.label === 'Video' || lower.match(/\.(mp4|webm|mov|ogg)$/)) {
      const video = document.createElement('video');
      video.src = item.url;
      video.controls = true;
      video.autoplay = false;
      return video;
    }
    if (item.label === 'Audio' || lower.match(/\.(mp3|wav|ogg|m4a)$/)) {
      const audio = document.createElement('audio');
      audio.src = item.url;
      audio.controls = true;
      return audio;
    }
    if (lower.endsWith('.pdf') || item.type === 'document') {
      const iframe = document.createElement('iframe');
      iframe.src = item.url;
      iframe.title = item.title;
      return iframe;
    }
    return createPreviewMessage('Preview not available for this file type. Click Open raw asset to view it.');
  }

  function createPreviewMessage(text) {
    const message = document.createElement('div');
    message.className = 'preview-message';
    message.textContent = text;
    return message;
  }

  function hideModal() {
    modal.classList.remove('active');
  }

  loadItems();
});
