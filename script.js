// --- SHEET CONFIGURATION ---
const SHEETS = {
  main: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHaHBI3grXpyBaMf14WmFMgQLHYM7v11WJrakibIAxS6rV5TkQuNftofVrAllAcsCA3DYvliBxXXm_/pub?gid=0&single=true&output=csv',
  endlager: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHaHBI3grXpyBaMf14WmFMgQLHYM7v11WJrakibIAxS6rV5TkQuNftofVrAllAcsCA3DYvliBxXXm_/pub?gid=401520953&single=true&output=csv',
  stories: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHaHBI3grXpyBaMf14WmFMgQLHYM7v11WJrakibIAxS6rV5TkQuNftofVrAllAcsCA3DYvliBxXXm_/pub?gid=121198193&single=true&output=csv',
  zeit: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHaHBI3grXpyBaMf14WmFMgQLHYM7v11WJrakibIAxS6rV5TkQuNftofVrAllAcsCA3DYvliBxXXm_/pub?gid=1491121691&single=true&output=csv',
  gefahr: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHaHBI3grXpyBaMf14WmFMgQLHYM7v11WJrakibIAxS6rV5TkQuNftofVrAllAcsCA3DYvliBxXXm_/pub?gid=100273412&single=true&output=csv',
  glossary: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHaHBI3grXpyBaMf14WmFMgQLHYM7v11WJrakibIAxS6rV5TkQuNftofVrAllAcsCA3DYvliBxXXm_/pub?gid=1101912794&single=true&output=csv'
};

