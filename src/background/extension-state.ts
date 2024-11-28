import { Mutable, mutable } from "./observable";

export type StateDefinition<T> = {
  normalize(value: unknown): T;
  equal(valueA: T, valueB: T): boolean;
};

export function state<T>(name: string, { normalize, equal }: StateDefinition<T>): Mutable<T> {
  const mutState = mutable<T>(normalize(null));
  const { local } = chrome.storage;

  function update(newValue: T) {
    mutState.update((value) => (!equal(value, newValue) ? newValue : value));
  }

  function onStorageChange(change: any) {
    if (change.hasOwnProperty(name)) {
      update(normalize(change[name].newValue));
    }
  }

  (async function () {
    update(normalize((await local.get(name))[name]));
  })();

  local.onChanged.addListener(onStorageChange);

  return {
    ...mutState,
    release() {
      local.onChanged.removeListener(onStorageChange);
    },
    update(updater) {
      return mutState.update((value) => {
        const newValue = updater(value);
        if (newValue !== value) {
          local.set({ [name]: newValue });
        }
        return newValue;
      });
    },
  };
}

const DEFAULT_EQUAL = <T>(valueA: T, valueB: T): boolean => valueA === valueB;
const primitiveState = <T>(defaultValue: T): StateDefinition<T> => ({
  normalize(value) { return typeof value === typeof defaultValue ? value as T : defaultValue; },
  equal: DEFAULT_EQUAL,
});

export const BOOLEAN_STATE = primitiveState(false);
export const NUMBER_STATE = primitiveState(0);
export const STRING_STATE = primitiveState('');

