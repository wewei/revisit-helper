import { isNumber, omit } from "lodash";
import { apply, observable } from "./observable";
import { composeToggleEffects, toggleEvent } from "./toggle-effect";

export const obTabs = observable<Record<number, chrome.tabs.Tab>>((update) => {
  function updateTab(tabId: number, tab: chrome.tabs.Tab | null) {
    if (tab) {
      update((tabs) => ({ ...tabs, [tabId]: tab }));
    } else {
      update(({ [tabId]: _, ...others }) => others);
    }
  }

  (async function () {
    const tabs = await chrome.tabs.query({});
    update((curTabs) =>
      tabs.reduce(
        (m, tab) => {
          if (isNumber(tab.id)) {
            m[tab.id] = tab;
          }
          return m;
        },
        { ...curTabs },
      ),
    );
  })();

  const { onCreated, onUpdated, onRemoved } = chrome.tabs;

  return [
    {},
    composeToggleEffects(
      toggleEvent(
        onCreated,
        (tab) => isNumber(tab.id) && updateTab(tab.id, tab),
      ),
      toggleEvent(onUpdated, (tabId, _, tab) => updateTab(tabId, tab)),
      toggleEvent(onRemoved, (tabId) => updateTab(tabId, null)),
    )(),
  ];
});

export const obCurrentWindowId = observable<number | null>((update) => {
  const { onFocusChanged } = chrome.windows;
  (async () => {
    const { id } = await chrome.windows.getCurrent();
    update(() => id ?? null);
  })();
  return [
    null,
    toggleEvent(onFocusChanged, (windowId) => update(() => windowId))(),
  ];
});

export const obActiveTabIds = observable<Record<number, number>>((update) => {
  const { onActivated } = chrome.tabs;
  const { onRemoved } = chrome.windows;

  (async () => {
    const tabs = await chrome.tabs.query({ active: true });
    update((tabIds) =>
      tabs.reduce((m, { id, windowId }) => {
        if (isNumber(id) && id >= 0 && windowId >= 0) {
          m[windowId] = id;
        }
        return m;
      }, tabIds),
    );
  })();

  return [
    {},
    composeToggleEffects(
      toggleEvent(onActivated, ({ windowId, tabId }) =>
        update((tabIds) => ({ ...tabIds, [windowId]: tabId })),
      ),
      toggleEvent(onRemoved, (windowId) =>
        update((tabIds) => omit(tabIds, windowId)),
      ),
    )(),
  ];
});

export const obCurrentTabId = obCurrentWindowId.bind(windowId => obActiveTabIds.map(tabIds => {
  if (windowId === null) {
    return null;
  }
  return tabIds[windowId] ?? null;
}));

export const obCurrentTab = obTabs.bind((tabs) =>
  obCurrentTabId.map((tabId) => (tabId ? tabs[tabId] : null) ?? null),
);
