"use client";

import { useState } from "react";
import { supabase } from "../../Lib/supabase";

type Person = {
  id: string;
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
};

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [person, setPerson] = useState<Person | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setMessage("");
    setPerson(null);

    const term = searchTerm.trim();

    if (!term) {
      setMessage(
        "Please enter a registration ID, name, or phone number."
      );
      return;
    }

    setLoading(true);

    try {
      let data: Person | null = null;
      let error: any = null;

      // Check whether the search term is a valid UUID.
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      // --------------------------------------------------
      // 1. SEARCH BY REGISTRATION ID / UUID
      // --------------------------------------------------
      if (uuidPattern.test(term)) {
        const result = await supabase
          .from("people")
          .select("*")
          .eq("id", term)
          .maybeSingle();

        data = result.data as Person | null;
        error = result.error;
      }

      // --------------------------------------------------
      // 2. SEARCH BY FULL NAME
      // --------------------------------------------------
      if (!data && !error) {
        const result = await supabase
          .from("people")
          .select("*")
          .ilike("full_name", `%${term}%`)
          .limit(1)
          .maybeSingle();

        data = result.data as Person | null;
        error = result.error;
      }

      // --------------------------------------------------
      // 3. SEARCH BY PHONE NUMBER
      // --------------------------------------------------
      if (!data && !error) {
        const result = await supabase
          .from("people")
          .select("*")
          .eq("phone_number", term)
          .maybeSingle();

        data = result.data as Person | null;
        error = result.error;
      }

      // --------------------------------------------------
      // HANDLE SUPABASE ERROR
      // --------------------------------------------------
      if (error) {
        console.error("Supabase search error:", error);
        setMessage(
          "Unable to search the registration records."
        );
        return;
      }

      // --------------------------------------------------
      // NO RECORD FOUND
      // --------------------------------------------------
      if (!data) {
        setMessage("No registration record was found.");
        return;
      }

      // --------------------------------------------------
      // RECORD FOUND
      // --------------------------------------------------
      setPerson(data);
    } catch (err) {
      console.error("Search error:", err);
      setMessage(
        "An unexpected error occurred while searching."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">
            Imotiv People Registration
          </h1>

          <p className="mt-2 text-slate-300">
            Registration Record Search
          </p>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800">
            Search Registered Person
          </h2>

          <p className="mt-2 text-slate-500">
            Search using a Registration ID, full name, or phone
            number.
          </p>

          {/* Search Box */}
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Enter Registration ID, name or phone number"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {message}
            </div>
          )}

          {/* Search Result */}
          {person && (
            <div className="mt-8">
              <h3 className="mb-4 text-xl font-bold text-slate-800">
                Registration Record
              </h3>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid gap-0 md:grid-cols-2">

                  {/* Registration ID */}
                  <div className="border-b border-slate-200 p-5 md:border-r">
                    <p className="text-sm font-medium text-slate-500">
                      Registration ID
                    </p>

                    <p className="mt-1 break-all font-semibold text-slate-800">
                      {person.id}
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="border-b border-slate-200 p-5">
                    <p className="text-sm font-medium text-slate-500">
                      Full Name
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {person.full_name || "Not provided"}
                    </p>
                  </div>

                  {/* Date of Birth */}
                  <div className="border-b border-slate-200 p-5 md:border-r">
                    <p className="text-sm font-medium text-slate-500">
                      Date of Birth
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {person.date_of_birth || "Not provided"}
                    </p>
                  </div>

                  {/* Gender */}
                  <div className="border-b border-slate-200 p-5">
                    <p className="text-sm font-medium text-slate-500">
                      Gender
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {person.gender || "Not provided"}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="p-5 md:border-r">
                    <p className="text-sm font-medium text-slate-500">
                      Phone Number
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {person.phone_number || "Not provided"}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="p-5">
                    <p className="text-sm font-medium text-slate-500">
                      Record Status
                    </p>

                    <p className="mt-1 font-semibold text-green-600">
                      Registered
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © 2026 Imotiv People Registration Platform
      </footer>
    </main>
  );
}