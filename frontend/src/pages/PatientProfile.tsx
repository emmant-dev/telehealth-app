import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { patientApi } from "../api/patient.api";
import type { PatientProfile as PatientProfileType } from "../types";

interface ProfileFormState {
  name: string;
  birthday: string;
  weightKg: string;
  heightCm: string;
  contactNumber: string;
  address: string;
  basicMedicalHistory: string;
}

const emptyForm: ProfileFormState = {
  name: "",
  birthday: "",
  weightKg: "",
  heightCm: "",
  contactNumber: "",
  address: "",
  basicMedicalHistory: ""
};

const toDateInput = (value?: string): string => {
  return value ? value.slice(0, 10) : "";
};

function PatientProfile() {
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const profile = await patientApi.getMe();

        if (isMounted) {
          setForm({
            name: profile.name || "",
            birthday: toDateInput(profile.birthday),
            weightKg: profile.weightKg?.toString() || "",
            heightCm: profile.heightCm?.toString() || "",
            contactNumber: profile.contactNumber || "",
            address: profile.address || "",
            basicMedicalHistory: profile.basicMedicalHistory || ""
          });
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load profile");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required.");
      toast.error("Name is required.");
      return;
    }

    if (form.weightKg && Number(form.weightKg) < 0) {
      setError("Weight cannot be negative.");
      toast.error("Weight cannot be negative.");
      return;
    }

    if (form.heightCm && Number(form.heightCm) < 0) {
      setError("Height cannot be negative.");
      toast.error("Height cannot be negative.");
      return;
    }

    const payload: Partial<PatientProfileType> = {
      name: form.name.trim(),
      birthday: form.birthday || undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      contactNumber: form.contactNumber.trim() || undefined,
      address: form.address.trim() || undefined,
      basicMedicalHistory: form.basicMedicalHistory.trim() || undefined
    };

    setIsSubmitting(true);
    const toastId = toast.loading("Saving profile...");

    try {
      await patientApi.updateMe(payload);
      toast.success("Profile updated", { id: toastId });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to update profile";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Patient Profile</h1>
      {isLoading && <p>Loading profile...</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
          <label>
            Name
            <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
          </label>
          <label>
            Birthday
            <input
              type="date"
              value={form.birthday}
              onChange={(event) => updateField("birthday", event.target.value)}
            />
          </label>
          <label>
            Weight (kg)
            <input
              min="0"
              type="number"
              value={form.weightKg}
              onChange={(event) => updateField("weightKg", event.target.value)}
            />
          </label>
          <label>
            Height (cm)
            <input
              min="0"
              type="number"
              value={form.heightCm}
              onChange={(event) => updateField("heightCm", event.target.value)}
            />
          </label>
          <label>
            Contact number
            <input value={form.contactNumber} onChange={(event) => updateField("contactNumber", event.target.value)} />
          </label>
          <label>
            Address
            <input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
          </label>
          <label>
            Basic medical history
            <textarea
              value={form.basicMedicalHistory}
              onChange={(event) => updateField("basicMedicalHistory", event.target.value)}
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save profile"}
          </button>
        </form>
      )}
    </main>
  );
}

export default PatientProfile;
