import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { AppState, DeviceEventEmitter, type NativeEventSubscription } from "react-native";
import { getSession } from "../repos/auth_repo";
import { syncService } from "./sync_service";

const REQUEST_EVENT = "magicletter:sync-requested";
const FINISHED_EVENT = "magicletter:sync-finished";
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000, 120_000];

let networkUnsubscribe: (() => void) | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
let requestSubscription: NativeEventSubscription | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let online = false;
let appIsActive = true;
let running = false;
let rerunRequested = false;
let retryAttempt = 0;
let generation = 0;

function hasInternet(state: NetInfoState) {
  return state.isConnected === true && state.isInternetReachable !== false;
}

function clearRetryTimer() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

function scheduleSync(delayMs = 0) {
  if (!online || !appIsActive) return;
  if (running) {
    rerunRequested = true;
    return;
  }
  clearRetryTimer();
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void runPendingSync();
  }, delayMs);
}

async function runPendingSync() {
  if (!online || !appIsActive || running) return;
  running = true;
  let retryDelay: number | null = null;

  try {
    const session = await getSession();
    if (!session) return;

    const result = await syncService.pushPendingLetters();
    DeviceEventEmitter.emit(FINISHED_EVENT, result);

    if (result.failed > 0 && retryAttempt < RETRY_DELAYS_MS.length) {
      retryDelay = RETRY_DELAYS_MS[retryAttempt];
      retryAttempt += 1;
    } else {
      retryAttempt = 0;
    }
  } catch {
    if (retryAttempt < RETRY_DELAYS_MS.length) {
      retryDelay = RETRY_DELAYS_MS[retryAttempt];
      retryAttempt += 1;
    }
  } finally {
    running = false;
    if (retryDelay !== null) {
      scheduleSync(retryDelay);
    } else if (rerunRequested) {
      rerunRequested = false;
      scheduleSync();
    }
  }
}

export function requestAutomaticSync() {
  DeviceEventEmitter.emit(REQUEST_EVENT);
}

export function subscribeToAutomaticSync(
  listener: (result: { uploaded: number; failed: number }) => void
) {
  const subscription = DeviceEventEmitter.addListener(FINISHED_EVENT, listener);
  return () => subscription.remove();
}

export function startAutomaticSync() {
  stopAutomaticSync();
  const currentGeneration = generation;
  appIsActive = AppState.currentState === "active";

  networkUnsubscribe = NetInfo.addEventListener((state) => {
    if (currentGeneration !== generation) return;
    const wasOnline = online;
    online = hasInternet(state);

    if (!online) {
      retryAttempt = 0;
      clearRetryTimer();
    } else if (!wasOnline) {
      // Android puede anunciar la red antes de que la salida a internet esté lista.
      scheduleSync(1_000);
    }
  });

  appStateSubscription = AppState.addEventListener("change", (nextState) => {
    appIsActive = nextState === "active";
    if (!appIsActive) {
      clearRetryTimer();
      return;
    }

    void NetInfo.fetch().then((state) => {
      if (currentGeneration !== generation) return;
      online = hasInternet(state);
      if (online) scheduleSync();
    });
  });

  requestSubscription = DeviceEventEmitter.addListener(REQUEST_EVENT, () => {
    void NetInfo.fetch().then((state) => {
      if (currentGeneration !== generation) return;
      online = hasInternet(state);
      if (online) scheduleSync();
    });
  });

  void NetInfo.fetch().then((state) => {
    if (currentGeneration !== generation) return;
    online = hasInternet(state);
    if (online) scheduleSync();
  });

  return stopAutomaticSync;
}

export function stopAutomaticSync() {
  generation += 1;
  clearRetryTimer();
  networkUnsubscribe?.();
  networkUnsubscribe = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  requestSubscription?.remove();
  requestSubscription = null;
  online = false;
  rerunRequested = false;
  retryAttempt = 0;
}
