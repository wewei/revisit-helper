import { BOOLEAN_STATE, state } from "./extension-state";

export const debugLogEnabled = state('debugLogEnabled', BOOLEAN_STATE);

const noLog: (...args: any) => void = () => {};

const obLog = debugLogEnabled.map(enabled => enabled ? console.log : noLog);

export const log = (...args: any[]) => { obLog.peek()(...args); };
