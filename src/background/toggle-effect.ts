import { log } from "./debug";
import { Observable } from "./observable";

export type ToggleEffect = () => () => void;

export function composeToggleEffects<Effs extends ToggleEffect[]>(
  ...effs: Effs
): ToggleEffect {
  return () => {
    const offs = effs.map((eff) => eff());
    return () => {
      offs.forEach((off) => off());
    };
  };
}

export function bindToggle(
  toggle: Observable<boolean>,
  eff: ToggleEffect,
): ToggleEffect {
  return () => {
    let off: (() => void) | null = null;
    return toggle.observe((flag) => {
      if (flag && !off) {
        off = eff();
      } else if (!flag && off) {
        const offT = off;
        off = null;
        offT();
      }
    });
  };
}

export function toggleLog(name: string) {
  return () => {
    log(`${name} turned on`);
    return () => {
      log(`${name} turned off`);
    };
  };
}

export function toggleEvent<T extends Function>(
  event: chrome.events.Event<T>,
  handler: T,
) {
  return () => {
    event.addListener(handler);
    return () => event.removeListener(handler);
  };
}
