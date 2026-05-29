import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doctorApi } from "../api/doctor.api";
import type { DoctorProfile } from "../types";
import { getDoctorUserId } from "../utils/display";

function PatientDoctors() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState("");
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

  return (
    <main style={{ padding: 24 }}>
      <h1>Find a Doctor</h1>
      {error && <p role="alert">{error}</p>}

      <section style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label>
          Search by name or specialization
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </label>
        <label>
          Filter by specialization
          <select value={specialization} onChange={(event) => setSpecialization(event.target.value)}>
            <option value="">All specializations</option>
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
          {filteredDoctors.map((doctor) => (
            <article key={doctor._id} style={{ border: "1px solid #ddd", padding: 12 }}>
              <h3>{doctor.name || "Doctor"}</h3>
              <p>{doctor.specialization || "Specialization unavailable"}</p>
              {doctor.bio && <p>{doctor.bio.slice(0, 160)}{doctor.bio.length > 160 ? "..." : ""}</p>}
              {getDoctorUserId(doctor) ? (
                <Link to={`/patient/doctors/${getDoctorUserId(doctor)}`} state={{ doctor }}>
                  View details and book
                </Link>
              ) : (
                <p>Doctor information unavailable for booking</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default PatientDoctors;
