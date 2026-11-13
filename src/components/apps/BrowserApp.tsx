import React, { useState, useEffect } from 'react';
import {
  Globe,
  RotateCw,
  ExternalLink,
  Plus,
  X,
  ShieldAlert,
  Bookmark,
  Search,
  Pin,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
}

const BOOKMARKS = [
  {
    name: 'Wikipedia ID',
    url: 'https://id.m.wikipedia.org/wiki/Sistem_operasi',
    embeddable: true,
  },
  {
    name: 'Excalidraw',
    url: 'https://excalidraw.com',
    embeddable: true,
  },
  {
    name: 'CyberChef',
    url: 'https://gchq.github.io/CyberChef/',
    embeddable: true,
  },
  {
    name: 'A Dark Room',
    url: 'https://adarkroom.doublespeakgames.com/',
    embeddable: true,
  },
  {
    name: 'GitHub (X-Frame Blocked)',
    url: 'https://github.com',
    embeddable: false,
  },
];

export const BrowserApp: React.FC<{ initialUrl?: string }> = ({ initialUrl }) => {
  const { settings, updateSettings, addDesktopShortcut, notify, t } = useOS();

  const defaultUrl = initialUrl || 'https://id.m.wikipedia.org/wiki/Sistem_operasi';
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Wikipedia — Sistem Operasi',
      url: defaultUrl,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [addressInput, setAddressInput] = useState(defaultUrl);
  const [iframeKey, setIframeKey] = useState(0);

  const activeTab = tabs.find((tb) => tb.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (initialUrl) {
      setTabs((prev) =>
        prev.map((tb) =>
          tb.id === activeTabId ? { ...tb, url: initialUrl, title: initialUrl } : tb
        )
      );
      setAddressInput(initialUrl);
    }
  }, [initialUrl]);

  const extractHostname = (rawUrl: string) => {
    try {
      return new URL(rawUrl).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  const currentHost = extractHostname(activeTab.url);
  const isKnownBlocked = settings.alwaysTabDomains.some(
    (d) => currentHost === d || currentHost.endsWith(`.${d}`)
  );

  const navigateTo = (rawInput: string) => {
    let target = rawInput.trim();
    if (!target) return;

    if (!/^https?:\/\//i.test(target)) {
      if (target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`;
      } else {
        // Search query -> route to embeddable Wikipedia search
        target = `https://id.m.wikipedia.org/w/index.php?search=${encodeURIComponent(target)}`;
      }
    }

    const host = extractHostname(target);
    setAddressInput(target);
    setTabs((prev) =>
      prev.map((tb) =>
        tb.id === activeTab.id
          ? { ...tb, url: target, title: host || target }
          : tb
      )
    );
  };

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const nextUrl = 'https://id.m.wikipedia.org/wiki/Komputasi_awan';
    setTabs((prev) => [
      ...prev,
      { id: newId, title: 'Wikipedia — Komputasi Awan', url: nextUrl },
    ]);
    setActiveTabId(newId);
    setAddressInput(nextUrl);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const filtered = tabs.filter((tb) => tb.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
      setAddressInput(filtered[0].url);
    }
  };

  const handleAlwaysOpenInTab = () => {
    if (!currentHost) return;
    if (!settings.alwaysTabDomains.includes(currentHost)) {
      updateSettings({
        alwaysTabDomains: [...settings.alwaysTabDomains, currentHost],
      });
      notify(
        t('Preferensi Domain Disimpan', 'Domain Preference Saved'),
        `${currentHost} ${t('akan selalu ditandai untuk dibuka di tab baru.', 'will always be flagged to open in a new tab.')}`,
        'browser'
      );
    }
  };

  const handlePinWebsiteToDesktop = () => {
    addDesktopShortcut({
      appId: 'browser',
      customName: currentHost || 'Web Shortcut',
      customUrl: activeTab.url,
      gridX: 2,
      gridY: Math.floor(Math.random() * 5),
      location: 'desktop',
    });
    notify(
      t('Shortcut Ditambahkan', 'Shortcut Added'),
      `${currentHost || activeTab.url} ${t('ditambahkan ke Desktop.', 'added to Desktop.')}`,
      'browser'
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs select-none">
      {/* Tab Strip */}
      <div className="flex items-center gap-1 px-2 pt-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((tb) => {
          const active = tb.id === activeTab.id;
          return (
            <div
              key={tb.id}
              onClick={() => {
                setActiveTabId(tb.id);
                setAddressInput(tb.url);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x text-xs cursor-pointer max-w-[200px] shrink-0 transition-colors ${
                active
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-white'
                  : 'bg-slate-200/50 dark:bg-slate-900/40 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Globe size={12} className="text-sky-500 shrink-0" />
              <span className="truncate">{tb.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tb.id);
                  }}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={handleAddTab}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
          title={t('Tab Baru', 'New Tab')}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Address & Bookmarks Bar */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(addressInput);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            title={t('Muat Ulang', 'Reload')}
          >
            <RotateCw size={13} />
          </button>

          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder={t(
                'Masukkan URL atau cari topik di Wikipedia...',
                'Enter URL or search Wikipedia topic...'
              )}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 font-mono text-xs focus:outline-none focus:border-sky-500 select-text"
            />
          </div>

          <button
            type="button"
            onClick={handlePinWebsiteToDesktop}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium whitespace-nowrap shrink-0"
            title={t('Simpan Shortcut ke Desktop', 'Pin Shortcut to Desktop')}
          >
            <Pin size={12} />
            <span className="hidden sm:inline">{t('Ke Desktop', 'To Desktop')}</span>
          </button>

          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-medium whitespace-nowrap shrink-0"
          >
            <ExternalLink size={12} />
            <span>{t('Tab Baru', 'New Tab')}</span>
          </a>
        </form>

        {/* Quick Bookmarks */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Bookmark size={12} className="text-slate-400 shrink-0 mr-1" />
          {BOOKMARKS.map((bm) => (
            <button
              key={bm.name}
              onClick={() => navigateTo(bm.url)}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0"
            >
              {bm.name}
            </button>
          ))}
        </div>
      </div>

      {/* Honest X-Frame-Options / CSP Help Banner (PRD Section 6 & 8.7) */}
      <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <ShieldAlert size={14} className="shrink-0" />
          <span>
            {isKnownBlocked
              ? t(
                  `Domain ${currentHost} memblokir penyematan iframe (X-Frame-Options / CSP).`,
                  `Domain ${currentHost} blocks iframe embedding (X-Frame-Options / CSP).`
                )
              : t(
                  'Halaman tidak tampil? Sebagian situs membatasi iframe demi keamanan.',
                  'Page not showing? Some websites restrict iframes for security.'
                )}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>{t('Buka di Tab Baru', 'Open in New Tab')}</span>
            <ExternalLink size={11} />
          </a>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <button
            onClick={handleAlwaysOpenInTab}
            className="text-slate-600 dark:text-slate-300 hover:underline"
          >
            {t('Selalu buka domain ini di tab', 'Always open this domain in tab')}
          </button>
        </div>
      </div>

      {/* Browser Viewport */}
      <div className="flex-1 bg-white relative">
        {isKnownBlocked ? (
          <div className="h-full w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <ShieldAlert size={40} className="text-amber-500 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {currentHost} {t('Membatasi Penyematan di Dalam Jendela', 'Restricts In-Window Embedding')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1.5 leading-relaxed">
              {t(
                'Sesuai prinsip transparansi WebWorkstation, situs ini menggunakan header keamanan X-Frame-Options atau Content-Security-Policy frame-ancestors sehingga tidak dapat dimuat di dalam iframe.',
                'In accordance with WebWorkstation transparency principles, this site sets X-Frame-Options or CSP frame-ancestors headers and cannot be rendered inside an iframe.'
              )}
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href={activeTab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              >
                <ExternalLink size={14} />
                <span>{t('Lanjutkan di Tab Browser Baru', 'Continue in New Browser Tab')}</span>
              </a>
              <button
                onClick={() =>
                  updateSettings({
                    alwaysTabDomains: settings.alwaysTabDomains.filter(
                      (d) => d !== currentHost
                    ),
                  })
                }
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                {t('Tetap Coba Muat Iframe', 'Try Loading Iframe Anyway')}
              </button>
            </div>
          </div>
        ) : (
          <iframe
            key={`${activeTab.id}-${iframeKey}`}
            src={activeTab.url}
            title={activeTab.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            className="w-full h-full border-none bg-white"
          />
        )}
      </div>
    </div>
  );
};
