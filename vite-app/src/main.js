import './style.css'

// ── Datos de las secciones ─────────────────────────────
const SECTIONS = [
  {
    id: 'internas',
    label: 'Búsquedas Internas',
    icon: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h7v4h-7v-4Z',
    options: ['Secuencial', 'Binaria'],
  },
  {
    id: 'externas',
    label: 'Búsquedas Externas',
    icon: 'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4',
    options: ['Función Mod', 'Función Cuadrado', 'Función Truncamiento', 'Conversión de Bases'],
  },
  {
    id: 'grafos',
    label: 'Grafos',
    icon: 'M6 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 7l8 0M7.5 8.5 11 13m6-4.5L13 13',
    options: ['Recorridos', 'Ruta más corta', 'Árbol de expansión'],
  },
]

// ── Estado ──────────────────────────────────────────────
let activeSection = SECTIONS[0]
let activeOption = activeSection.options[0]

// ── Referencias del DOM ─────────────────────────────────
const app          = document.getElementById('app')
const navEl        = document.getElementById('nav')
const tabsEl       = document.getElementById('tabs')
const toggleBtn    = document.getElementById('toggle')
const sectionLabel = document.getElementById('sectionLabel')
const phSection    = document.getElementById('phSection')
const phOption     = document.getElementById('phOption')

// ── Utilidad para crear íconos SVG ──────────────────────
function iconSvg(path) {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round"><path d="${path}"></path></svg>`
}

// ── Renderiza la navegación lateral ─────────────────────
function renderNav() {
  navEl.innerHTML = ''
  SECTIONS.forEach((section) => {
    const btn = document.createElement('button')
    btn.className = 'nav__item' + (section.id === activeSection.id ? ' is-active' : '')
    btn.title = section.label
    btn.innerHTML = `
      <span class="nav__icon">${iconSvg(section.icon)}</span>
      <span class="nav__label">
        <span class="nav__title">${section.label}</span>
        <span class="nav__count">${section.options.length} opciones</span>
      </span>`
    btn.addEventListener('click', () => {
      activeSection = section
      activeOption = section.options[0]
      renderAll()
    })
    navEl.appendChild(btn)
  })
}

// ── Renderiza las pestañas superiores ───────────────────
function renderTabs() {
  tabsEl.innerHTML = ''
  activeSection.options.forEach((option) => {
    const btn = document.createElement('button')
    btn.className = 'tab' + (option === activeOption ? ' is-active' : '')
    btn.textContent = option
    btn.addEventListener('click', () => {
      activeOption = option
      renderAll()
    })
    tabsEl.appendChild(btn)
  })
}

// ── Actualiza etiquetas y contenido ─────────────────────
function renderContent() {
  sectionLabel.textContent = activeSection.label
  phSection.textContent = activeSection.label
  phOption.textContent = activeOption
}

function renderAll() {
  renderNav()
  renderTabs()
  renderContent()
}

// ── Botón minimizar / expandir ──────────────────────────
toggleBtn.addEventListener('click', () => {
  const collapsed = app.classList.toggle('is-collapsed')
  toggleBtn.setAttribute('aria-label', collapsed ? 'Expandir barra' : 'Minimizar barra')
})

// ── Arranque ────────────────────────────────────────────
renderAll()
