import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { doctorApi } from "../api/doctor.api";
import type { DoctorProfile as DoctorProfileType } from "../types";
import { formatDoctorBio, isDoctorProfileComplete, parseDoctorBio } from "../utils/display";
import { ui } from "../utils/ui";

const specializationOptions = [
  "Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Psychiatry",
  "Neurology",
  "Obstetrics and Gynecology",
  "Orthopedics",
  "Other"
];

function DoctorProfile() {
  const [profile, setProfile] = useState<DoctorProfileType | null>(null);
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const doctorProfile = await doctorApi.getMyProfile();
        const parsedBio = parseDoctorBio(doctorProfile.bio);

        if (!isMounted) {
          return;
        }

        setProfile(doctorProfile);
        setFullName(doctorProfile.name || "");
        setSpecialization(doctorProfile.specialization || "");
        setBio(parsedBio.bio);
        setExperience(parsedBio.experience);
        setContactNumber(doctorProfile.contactNumber || "");
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load doctor profile");
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      toast.error("Full name is required.");
      return;
    }

    if (!specialization.trim()) {
      setError("Specialization is required.");
      toast.error("Specialization is required.");
      return;
    }

    if (!bio.trim()) {
      setError("Bio is required so patients can understand your care background.");
      toast.error("Bio is required so patients can understand your care background.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving doctor profile...");

    try {
      const updatedProfile = await doctorApi.updateMyProfile({
        name: fullName.trim(),
        specialization: specialization.trim(),
        bio: formatDoctorBio(bio, experience),
        contactNumber: contactNumber.trim() || undefined
      });
      const parsedBio = parseDoctorBio(updatedProfile.bio);

      setProfile(updatedProfile);
      setFullName(updatedProfile.name || "");
      setSpecialization(updatedProfile.specialization || "");
      setBio(parsedBio.bio);
      setExperience(parsedBio.experience);
      setContactNumber(updatedProfile.contactNumber || "");
      toast.success("Doctor profile saved", { id: toastId });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to save doctor profile";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className={ui.page}>
      <p>
        <Link className={ui.linkButton} to="/doctor/dashboard">Back to dashboard</Link>
      </p>
      <h1 className={ui.heading1}>Doctor Profile</h1>
      {error && <p className={ui.alert} role="alert">{error}</p>}
      {isLoading && <p className={ui.muted}>Loading profile...</p>}

      {!isLoading && (
        <>
          {profile && !isDoctorProfileComplete(profile) && (
            <p className={ui.status} role="status">
              Complete your professional profile so patients can review your background before
              booking.
            </p>
          )}

          <form onSubmit={handleSubmit} className={ui.formWide}>
            <label className={ui.label}>
              Full name
              <input
                className={ui.input}
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label className={ui.label}>
              Specialization
              <select
                className={ui.input}
                required
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
              >
                <option value="">Select specialization</option>
                {specialization &&
                  !specializationOptions.includes(specialization) && (
                    <option value={specialization}>{specialization}</option>
                  )}
                {specializationOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${ui.label} md:col-span-2`}>
              Bio / description
              <textarea
                className={ui.textarea}
                required
                rows={5}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </label>
            <label className={ui.label}>
              Experience
              <input
                className={ui.input}
                placeholder="Example: 8 years in family medicine"
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
              />
            </label>
            <label className={ui.label}>
              Contact information
              <input
                className={ui.input}
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value)}
              />
            </label>
            <button className={`${ui.button} md:col-span-2 md:justify-self-start`} type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : profile && isDoctorProfileComplete(profile) ? "Update Profile" : "Complete Profile"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}

export default DoctorProfile;
