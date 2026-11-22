type UiLang = 'pt' | 'en';
type Dictionary = Record<string, string>;

const storageKey = 'ds-lang';
const filterNames = ['attack', 'platform', 'type'] as const;

function readStoredLang(): UiLang | null {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === 'pt' || stored === 'en' ? stored : null;
  } catch {
    return null;
  }
}

function storeLang(lang: UiLang): void {
  try {
    localStorage.setItem(storageKey, lang);
  } catch {}
}

function initialLang(): UiLang {
  return readStoredLang() ?? (navigator.language && !navigator.language.toLowerCase().startsWith('pt') ? 'en' : 'pt');
}

function matchesAttack(card: HTMLElement, attack: string): boolean {
  if (!attack) return true;
  return (card.dataset.attack ?? '').split(' ').some((id) => id === attack || id.startsWith(`${attack}.`));
}

export function initLabsIndex(): void {
  const dictionaries = JSON.parse(document.getElementById('labs-i18n')?.textContent ?? '{}') as Record<UiLang, Dictionary>;
  const form = document.getElementById('filters') as HTMLFormElement;
  const cards = [...document.querySelectorAll<HTMLElement>('#post-list .post-card')];
  const countLabel = document.getElementById('result-count') as HTMLElement;
  const emptyLabel = document.getElementById('empty') as HTMLElement;
  const toggle = document.getElementById('lang-toggle') as HTMLButtonElement;
  let currentLang = initialLang();

  const pickVariant = (group: string): HTMLElement | undefined => {
    const variants = cards.filter((card) => card.dataset.group === group);
    return variants.find((card) => card.dataset.lang === currentLang) ?? variants[0];
  };

  const render = () => {
    const values = Object.fromEntries(filterNames.map((name) => [name, (form.elements.namedItem(name) as HTMLSelectElement).value]));
    const chosen = new Set([...new Set(cards.map((card) => card.dataset.group ?? ''))].map(pickVariant));
    let visible = 0;
    for (const card of cards) {
      const show = chosen.has(card)
        && matchesAttack(card, values.attack)
        && (!values.platform || card.dataset.platform === values.platform)
        && (!values.type || card.dataset.type === values.type);
      card.hidden = !show;
      if (show) visible += 1;
    }
    countLabel.textContent = String(visible);
    emptyLabel.hidden = visible > 0;
    const params = new URLSearchParams(Object.entries(values).filter(([, value]) => value));
    history.replaceState(null, '', params.size ? `?${params}` : location.pathname);
  };

  const setLang = (lang: UiLang) => {
    currentLang = lang;
    const dictionary = dictionaries[lang];
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
      const text = dictionary[element.dataset.i18n ?? ''];
      if (text) element.textContent = text;
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    document.title = dictionary['index.title'];
    toggle.querySelectorAll<HTMLElement>('span').forEach((span) => span.classList.toggle('on', span.dataset.lang === lang));
    storeLang(lang);
    render();
  };

  const params = new URLSearchParams(location.search);
  for (const name of filterNames) {
    const select = form.elements.namedItem(name) as HTMLSelectElement;
    const value = params.get(name) ?? '';
    if ([...select.options].some((option) => option.value === value)) select.value = value;
  }

  form.addEventListener('change', render);
  form.addEventListener('reset', () => setTimeout(render));
  toggle.addEventListener('click', () => setLang(currentLang === 'pt' ? 'en' : 'pt'));
  setLang(currentLang);
}
