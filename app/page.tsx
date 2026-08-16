"use client";

import { useState } from "react";
import { supabase } from "@/Lib/supabase";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState("");

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const form = e.currentTarget;
  const formData = new FormData(form);

  try {
    const fullName = formData.get("full_name") as string;
    const dateOfBirth = formData.get("date_of_birth") as string;
    const gender = formData.get("gender") as string;
    const phoneNumber = formData.get("phone_number") as string;
    const email = formData.get("email") as string;
    const passportphoto = formData.get("passport_photo") as File;
    const state = formData.get("state") as string;
    const lga = formData.get("lga") as string;
    const address = formData.get("address") as string;
    const occupation = formData.get("occupation") as string;
    const organization = formData.get("organization") as string;
    const zone = formData.get("zone") as string;
    const village = formData.get("village") as string;
    const kindred = formData.get("kindred") as string;
    const ward = formData.get("ward") as string;
    const largerFamilyName = formData.get(
      "larger_family_name"
    ) as string;

    const emergencyName = formData.get(
      "emergency_contact_name"
    ) as string;

    const emergencyPhone = formData.get(
      "emergency_contact_phone"
    ) as string;

    const emergencyRelationship = formData.get(
      "emergency_relationship"
    ) as string;

    const passportFile = formData.get(
      "passport_photo"
    ) as File;

    const validIdFile = formData.get(
      "valid_id"
    ) as File;

    if (!passportFile || passportFile.size === 0) {
      alert("Please upload a passport photograph.");
      return;
    }

    if (!validIdFile || validIdFile.size === 0) {
      alert("Please upload a valid ID.");
      return;
    }

    /*
     * Generate a unique folder for this registration.
     */
    const registrationFolder = crypto.randomUUID();

    /*
     * Upload passport photograph
     */
    const passportPath =
      `${registrationFolder}/${passportFile.name}`;

    const { error: passportError } = await supabase.storage
      .from("passport-photos")
      .upload(passportPath, passportFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (passportError) {
      console.error(passportError);
      alert("Passport photograph upload failed.");
      return;
    }

    /*
     * Upload valid ID
     */
    const validIdPath =
      `${registrationFolder}/${validIdFile.name}`;

    const { error: validIdError } = await supabase.storage
      .from("valid-ids")
      .upload(validIdPath, validIdFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (validIdError) {
      console.error(validIdError);
      alert("Valid ID upload failed.");
      return;
    }

    /*
     * Combine emergency contact information
     */
    const emergencyContact =
      `${emergencyName} - ${emergencyPhone} - ${emergencyRelationship}`;

    /*
     * Save the registration in Supabase
     */
    const { error: databaseError } = await supabase
      .from("people")
      .insert({
        full_name: fullName,
        date_of_birth: dateOfBirth,
        gender: gender,
        phone_number: phoneNumber,
        email: email,
        state: state,
        lga: lga,
        address: address,
        occupation: occupation,
        passport_url: passportPath,
        valid_id_url: validIdPath,
        zone: zone,
        organization: organization,
        emergency_contact: emergencyContact,
        village: village,
        kindred: kindred,
        ward: ward,
        larger_family_name: largerFamilyName,
      });

    if (databaseError) {
      console.error(databaseError);
      alert(
        "Registration could not be saved. Please try again."
      );
      return;
    }

    /*
     * Generate registration ID for the user
     */
    const id = `IMP-${new Date().getFullYear()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    setRegistrationId(id);
    setSubmitted(true);

  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again.");
  }
};

  const resetRegistration = () => {
    setSubmitted(false);
    setRegistrationId("");
  };

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="bg-blue-900 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">Imotiv People</h1>
            <p className="text-sm text-blue-200">
              People Registration Platform
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(true);
              setSubmitted(false);
            }}
            className="rounded-lg bg-white px-5 py-2.5 font-semibold text-blue-900 hover:bg-blue-50"
          >
            Register
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">

          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
              Official Registration Portal
            </span>

            <h2 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Simple, Secure & Reliable People Registration
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Register your personal, family, community and identification
              information securely using the Imotiv People Registration
              Platform.
            </p>

            <button
              onClick={() => {
                setShowForm(true);
                setSubmitted(false);
              }}
              className="mt-8 rounded-lg bg-blue-700 px-7 py-3.5 font-semibold text-white shadow hover:bg-blue-800"
            >
              Start Registration
            </button>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="space-y-5">

              <div className="rounded-xl bg-blue-50 p-5">
                <h3 className="font-bold text-blue-900">
                  Personal Information
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Securely collect important personal information.
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-5">
                <h3 className="font-bold text-green-900">
                  Community Information
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Record village, ward, kindred, family and zone information.
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-5">
                <h3 className="font-bold text-purple-900">
                  Secure Records
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Registration records will be securely stored and searchable.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* REGISTRATION MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-8">

          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

            {submitted ? (

              /* SUCCESS SCREEN */
              <div className="p-10 text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <span className="text-4xl text-green-600">✓</span>
                </div>

                <h2 className="mt-6 text-3xl font-bold text-slate-900">
                  Registration Successful!
                </h2>

                <p className="mx-auto mt-3 max-w-md text-slate-600">
                  The registration information has been received successfully.
                  Please keep your Registration ID for future reference.
                </p>

                <div className="mx-auto mt-8 max-w-sm rounded-xl bg-blue-50 p-6">
                  <p className="text-sm font-medium text-blue-700">
                    Registration ID
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-wide text-blue-900">
                    {registrationId}
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

                  <button
                    type="button"
                    onClick={resetRegistration}
                    className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                  >
                    Register Another Person
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetRegistration();
                      setShowForm(false);
                    }}
                    className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>

                </div>
              </div>

            ) : (

              /* REGISTRATION FORM */
              <>
                {/* FORM HEADER */}
                <div className="flex items-center justify-between rounded-t-2xl bg-blue-900 px-6 py-5 text-white">

                  <div>
                    <h2 className="text-2xl font-bold">
                      People Registration Form
                    </h2>

                    <p className="mt-1 text-sm text-blue-200">
                      Please provide accurate information.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowForm(false)}
                    className="text-3xl leading-none text-white hover:text-blue-200"
                  >
                    ×
                  </button>

                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-8 p-6"
                >

                  {/* PERSONAL INFORMATION */}
                  <section>

                    <div className="mb-5 border-b pb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        1. Personal Information
                      </h3>

                      <p className="text-sm text-slate-500">
                        Basic information about the person being registered.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Full Name *
                        </label>

                        <input
  type="text"
  name="full_name"
  placeholder="Enter full name"
  required
  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
/>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Date of Birth *
                        </label>

                        <input
                          type="date"
                          name="date_of_birth"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Gender *
                        </label>

                        <select 
                          name="gender" 
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                        >
                          <option value="">Select gender</option>
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Phone Number *
                        </label>

                        <input
                          type="tel"
                          placeholder="08012345678"
                          name="phone_number"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Email Address
                        </label>

                        <input
                          type="email"
                          placeholder="example@email.com"
                          name="email"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Passport Photograph *
                        </label>

                        <input
                          type="file"
                          name="passport_photo"
                          accept="image/*"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Upload a clear passport photograph.
                        </p>
                      </div>

                    </div>
                  </section>

                  {/* COMMUNITY INFORMATION */}
                  <section>

                    <div className="mb-5 border-b pb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        2. Community Information
                      </h3>

                      <p className="text-sm text-slate-500">
                        Information about the person's community and family.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          State *
                        </label>

                        <input
                          type="text"
                          name="state" 
                          placeholder="Enter state"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          LGA *
                        </label>

                        <input
                          type="text"
                          name="lga" 
                          placeholder="Enter LGA"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Ward *
                        </label>

                        <input
                          type="text"
                          name="ward"
                          placeholder="Enter ward"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Village *
                        </label>

                        <input
                          type="text"
                          name="village"
                          placeholder="Enter village"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Kindred *
                        </label>

                        <input
                          type="text"
                          name="kindred"
                          placeholder="Enter kindred"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Larger Family Name *
                        </label>

                        <input
                          type="text"
                          name="larger_family_name"
                          placeholder="Enter larger family name"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Zone *
                        </label>

                        <select
                          name="zone"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                        >
                          <option value="">Select Zone</option>
                          <option>Zone A</option>
                          <option>Zone B</option>
                        </select>
                      </div>

                    </div>
                  </section>

                  {/* ADDRESS */}
                  <section>

                    <div className="mb-5 border-b pb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        3. Address
                      </h3>
                    </div>

                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Residential Address *
                    </label>

                    <textarea
                      rows={4}
                      name="address"
                      placeholder="Enter complete residential address"
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                    />

                  </section>

                  {/* OCCUPATION */}
                  <section>

                    <div className="mb-5 border-b pb-3"> 
                      <h3 className="text-xl font-bold text-slate-900">
                        4. Occupation & Organisation
                      </h3>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Occupation *
                        </label>

                        <input
                          type="text"
                          name="occupation" 
                          placeholder="Enter occupation" 
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Organisation
                        </label>

                        <input
                          type="text"
                          name="organisation" 
                          placeholder="Enter organisation"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                    </div>
                  </section>

                  {/* IDENTIFICATION */}
                  <section>

                    <div className="mb-5 border-b pb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        5. Identification
                      </h3>

                      <p className="text-sm text-slate-500">
                        Provide a valid means of identification.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          ID Type *
                        </label>

                        <select
                          name="id_type" 
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                        >
                          <option value="">Select ID type</option>
                          <option>National ID / NIN</option>
                          <option>Voter's Card</option>
                          <option>Driver's Licence</option>
                          <option>International Passport</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          ID Number *
                        </label>

                        <input
                          type="text" 
                          placeholder="Enter ID number" 
                          required
                          name="id_number" 
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Upload Valid ID *
                        </label>

                        <input
                          type="file"
                          name="valid_id" 
                          accept="image/*,.pdf"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Accepted formats: JPG, PNG or PDF.
                        </p>
                      </div>

                    </div>
                  </section>

                  {/* EMERGENCY CONTACT */}
                  <section>

                    <div className="mb-5 border-b pb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        6. Emergency Contact
                      </h3>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Emergency Contact Name *
                        </label>

                        <input
                          type="text"
                          placeholder="Full name" 
                          required 
                          name="emergency_contact_name" 
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Emergency Contact Phone *
                        </label>

                        <input
                          type="tel"
                          placeholder="Phone number"
                          required
                          name="emergency_contact_phone" 
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Relationship to Registrant *
                        </label>

                        <input
                          type="text"
                          placeholder="e.g. Brother, Sister, Father, Mother"
                          required
                          name="relationship_to_registrant" 
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>

                    </div>
                  </section>

                  {/* SUBMIT */}
                  <div className="border-t pt-6">

                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                      <strong>Important:</strong> Please check that all
                      information provided is accurate before submitting.
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="rounded-lg bg-blue-700 px-7 py-3 font-semibold text-white shadow hover:bg-blue-800"
                      >
                        Submit Registration
                      </button>

                    </div>
                  </div>

                </form>
              </>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t bg-white py-6 text-center text-sm text-slate-500">
        © 2026 Imotiv People Registration Platform
      </footer>

    </main>
  );
}
