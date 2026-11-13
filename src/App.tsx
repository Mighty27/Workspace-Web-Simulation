/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OSProvider } from './context/OSContext';
import { DashboardStoreProvider } from './store/DashboardStore';
import { Desktop } from './components/shell/Desktop';
import { Taskbar } from './components/shell/Taskbar';
import { StartMenu } from './components/shell/StartMenu';
import { CommandPalette } from './components/shell/CommandPalette';
import { SystemModals } from './components/shell/SystemModals';

export default function App() {
  return (
    <DashboardStoreProvider>
      <OSProvider>
        <main className="relative w-screen h-dvh overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] select-none">
          <Desktop />
          <StartMenu />
          <Taskbar />
          <CommandPalette />
          <SystemModals />
        </main>
      </OSProvider>
    </DashboardStoreProvider>
  );
}
