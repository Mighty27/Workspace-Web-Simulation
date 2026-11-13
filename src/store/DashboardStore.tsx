import React, { createContext, useContext, useSyncExternalStore, useRef, useCallback } from 'react';
import {
  DashboardStoreState,
  DashboardWorkspaceItem,
  WidgetDataMap,
  WidgetInstance,
  WidgetSpan,
  WidgetType,
  WidgetVisualState,
  WorkspaceTemplateId,
} from '../types/dashboard';
import {
  createInitialDashboardState,
  createWidgetInstance,
  createWorkspaceFromTemplate,
  getTodayDateKey,
  loadDashboardStateFromStorage,
  saveDashboardStateToStorage,
  validateAndParseDashboardImport,
  WIDGET_CATALOG_META,
} from '../utils/storageMigration';

type Listener = () => void;

export interface DashboardStoreApi {
  getState: () => DashboardStoreState;
  subscribe: (listener: Listener) => () => void;

  // Workspace actions
  setActiveWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, template: WorkspaceTemplateId) => DashboardWorkspaceItem;
  renameWorkspace: (workspaceId: string, newName: string) => void;
  deleteWorkspace: (workspaceId: string) => void;
  applyOnboardingTemplate: (template: WorkspaceTemplateId) => void;
  completeOnboarding: () => void;

  // Mode & UI actions
  setEditMode: (edit: boolean) => void;
  toggleEditMode: () => void;
  setShowDashboardOnDesktop: (show: boolean) => void;
  setShowDesktopShortcutsBar: (show: boolean) => void;
  setBrowserNotificationsEnabled: (enabled: boolean) => void;

  // Widget layout & lifecycle actions
  addWidget: (type: WidgetType) => void;
  duplicateWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
  reorderWidgets: (sourceId: string, targetId: string) => void;
  resizeWidget: (widgetId: string, colSpan: WidgetSpan, rowSpan?: 1 | 2) => void;
  renameWidget: (widgetId: string, title: string) => void;
  setWidgetSimulatedState: (widgetId: string, state: WidgetVisualState) => void;
  resetActiveWorkspaceLayout: () => void;

  // Widget data actions (isolated per widget)
  updateWidgetData: <T extends WidgetType>(
    widgetId: string,
    updater: (prev: WidgetDataMap[T]) => WidgetDataMap[T]
  ) => void;

  // Activity tracking for WeeklyActivityWidget
  recordFocusSessionCompleted: (widgetId: string) => void;
  recordTaskCompletionDelta: (delta: 1 | -1) => void;

  // Export & Import JSON
  exportDashboardJson: () => void;
  importDashboardJson: (rawJson: string) => { ok: boolean; message: string };
}

