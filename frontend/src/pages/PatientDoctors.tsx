import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { doctorApi } from "../api/doctor.api";
import { geminiApi } from "../api/gemini.api";
import type { DoctorRecommendation } from "../api/gemini.api";
import type { DoctorProfile } from "../types";
import { getDoctorUserId, parseDoctorBio } from "../utils/display";

function PatientDoctors() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [recommendation, setRecommendation] = useState<DoctorRecommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      try {
        const doctorList = await doctorApi.list();

        if (isMounted) {
          setDoctors(doctorList);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load doctors");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  const specializations = useMemo(() => {
    return Array.from(new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))).sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesSearch =
        !normalizedSearch ||
        doctor.name.toLowerCase().includes(normalizedSearch) ||
        doctor.specialization.toLowerCase().includes(normalizedSearch);
      const matchesSpecialization = !specialization || doctor.specialization === specialization;

      return matchesSearch && matchesSpecialization;
    });
  }, [doctors, searchTerm, specialization]);

  const recommendedDoctors = useMemo(() => {
    if (!recommendation) {
      return [];
    }

    const normalizedSpecialization = recommendation.specialization.trim().toLowerCase();
    const matches = doctors.filter((doctor) =>
      doctor.specialization.toLowerCase().includes(normalizedSpecialization)
    );

    return matches.length > 0 ? matches : doctors;
  }, [doctors, recommendation]);
  const hasRecommendationMatches = useMemo(() => {
    if (!recommendation) {
      return false;
    }

    const normalizedSpecialization = recommendation.specialization.trim().toLowerCase();

    return doctors.some((doctor) =>
      doctor.specialization.toLowerCase().includes(normalizedSpecialization)
    );
  }, [doctors, recommendation]);

  const renderDoctorCard = (doctor: DoctorProfile) => {
    const parsedBio = parseDoctorBio(doctor.bio);
    const preview = parsedBio.bio || "Bio not provided";

    return (
      <article key={doctor._id} style={{ border: "1px solid #ddd", padding: 12 }}>
        <h3>{doctor.name || "Doctor name not provided"}</h3>
        <p>{doctor.specialization || "Specialization unavailable"}</p>
        <p>{preview.slice(0, 160)}{preview.length > 160 ? "..." : ""}</p>
        <p>Experience: {parsedBio.experience || "Not provided"}</p>
        {getDoctorUserId(doctor) ? (
          <Link to={`/patient/doctors/${getDoctorUserId(doctor)}`} state={{ doctor }}>
            View details and book
          </Link>
        ) : (
          <p>Doctor information unavailable for booking</p>
        )}
      </article>
    );
  };

  const handleRecommendDoctors = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedSymptoms = symptoms.trim();

    if (!trimmedSymptoms) {
      toast.error("Enter symptoms or health concerns first.");
      return;
    }

    setIsRecommending(true);
    const toastId = toast.loading("Generating doctor recommendations...");

    try {
      const nextRecommendation = await geminiApi.recommendDoctorSpecialization(trimmedSymptoms);
      setRecommendation(nextRecommendation);
      setSpecialization(nextRecommendation.specialization);
      toast.success("Recommendations generated", { id: toastId });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to generate recommendations";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsRecommending(false);
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Find a Doctor</h1>
      {error && <p role="alert">{error}</p>}

      <section style={{ display: "grid", gap: 12, marginBottom: 24, maxWidth: 640 }}>
        <h2>AI Doctor Recommendation</h2>
        <form onSubmit={handleRecommendDoctors} style={{ display: "grid", gap: 12 }}>
          <label>
            Symptoms or health concerns
            <textarea
              rows={4}
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
            />
          </label>
          <button type="submit" disabled={isRecommending}>
            {isRecommending ? "Getting Recommendations..." : "Get Doctor Recommendations"}
          </button>
        </form>
        {recommendation && (
          <div style={{ border: "1px solid #ddd", padding: 12 }}>
            <p>Recommended specialization: {recommendation.specialization}</p>
            <p>Severity: {recommendation.severity}</p>
            <p>
              Keywords:{" "}
              {recommendation.keywords.length > 0
                ? recommendation.keywords.join(", ")
                : "Not provided"}
            </p>
          </div>
        )}
      </section>

      {recommendation && (
        <section>
          <h2>Recommended Doctors</h2>
          {!hasRecommendationMatches && (
            <p>No exact specialization match found. Showing all doctors.</p>
          )}
          {recommendedDoctors.length === 0 && <p>No doctors available.</p>}
          <div style={{ display: "grid", gap: 12 }}>
            {recommendedDoctors.map((doctor) => renderDoctorCard(doctor))}
          </div>
        </section>
      )}

      <section style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label>
          Search by name or specialization
          <input
            value={searchTerm}
            onBlur={() => {
              if (searchTerm.trim()) {
                toast("Doctor search updated");
              }
            }}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <label>
          Filter by specialization
          <select
            value={specialization}
            onChange={(event) => {
              setSpecialization(event.target.value);
              toast("Doctor filters updated");
            }}
          >
            <option value="">All specializations</option>
            {specialization && !specializations.includes(specialization) && (
              <option value={specialization}>{specialization}</option>
            )}
            {specializations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h2>Doctors</h2>
        {isLoading && <p>Loading doctors...</p>}
        {!isLoading && filteredDoctors.length === 0 && <p>No doctors match your search.</p>}
        <div style={{ display: "grid", gap: 12 }}>
          {filteredDoctors.map((doctor) => renderDoctorCard(doctor))}
        </div>
      </section>
    </main>
  );
}

export default PatientDoctors;
