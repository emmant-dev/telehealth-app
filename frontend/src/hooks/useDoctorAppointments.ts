import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { doctorApi } from "../api/doctor.api";
import type { Appointment } from "../types";
import { subscribeToRefreshEvents } from "../utils/refreshEvents";

interface UseDoctorAppointmentsOptions {
  enableFocusRefresh?: boolean;
  enablePolling?: boolean;
  notifyOnChanges?: boolean;
  pollIntervalMs?: number;
}

interface RefreshOptions {
  detectChanges?: boolean;
  showRefreshing?: boolean;
}

const getAppointmentUpdateMessage = (
  previousAppointment: Appointment,
  nextAppointment: Appointment
): string | null => {
  if (previousAppointment.status !== nextAppointment.status) {
    if (nextAppointment.status === "confirmed") {
      return "Appointment confirmed";
    }

    if (nextAppointment.status === "completed") {
      return "Consultation completed";
    }

    if (nextAppointment.status === "cancelled") {
      return "Appointment cancelled";
    }

    return "Appointment updated";
  }

  if (previousAppointment.appointmentAt !== nextAppointment.appointmentAt) {
    return "Appointment rescheduled";
  }

  if (previousAppointment.reason !== nextAppointment.reason) {
    return "Appointment updated";
  }

  return null;
};

const notifyAppointmentChanges = (
  previousAppointments: Appointment[],
  nextAppointments: Appointment[]
) => {
  const previousById = new Map(
    previousAppointments.map((appointment) => [appointment._id, appointment])
  );

  nextAppointments.forEach((appointment) => {
    const previousAppointment = previousById.get(appointment._id);

    if (!previousAppointment) {
      toast.success("New appointment booked");
      return;
    }

    const updateMessage = getAppointmentUpdateMessage(previousAppointment, appointment);

    if (updateMessage) {
      toast(updateMessage);
    }
  });
};

export const useDoctorAppointments = ({
  enableFocusRefresh = false,
  enablePolling = false,
  notifyOnChanges = false,
  pollIntervalMs = 15000
}: UseDoctorAppointmentsOptions = {}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => Date.now());
  const appointmentsRef = useRef<Appointment[]>([]);
  const hasLoadedRef = useRef(false);

  const refreshAppointments = useCallback(
    async ({ detectChanges = notifyOnChanges, showRefreshing = false }: RefreshOptions = {}) => {
      if (showRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const nextAppointments = await doctorApi.getAppointments();

        if (detectChanges && hasLoadedRef.current) {
          notifyAppointmentChanges(appointmentsRef.current, nextAppointments);
        }

        appointmentsRef.current = nextAppointments;
        hasLoadedRef.current = true;
        setAppointments(nextAppointments);
        setLastRefreshedAt(Date.now());
        setError("");
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Unable to refresh appointments";
        setError(message);

        if (hasLoadedRef.current) {
          toast.error(message);
        }
      } finally {
        setIsLoading(false);

        if (showRefreshing) {
          setIsRefreshing(false);
        }
      }
    },
    [notifyOnChanges]
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialAppointments = async () => {
      try {
        const initialAppointments = await doctorApi.getAppointments();

        if (!isMounted) {
          return;
        }

        appointmentsRef.current = initialAppointments;
        hasLoadedRef.current = true;
        setAppointments(initialAppointments);
        setLastRefreshedAt(Date.now());
        setError("");
      } catch (caughtError) {
        if (isMounted) {
          const message =
            caughtError instanceof Error ? caughtError.message : "Unable to load appointments";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialAppointments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToRefreshEvents((eventType) => {
      if (eventType === "appointments") {
        void refreshAppointments({ detectChanges: false });
      }
    });
  }, [refreshAppointments]);

  useEffect(() => {
    if (!enablePolling) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshAppointments({ detectChanges: true });
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enablePolling, pollIntervalMs, refreshAppointments]);

  useEffect(() => {
    if (!enableFocusRefresh) {
      return undefined;
    }

    const handleFocus = () => {
      void refreshAppointments({ detectChanges: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [enableFocusRefresh, refreshAppointments]);

  return {
    appointments,
    error,
    isLoading,
    isRefreshing,
    lastRefreshedAt,
    refreshAppointments
  };
};