// --- MAIN FUNCTION ---
async function loadData() {
  const sidebarEl = document.getElementById('site-description');
  const entriesContainer = document.getElementById('entries');
  const sidebarButtonsEl = document.getElementById('sidebar-buttons');
  const mainButtonsEl = document.getElementById('main-buttons');

  sidebarEl.innerHTML = '';
  entriesContainer.innerHTML = '';

  const glossaryTerms = [];
  const sectionData = {};
  const sidebarTexts = {};

  // --- Helper: Load CSV from a given sheet ---
  async function loadSheet(url) {
    const response = await fetch(url);
    const text = await response.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    return parsed.data;
  }

  // --- Helper: Inject link inside text ---
  function injectLink(text, linkText, linkURL) {
    if (!text) return '';
    if (!linkText || !linkURL) return text;
    const escaped = linkText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    return text.replace(regex, `<a href="${linkURL}" target="_blank">${linkText}</a>`);
  }

  // --- Load each subsheet ---
  for (const [key, url] of Object.entries(SHEETS)) {
    try {
      const data = await loadSheet(url);

      if (key === 'glossary') {
        data.forEach(row => {
          if (row.Begriff && row.Definition) {
            glossaryTerms.push({
              term: row.Begriff,
              definition: row.Definition
            });
          }
        });
      } else if (key === 'main') {
        data.forEach(row => {
          const sectionKey = (row.Section || '').toLowerCase();
          if (sectionKey === 'about' || sectionKey === 'method') {
            sidebarTexts[sectionKey] = injectLink(
              row.Beschreibung || '',
              row['Link Text'],
              row['Link URL']
            );
          }
        });
      } else {
        sectionData[key] = data;
      }
    } catch (err) {
      console.warn(`Couldn't load ${key} sheet:`, err);
    }
  }

  // --- Button state toggle helper ---
  function setActiveButton(container, activeBtn) {
    container.querySelectorAll('button').forEach(btn => {
      if (btn === activeBtn) {
        btn.classList.add('active');
        btn.classList.remove('inactive');
      } else {
        btn.classList.remove('active');
        btn.classList.add('inactive');
      }
    });
  }

  // --- Sidebar buttons ---
  sidebarButtonsEl.querySelectorAll('button').forEach(btn => {
    btn.classList.add('inactive'); // initialize all as inactive
    btn.addEventListener('click', () => {
      const key = btn.dataset.section.toLowerCase();
      updateSidebar(key);
      setActiveButton(sidebarButtonsEl, btn);
    });
  });

  // --- Main buttons ---
  mainButtonsEl.querySelectorAll('button').forEach(btn => {
    btn.classList.add('inactive'); // initialize all as inactive
    btn.addEventListener('click', () => {
      const key = btn.dataset.content.toLowerCase();
      if (key === 'glossary') {
        displayGlossaryInMain();
      } else {
        updateMain(key);
      }
      setActiveButton(mainButtonsEl, btn);
    });
  });

  // --- Sidebar content handler ---
  function updateSidebar(key) {
    sidebarEl.innerHTML = '';
    if (sidebarTexts[key]) {
      sidebarEl.innerHTML = sidebarTexts[key]
        .split(/\r?\n/)
        .map(p => `<p>${p}</p>`)
        .join('');
    } else {
      sidebarEl.innerHTML = '<p>No content available.</p>';
    }
  }

  // --- Main content handler ---
  function updateMain(key) {
    const sheet = sectionData[key];
    entriesContainer.innerHTML = '';
    entriesContainer.style.display = 'grid';
    entriesContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
    entriesContainer.style.gap = '1.5rem';

    if (sheet && sheet.length) {
      sheet.forEach(entry => {
        const widthClass =
          entry.Display === 'full'
            ? 'full-width'
            : entry.Display === 'half'
            ? 'half-width'
            : entry.Display === 'third'
            ? 'third-width'
            : '';

        const descriptionWithLink = injectLink(
          entry.Beschreibung,
          entry['Link Text'],
          entry['Link URL']
        );

        const card = document.createElement('div');
        card.className = `card ${widthClass}`;
        card.innerHTML = `
          ${entry['Image URL'] ? `<img src="${entry['Image URL']}" alt="">` : ''}
          <h2>${entry.Title || ''}</h2>
          <p>${descriptionWithLink || ''}</p>
          ${
            entry['Source Link']
              ? `<p><a href="${entry['Source Link']}" target="_blank">Source</a></p>`
              : ''
          }
          <small>${entry.Tags || ''}</small>
        `;

        if (entry['Chart Embed']) {
          const chartURLs = entry['Chart Embed'].split(',').map(u => u.trim());
          chartURLs.forEach(url => {
            if (!url) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-wrapper';
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.width = '100%';
            iframe.height = '400';
            iframe.frameBorder = '0';
            iframe.scrolling = 'no';
            iframe.style.borderRadius = '8px';
            wrapper.appendChild(iframe);
            card.appendChild(wrapper);
          });
        }

        entriesContainer.appendChild(card);
      });
    } else {
      entriesContainer.innerHTML = '<p>No content available.</p>';
    }
  }

  // --- Glossary display ---
  function displayGlossaryInMain() {
    entriesContainer.innerHTML = '';
    entriesContainer.style.display = 'flex';
    entriesContainer.style.flexDirection = 'column';
    entriesContainer.style.gap = '1rem';

    if (glossaryTerms.length === 0) {
      entriesContainer.innerHTML = '<p>No glossary terms available.</p>';
      return;
    }

    glossaryTerms.forEach(item => {
      const termEl = document.createElement('div');
      termEl.className = 'glossary-term';

      const title = document.createElement('h3');
      title.innerText = item.term;

      const definition = document.createElement('p');
      definition.innerText = item.definition;

      termEl.addEventListener('click', () => {
        termEl.classList.toggle('expanded');
      });

      termEl.appendChild(title);
      termEl.appendChild(definition);
      entriesContainer.appendChild(termEl);
    });
  }

  // --- Default load ---
  updateSidebar('about');
  updateMain('endlager');
  // Set initial active button states
  setActiveButton(sidebarButtonsEl, sidebarButtonsEl.querySelector('button'));
  setActiveButton(mainButtonsEl, mainButtonsEl.querySelector('button'));
}

// --- Load PapaParse if needed ---
if (typeof Papa === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
  script.onload = loadData;
  document.head.appendChild(script);
} else {
  loadData();
}
