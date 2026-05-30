type RefreshEventType = "appointments" | "medical-records";
type RefreshListener = (eventType: RefreshEventType) => void;

const refreshListeners = new Set<RefreshListener>();

export const emitRefreshEvent = (eventType: RefreshEventType): void => {
  refreshListeners.forEach((listener) => listener(eventType));
};

export const subscribeToRefreshEvents = (listener: RefreshListener): (() => void) => {
  refreshListeners.add(listener);

  return () => {
    refreshListeners.delete(listener);
  };
};
