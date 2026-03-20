(function () {
  'use strict';

  const form = document.getElementById('memoryForm');
  const titleInput = document.getElementById('memTitle');
  const dateInput = document.getElementById('memDate');
  const descInput = document.getElementById('memDescription');
  const photosInput = document.getElementById('memPhotos');
  const tagsInput = document.getElementById('memTags');

  const previewTitle = document.getElementById('previewTitle');
  const previewDate = document.getElementById('previewDate');
  const previewDesc = document.getElementById('previewDesc');
  const previewTags = document.getElementById('previewTags');

  const jsonOutput = document.getElementById('jsonOutput');
  const jsonCode = document.getElementById('jsonCode');
  const copyBtn = document.getElementById('copyBtn');
  const copyToast = document.getElementById('copyToast');

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  function parseCsv(str) {
    return str
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  /* ---- Live preview ---- */

  function updatePreview() {
    previewTitle.textContent = titleInput.value || 'Your Memory Title';
    previewDate.textContent = formatDate(dateInput.value);
    previewDesc.textContent = descInput.value || 'Your memory description will appear here...';

    const tags = parseCsv(tagsInput.value);
    previewTags.innerHTML = tags.map(t => `<span class="card-tag">${t}</span>`).join('');
  }

  titleInput.addEventListener('input', updatePreview);
  dateInput.addEventListener('input', updatePreview);
  descInput.addEventListener('input', updatePreview);
  tagsInput.addEventListener('input', updatePreview);

  /* ---- Form submission ---- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = titleInput.value.trim();
    const date = dateInput.value;
    if (!title || !date) {
      alert('Please fill in at least the title and date.');
      return;
    }

    const entry = {
      id: slugify(title) || 'memory-' + Date.now(),
      title: title,
      description: descInput.value.trim(),
      date: date,
      photos: parseCsv(photosInput.value),
      tags: parseCsv(tagsInput.value)
    };

    const json = JSON.stringify(entry, null, 2);
    jsonCode.textContent = json;
    jsonOutput.hidden = false;
    jsonOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ---- Copy to clipboard ---- */

  copyBtn.addEventListener('click', async function () {
    const text = jsonCode.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    copyToast.hidden = false;
    setTimeout(() => { copyToast.hidden = true; }, 1600);
  });
})();
