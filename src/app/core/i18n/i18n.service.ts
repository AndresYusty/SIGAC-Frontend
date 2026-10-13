import { DOCUMENT, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';

export type Lang = 'en' | 'es';

export type TranslationParams = Record<string, string | number | null | undefined>;

type Dictionary = { [key: string]: string | Dictionary };

registerLocaleData(localeEsCo);

const STORAGE_KEY = 'sigac.lang';
const DICTIONARIES: Record<Lang, Dictionary> = { en, es };
const LOCALES: Record<Lang, string> = { en: 'en-US', es: 'es-CO' };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly langSig = signal<Lang>(this.restore());

  readonly lang = this.langSig.asReadonly();
  readonly languages: Lang[] = ['es', 'en'];
  /** Locale id for Angular formatting functions. */
  readonly locale = computed(() => LOCALES[this.langSig()]);

  constructor() {
    effect(() => {
      const lang = this.langSig();
      this.document.documentElement.lang = lang;
      this.document.title = this.t('app.documentTitle');
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  use(lang: Lang): void {
    this.langSig.set(lang);
  }

  t(key: string, params?: TranslationParams): string {
    const value = lookup(DICTIONARIES[this.langSig()], key) ?? lookup(DICTIONARIES.en, key) ?? key;
    if (!params) {
      return value;
    }
    return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
      const param = params[name];
      return param === null || param === undefined ? '' : String(param);
    });
  }

  private restore(): Lang {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
    return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
  }
}

function lookup(dict: Dictionary, key: string): string | null {
  let node: string | Dictionary | undefined = dict;
  for (const part of key.split('.')) {
    if (!node || typeof node === 'string') {
      return null;
    }
    node = node[part];
  }
  return typeof node === 'string' ? node : null;
}