function createDashboardStore(): DashboardStoreApi {
  let state: DashboardStoreState = loadDashboardStateFromStorage();
  const listeners = new Set<Listener>();

  const setState = (updater: (prev: DashboardStoreState) => DashboardStoreState) => {
    const next = updater(state);
    if (next === state) return;
    state = next;
    saveDashboardStateToStorage(state);
    listeners.forEach((l) => l());
  };

  const getUniqueName = (baseName: string, existingNames: string[]): string => {
    const trimmed = baseName.trim() || 'Tanpa Nama';
    if (!existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return trimmed;
    }
    let counter = 2;
    while (
      existingNames.some(
        (n) => n.toLowerCase() === `${trimmed} (${counter})`.toLowerCase()
      )
    ) {
      counter++;
    }
    return `${trimmed} (${counter})`;
  };

  return {
    getState: () => state,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setActiveWorkspace: (workspaceId) => {
      setState((prev) => {
        if (!prev.workspaces.some((w) => w.id === workspaceId)) return prev;
        return { ...prev, activeWorkspaceId: workspaceId };
      });
    },

    createWorkspace: (name, template) => {
      let created!: DashboardWorkspaceItem;
      setState((prev) => {
        const uniqueName = getUniqueName(
          name,
          prev.workspaces.map((w) => w.name)
        );
        created = createWorkspaceFromTemplate(template, uniqueName);
        return {
          ...prev,
          activeWorkspaceId: created.id,
          workspaces: [...prev.workspaces, created],
        };
      });
      return created;
    },

    renameWorkspace: (workspaceId, newName) => {
      const cleaned = newName.trim();
      if (!cleaned) return;
      setState((prev) => {
        const otherNames = prev.workspaces
          .filter((w) => w.id !== workspaceId)
          .map((w) => w.name);
        const finalName = getUniqueName(cleaned, otherNames);
        return {
          ...prev,
          workspaces: prev.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, name: finalName } : w
          ),
        };
      });
    },

    deleteWorkspace: (workspaceId) => {
      setState((prev) => {
        if (prev.workspaces.length <= 1) return prev;
        const remaining = prev.workspaces.filter((w) => w.id !== workspaceId);
        const nextActive =
          prev.activeWorkspaceId === workspaceId
            ? remaining[0].id
            : prev.activeWorkspaceId;
        return {
          ...prev,
          activeWorkspaceId: nextActive,
          workspaces: remaining,
        };
      });
    },

    applyOnboardingTemplate: (template) => {
      setState((prev) => {
        const target = prev.workspaces.find((w) => w.template === template);
        if (target) {
          return {
            ...prev,
            activeWorkspaceId: target.id,
            onboardingCompleted: true,
          };
        }
        const created = createWorkspaceFromTemplate(template);
        return {
          ...prev,
          activeWorkspaceId: created.id,
          workspaces: [created, ...prev.workspaces],
          onboardingCompleted: true,
        };
      });
    },

    completeOnboarding: () => {
      setState((prev) => ({ ...prev, onboardingCompleted: true }));
    },

    setEditMode: (edit) => {
      setState((prev) => ({ ...prev, editMode: edit }));
    },

    toggleEditMode: () => {
      setState((prev) => ({ ...prev, editMode: !prev.editMode }));
    },

    setShowDashboardOnDesktop: (show) => {
      setState((prev) => ({ ...prev, showDashboardOnDesktop: show }));
    },

    setShowDesktopShortcutsBar: (show) => {
      setState((prev) => ({ ...prev, showDesktopShortcutsBar: show }));
    },

    setBrowserNotificationsEnabled: (enabled) => {
      setState((prev) => ({ ...prev, browserNotificationsEnabled: enabled }));
    },

    addWidget: (type) => {
      setState((prev) => {
        const instance = createWidgetInstance(type);
        return {
          ...prev,
          workspaces: prev.workspaces.map((ws) =>
            ws.id === prev.activeWorkspaceId
              ? { ...ws, widgets: [...ws.widgets, instance] }
              : ws
          ),
        };
      });
    },

    duplicateWidget: (widgetId) => {
      setState((prev) => {
        return {
          ...prev,
          workspaces: prev.workspaces.map((ws) => {
            if (ws.id !== prev.activeWorkspaceId) return ws;
            const idx = ws.widgets.findIndex((w) => w.id === widgetId);
            if (idx === -1) return ws;
            const orig = ws.widgets[idx];
            const copy: WidgetInstance = {
              ...orig,
              id: `w-${orig.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: getUniqueName(
                `${orig.title} (Salinan)`,
                ws.widgets.map((w) => w.title)
              ),
              data: JSON.parse(JSON.stringify(orig.data)),
            };
            const nextWidgets = [...ws.widgets];
            nextWidgets.splice(idx + 1, 0, copy);
            return { ...ws, widgets: nextWidgets };
          }),
        };
      });
    },

    removeWidget: (widgetId) => {
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) =>
          ws.id === prev.activeWorkspaceId
            ? { ...ws, widgets: ws.widgets.filter((w) => w.id !== widgetId) }
            : ws
        ),
      }));
    },

    reorderWidgets: (sourceId, targetId) => {
      if (sourceId === targetId) return;
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) => {
          if (ws.id !== prev.activeWorkspaceId) return ws;
          const fromIdx = ws.widgets.findIndex((w) => w.id === sourceId);
          const toIdx = ws.widgets.findIndex((w) => w.id === targetId);
          if (fromIdx === -1 || toIdx === -1) return ws;
          const next = [...ws.widgets];
          const [moved] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, moved);
          return { ...ws, widgets: next };
        }),
      }));
    },

    resizeWidget: (widgetId, colSpan, rowSpan) => {
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) => {
          if (ws.id !== prev.activeWorkspaceId) return ws;
          return {
            ...ws,
            widgets: ws.widgets.map((w) => {
              if (w.id !== widgetId) return w;
              const meta = WIDGET_CATALOG_META[w.type];
              const clampedCol = Math.max(
                meta.minColSpan,
                Math.min(meta.maxColSpan, colSpan)
              ) as WidgetSpan;
              return {
                ...w,
                colSpan: clampedCol,
                rowSpan: rowSpan ?? w.rowSpan,
              };
            }),
          };
        }),
      }));
    },

    renameWidget: (widgetId, title) => {
      const cleaned = title.trim();
      if (!cleaned) return;
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) =>
          ws.id === prev.activeWorkspaceId
            ? {
                ...ws,
                widgets: ws.widgets.map((w) =>
                  w.id === widgetId ? { ...w, title: cleaned } : w
                ),
              }
            : ws
        ),
      }));
    },

    setWidgetSimulatedState: (widgetId, simulatedState) => {
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) =>
          ws.id === prev.activeWorkspaceId
            ? {
                ...ws,
                widgets: ws.widgets.map((w) =>
                  w.id === widgetId ? { ...w, simulatedState } : w
                ),
              }
            : ws
        ),
      }));
    },

    resetActiveWorkspaceLayout: () => {
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) => {
          if (ws.id !== prev.activeWorkspaceId) return ws;
          const fresh = createWorkspaceFromTemplate(ws.template, ws.name, ws.id);
          return fresh;
        }),
      }));
    },

    updateWidgetData: (widgetId, updater) => {
      setState((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((ws) => {
          if (!ws.widgets.some((w) => w.id === widgetId)) return ws;
          return {
            ...ws,
            widgets: ws.widgets.map((w) => {
              if (w.id !== widgetId) return w;
              const nextData = updater(w.data as never);
              return { ...w, data: nextData };
            }),
          };
        }),
      }));
    },

    recordFocusSessionCompleted: (widgetId) => {
      const todayKey = getTodayDateKey();
      setState((prev) => {
        const prevToday = prev.activityLog[todayKey] || {
          focusSessions: 0,
          completedTasks: 0,
        };
        return {
          ...prev,
          activityLog: {
            ...prev.activityLog,
            [todayKey]: {
              ...prevToday,
              focusSessions: prevToday.focusSessions + 1,
            },
          },
          workspaces: prev.workspaces.map((ws) => ({
            ...ws,
            widgets: ws.widgets.map((w) => {
              if (w.id !== widgetId || w.type !== 'focus_timer') return w;
              const d = w.data as WidgetDataMap['focus_timer'];
              const baseCount = d.lastSessionDate === todayKey ? d.sessionsToday : 0;
              return {
                ...w,
                data: {
                  ...d,
                  sessionsToday: baseCount + 1,
                  lastSessionDate: todayKey,
                },
              };
            }),
          })),
        };
      });
    },

    recordTaskCompletionDelta: (delta) => {
      const todayKey = getTodayDateKey();
      setState((prev) => {
        const prevToday = prev.activityLog[todayKey] || {
          focusSessions: 0,
          completedTasks: 0,
        };
        return {
          ...prev,
          activityLog: {
            ...prev.activityLog,
            [todayKey]: {
              ...prevToday,
              completedTasks: Math.max(0, prevToday.completedTasks + delta),
            },
          },
        };
      });
    },

    exportDashboardJson: () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        app: 'WebWorkstation Dashboard',
        schemaVersion: state.schemaVersion,
        dashboardState: state,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webworkstation-dashboard-${getTodayDateKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importDashboardJson: (rawJson) => {
      const result = validateAndParseDashboardImport(rawJson);
      if (result.ok && result.state) {
        setState(() => result.state!);
      }
      return { ok: result.ok, message: result.message };
    },
  };
}

const DashboardStoreContext = createContext<DashboardStoreApi | null>(null);

export const DashboardStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const storeRef = useRef<DashboardStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createDashboardStore();
  }
  return (
    <DashboardStoreContext.Provider value={storeRef.current}>
      {children}
    </DashboardStoreContext.Provider>
  );
};

export function useDashboardStoreApi(): DashboardStoreApi {
  const ctx = useContext(DashboardStoreContext);
  if (!ctx) {
    throw new Error('useDashboardStoreApi harus digunakan di dalam DashboardStoreProvider');
  }
  return ctx;
}

/**
 * Fine-grained selector hook so only components whose selected slice changes re-render (Bagian A.7)
 */
export function useDashboardSelector<Selected>(
  selector: (state: DashboardStoreState) => Selected,
  isEqual: (a: Selected, b: Selected) => boolean = Object.is
): Selected {
  const store = useDashboardStoreApi();
  const lastSelectedRef = useRef<{ hasVal: boolean; val: Selected }>({
    hasVal: false,
    val: undefined as unknown as Selected,
  });

  const getSnapshot = useCallback(() => {
    const nextVal = selector(store.getState());
    if (lastSelectedRef.current.hasVal && isEqual(lastSelectedRef.current.val, nextVal)) {
      return lastSelectedRef.current.val;
    }
    lastSelectedRef.current = { hasVal: true, val: nextVal };
    return nextVal;
  }, [store, selector, isEqual]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/**
 * Isolated hook for a single widget instance by ID so updates to one widget never re-render siblings
 */
export function useWidgetById<T extends WidgetType = WidgetType>(
  widgetId: string
): WidgetInstance<T> | undefined {
  return useDashboardSelector((state) => {
    const ws = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    return ws?.widgets.find((w) => w.id === widgetId) as WidgetInstance<T> | undefined;
  });
}

export { createInitialDashboardState };
