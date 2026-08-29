"use client";

import { useState } from "react";
import { supabase } from "@/Lib/supabase";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanFileName = (fileName: string) => {
    const extension = fileName.includes(".")
      ? "." + fileName.split(".").pop()
      : "";

    const baseName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return `${baseName || "file"}${extension.toLowerCase()}`;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      /* =========================================================
         GET FORM DATA
      ========================================================= */

      const fullName =
        String(formData.get("full_name") || "").trim();

      const dateOfBirth =
        String(formData.get("date_of_birth") || "");

      const gender =
        String(formData.get("gender") || "");

      const maritalStatus =
        String(formData.get("marital_status") || "");

      const religion =
        String(formData.get("religion") || "").trim();

      const phoneNumber =
        String(formData.get("phone_number") || "").trim();

      const email =
        String(formData.get("email") || "").trim();

      const state =
        String(formData.get("state") || "").trim();

      const lga =
        String(formData.get("lga") || "").trim();

      const ward =
        String(formData.get("ward") || "").trim();

      const village =
        String(formData.get("village") || "").trim();

      const kindred =
        String(formData.get("kindred") || "").trim();

      const parentsName =
        String(formData.get("parents_name") || "").trim();

      const zone =
        String(formData.get("zone") || "");

      /* NEW: DISTRICT */
      const district =
        String(formData.get("district") || "").trim();

      /* NUMBER OF YEARS STAYED IN IMO STATE */
      const yearsStayedInImoState =
        String(
          formData.get("years_stayed_in_imo_state") || ""
        ).trim();

      const permanentHomeAddress =
        String(
          formData.get("permanent_home_address") || ""
        ).trim();

      const residentialAddress =
        String(
          formData.get("residential_address") || ""
        ).trim();

      const occupation =
        String(formData.get("occupation") || "").trim();

      const organization =
        String(formData.get("organization") || "").trim();

      /* EDUCATIONAL QUALIFICATION */
      const educationalQualification =
        String(
          formData.get("educational_qualification") || ""
        ).trim();

      const idType =
        String(formData.get("id_type") || "");

      const idNumber =
        String(formData.get("id_number") || "").trim();

      const emergencyName =
        String(
          formData.get("emergency_contact_name") || ""
        ).trim();

      const emergencyPhone =
        String(
          formData.get("emergency_contact_phone") || ""
        ).trim();

      const emergencyRelationship =
        String(
          formData.get("emergency_relationship") || ""
        ).trim();

      const nextOfKinPhone =
        String(
          formData.get("next_of_kin_phone") || ""
        ).trim();

      const passportFile =
        formData.get("passport_photo") as File | null;

      const validIdFile =
        formData.get("valid_id") as File | null;

      /* =========================================================
         VALIDATE REQUIRED FILES
      ========================================================= */

      if (
        !passportFile ||
        !(passportFile instanceof File) ||
        passportFile.size === 0
      ) {
        alert("Please upload a passport photograph.");
        setIsSubmitting(false);
        return;
      }

      if (
        !validIdFile ||
        !(validIdFile instanceof File) ||
        validIdFile.size === 0
      ) {
        alert("Please upload a valid ID.");
        setIsSubmitting(false);
        return;
      }

      /* =========================================================
         FILE SIZE CHECK
      ========================================================= */

      const maxFileSize = 50 * 1024 * 1024;

      if (passportFile.size > maxFileSize) {
        alert("Passport photograph is larger than 50 MB.");
        setIsSubmitting(false);
        return;
      }

      if (validIdFile.size > maxFileSize) {
        alert("Valid ID file is larger than 50 MB.");
        setIsSubmitting(false);
        return;
      }

      /* =========================================================
         FILE TYPE CHECK
      ========================================================= */

      const passportAllowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
      ];

      if (!passportAllowedTypes.includes(passportFile.type)) {
        alert(
          "Passport photograph must be JPG, JPEG, PNG or WEBP."
        );
        setIsSubmitting(false);
        return;
      }

      const validIdAllowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "application/pdf",
      ];

      if (
        validIdFile.type &&
        !validIdAllowedTypes.includes(validIdFile.type)
      ) {
        alert(
          "Valid ID must be JPG, JPEG, PNG, WEBP or PDF."
        );
        setIsSubmitting(false);
        return;
      }

      /* =========================================================
         CREATE UNIQUE REGISTRATION FOLDER
      ========================================================= */

      const registrationFolder = crypto.randomUUID();

      /* =========================================================
         CLEAN FILE NAMES
      ========================================================= */

      const passportFileName =
        cleanFileName(passportFile.name);

      const validIdFileName =
        cleanFileName(validIdFile.name);

      /* =========================================================
         PASSPORT PHOTO PATH
      ========================================================= */

      const passportPath =
        `${registrationFolder}/${passportFileName}`;

      console.log(
        "Uploading passport to:",
        passportPath
      );

      /* =========================================================
         UPLOAD PASSPORT PHOTO
      ========================================================= */

      const {
        error: passportError,
      } = await supabase.storage
        .from("passport-photos")
        .upload(
          passportPath,
          passportFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              passportFile.type || "image/jpeg",
          }
        );

      if (passportError) {
        console.error(
          "PASSPORT UPLOAD ERROR:",
          passportError
        );

        alert(
          `Passport photograph upload failed.\n\n${passportError.message}`
        );

        setIsSubmitting(false);
        return;
      }

      /* =========================================================
         VALID ID PATH
      ========================================================= */

      const validIdPath =
        `${registrationFolder}/${validIdFileName}`;

      console.log(
        "Uploading valid ID to:",
        validIdPath
      );

      /* =========================================================
         UPLOAD VALID ID
      ========================================================= */

      const {
        error: validIdError,
      } = await supabase.storage
        .from("valid-ids")
        .upload(
          validIdPath,
          validIdFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              validIdFile.type ||
              "application/octet-stream",
          }
        );

      if (validIdError) {
        console.error(
          "VALID ID UPLOAD ERROR:",
          validIdError
        );

        await supabase.storage
          .from("passport-photos")
          .remove([passportPath]);

        alert(
          `Valid ID upload failed.\n\n${validIdError.message}`
        );

        setIsSubmitting(false);
        return;
      }

      /* =========================================================
         COMBINE EMERGENCY CONTACT INFORMATION
      ========================================================= */

      const emergencyContact =
        `${emergencyName} - ${emergencyPhone} - ${emergencyRelationship}`;

      /* =========================================================
         GENERATE REGISTRATION ID
      ========================================================= */

      const generatedRegistrationId =
        `IMP-${new Date().getFullYear()}-${Math.floor(
          100000 + Math.random() * 900000
        )}`;

      /* =========================================================
         SAVE REGISTRATION TO SUPABASE
      ========================================================= */

      const {
        error: databaseError,
      } = await supabase
        .from("people")
        .insert({
          /* Personal Information */
          full_name: fullName,
          date_of_birth: dateOfBirth,
          gender: gender,
          marital_status: maritalStatus,
          religion: religion,
          phone_number: phoneNumber,
          email: email,

          /* Community Information */
          state: state,
          lga: lga,
          ward: ward,
          village: village,
          kindred: kindred,
          parents_name: parentsName,
          zone: zone,

          /* District */
          district: district,

          /* Number of Years Stayed in Imo State */
          years_stayed_in_imo_state:
            yearsStayedInImoState,

          /* Addresses */
          permanent_home_address:
            permanentHomeAddress,
          residential_address:
            residentialAddress,

          /* Occupation */
          occupation: occupation,
          organization: organization,

          /* Educational Qualification */
          educational_qualification:
            educationalQualification,

          /* Identification */
          id_type: idType,
          id_number: idNumber,

          /* Uploaded Files */
          passport_url: passportPath,
          valid_id_url: validIdPath,

          /* Emergency */
          emergency_contact: emergencyContact,

          /* Next of Kin */
          next_of_kin_phone: nextOfKinPhone,

          /* Registration ID */
          registration_id:
            generatedRegistrationId,
        });

      if (databaseError) {
        console.error(
          "DATABASE ERROR:",
          databaseError
        );

        /* Remove uploaded files if database save fails */

        await supabase.storage
          .from("passport-photos")
          .remove([passportPath]);

        await supabase.storage
          .from("valid-ids")
          .remove([validIdPath]);

        alert(
          `Registration could not be saved.\n\n${databaseError.message}`
        );

        setIsSubmitting(false);
        return;
      }

      /* =========================================================
         SUCCESS
      ========================================================= */

      setRegistrationId(
        generatedRegistrationId
      );

      setSubmitted(true);

      form.reset();

    } catch (error) {
      console.error(
        "REGISTRATION ERROR:",
        error
      );

      alert(
        "Something went wrong while processing the registration. Please try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRegistration = () => {
    setSubmitted(false);
    setRegistrationId("");
  };

  const openRegistration = () => {
    setSubmitted(false);
    setRegistrationId("");
    setShowForm(true);
  };

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="bg-blue-900 text-white shadow-md">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>

            <h1 className="text-2xl font-bold">
              Imotiv People
            </h1>

            <p className="text-sm text-blue-200">
              People Registration Platform
            </p>

          </div>

          <button
            type="button"
            onClick={openRegistration}
            className="rounded-lg bg-white px-5 py-2.5 font-semibold text-blue-900 shadow hover:bg-blue-50"
          >
            Register
          </button>

        </div>

      </header>

      {/* =====================================================
          HERO / LANDING PAGE
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid items-center gap-12 md:grid-cols-2">

          {/* LEFT SIDE */}

          <div>

            <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
              Official Registration Portal
            </span>

            <h2 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Simple, Secure & Reliable People Registration
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Register your personal, family, community and
              identification information securely using the
              Imotiv People Registration Platform.
            </p>

            <button
              type="button"
              onClick={openRegistration}
              className="mt-8 rounded-lg bg-blue-700 px-7 py-3.5 font-semibold text-white shadow-lg hover:bg-blue-800"
            >
              Start Registration
            </button>

          </div>

          {/* RIGHT SIDE */}

          <div className="rounded-2xl bg-white p-8 shadow-xl">

            <div className="space-y-5">

              <div className="rounded-xl bg-blue-50 p-5">

                <h3 className="font-bold text-blue-900">
                  Personal Information
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Securely collect important personal
                  information.
                </p>

              </div>

              <div className="rounded-xl bg-green-50 p-5">

                <h3 className="font-bold text-green-900">
                  Community Information
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Record village, ward, kindred, family
                  and zone information.
                </p>

              </div>

              <div className="rounded-xl bg-purple-50 p-5">

                <h3 className="font-bold text-purple-900">
                  Secure Records
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Registration records will be securely
                  stored and searchable.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          REGISTRATION MODAL
      ===================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-8">

          <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white shadow-2xl">

            {/* =================================================
                SUCCESS SCREEN
            ================================================= */}

            {submitted ? (

              <div className="p-10 text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">

                  <span className="text-4xl font-bold text-green-600">
                    ✓
                  </span>

                </div>

                <h2 className="mt-6 text-3xl font-bold text-slate-900">
                  Registration Successful!
                </h2>

                <p className="mx-auto mt-3 max-w-md text-slate-600">
                  The registration information has been
                  received and saved successfully.
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

              <>

                {/* =============================================
                    FORM HEADER
                ============================================= */}

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
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-3xl leading-none text-white hover:text-blue-200"
                  >
                    ×
                  </button>

                </div>

                {/* =============================================
                    FORM
                ============================================= */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-8 p-6"
                >

                  {/* =========================================
                      1. PERSONAL INFORMATION
                  ========================================= */}

                  <section>

                    <div className="mb-5 border-b pb-3">

                      <h3 className="text-xl font-bold text-slate-900">
                        1. Personal Information
                      </h3>

                      <p className="text-sm text-slate-500">
                        Basic information about the person
                        being registered.
                      </p>

                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div className="md:col-span-2">

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Full Name (Surname first) *
                        </label>

                        <input
                          type="text"
                          name="full_name"
                          placeholder="e.g. Smith, John Doe"
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

                          <option value="">
                            Select gender
                          </option>

                          <option value="Male">
                            Male
                          </option>

                          <option value="Female">
                            Female
                          </option>

                        </select>

                      </div>

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Marital Status *
                        </label>

                        <select
                          name="marital_status"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                        >

                          <option value="">
                            Select status
                          </option>

                          <option value="Single">
                            Single
                          </option>

                          <option value="Married">
                            Married
                          </option>

                          <option value="Divorced">
                            Divorced
                          </option>

                          <option value="Widowed">
                            Widowed
                          </option>

                        </select>

                      </div>

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Religion *
                        </label>

                        <input
                          type="text"
                          name="religion"
                          placeholder="Enter religion"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Phone Number *
                        </label>

                        <input
                          type="tel"
                          name="phone_number"
                          placeholder="08012345678"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Email Address *
                        </label>

                        <input
                          type="email"
                          name="email"
                          placeholder="example@email.com"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* PASSPORT */}

                      <div className="md:col-span-2">

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Passport Photograph *
                        </label>

                        <input
                          type="file"
                          name="passport_photo"
                          accept="image/jpeg,image/png,image/webp"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Upload a clear JPG, PNG or WEBP
                          passport photograph.
                        </p>

                      </div>

                    </div>

                  </section>

                  {/* =========================================
                      2. ADDRESS & COMMUNITY INFORMATION
                  ========================================= */}

                  <section>

                    <div className="mb-5 border-b pb-3">

                      <h3 className="text-xl font-bold text-slate-900">
                        2. Address & Community Information
                      </h3>

                      <p className="text-sm text-slate-500">
                        Information about the person's
                        community and family.
                      </p>

                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      {/* STATE */}

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

                      {/* LGA */}

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

                      {/* DISTRICT */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          District *
                        </label>

                        <input
                          type="text"
                          name="district"
                          placeholder="Enter district"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Enter the district where the person
                          belongs or resides.
                        </p>

                      </div>

                      {/* WARD */}

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

                      {/* VILLAGE */}

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

                      {/* KINDRED */}

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

                      {/* NAME OF PARENTS */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Name of Parents *
                        </label>

                        <input
                          type="text"
                          name="parents_name"
                          placeholder="Enter name of parents"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* ZONE */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Zone *
                        </label>

                        <select
                          name="zone"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                        >

                          <option value="">
                            Select Zone
                          </option>

                          <option value="Zone A">
                            Zone A
                          </option>

                          <option value="Zone B">
                            Zone B
                          </option>

                          <option value="Zone C">
                            Zone C
                          </option>

                          <option value="Zone D">
                            Zone D
                          </option>

                        </select>

                      </div>

                      {/* NUMBER OF YEARS STAYED IN IMO STATE */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Number of Years Stayed in Imo State *
                        </label>

                        <input
                          type="number"
                          name="years_stayed_in_imo_state"
                          placeholder="e.g. 10"
                          min="0"
                          max="120"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Enter the number of years the person
                          has stayed in Imo State.
                        </p>

                      </div>

                    </div>

                  </section>

                  {/* =========================================
                      3. ADDRESSES
                  ========================================= */}

                  <section>

                    <div className="mb-5 border-b pb-3">

                      <h3 className="text-xl font-bold text-slate-900">
                        3. Addresses
                      </h3>

                      <p className="text-sm text-slate-500">
                        Provide the person's permanent home
                        address and current residential address.
                      </p>

                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      {/* PERMANENT HOME ADDRESS */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Permanent Home Address *
                        </label>

                        <textarea
                          rows={5}
                          name="permanent_home_address"
                          placeholder="Enter permanent home address"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* RESIDENTIAL ADDRESS */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Residential Address *
                        </label>

                        <textarea
                          rows={5}
                          name="residential_address"
                          placeholder="Enter current residential address"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                    </div>

                  </section>

                  {/* =========================================
                      4. OCCUPATION & EDUCATION
                  ========================================= */}

                  <section>

                    <div className="mb-5 border-b pb-3">

                      <h3 className="text-xl font-bold text-slate-900">
                        4. Occupation & Education
                      </h3>

                      <p className="text-sm text-slate-500">
                        Provide the person's occupation,
                        organisation and educational qualification.
                      </p>

                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      {/* OCCUPATION */}

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

                      {/* ORGANISATION */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Organisation
                        </label>

                        <input
                          type="text"
                          name="organization"
                          placeholder="Enter organisation"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* EDUCATIONAL QUALIFICATION */}

                      <div className="md:col-span-2">

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Educational Qualification *
                        </label>

                        <select
                          name="educational_qualification"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                        >

                          <option value="">
                            Select educational qualification
                          </option>

                          <option value="No Formal Education">
                            No Formal Education
                          </option>

                          <option value="Primary School">
                            Primary School
                          </option>

                          <option value="Secondary School">
                            Secondary School
                          </option>

                          <option value="WAEC / NECO">
                            WAEC / NECO
                          </option>

                          <option value="NCE">
                            NCE
                          </option>

                          <option value="OND">
                            OND
                          </option>

                          <option value="HND">
                            HND
                          </option>

                          <option value="Bachelor's Degree">
                            Bachelor&apos;s Degree
                          </option>

                          <option value="Postgraduate Diploma">
                            Postgraduate Diploma
                          </option>

                          <option value="Master's Degree">
                            Master&apos;s Degree
                          </option>

                          <option value="Doctorate / PhD">
                            Doctorate / PhD
                          </option>

                          <option value="Professional Qualification">
                            Professional Qualification
                          </option>

                          <option value="Other">
                            Other
                          </option>

                        </select>

                      </div>

                    </div>

                  </section>

                  {/* =========================================
                      5. IDENTIFICATION
                  ========================================= */}

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

                      {/* ID TYPE */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          ID Type *
                        </label>

                        <select
                          name="id_type"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                        >

                          <option value="">
                            Select ID type
                          </option>

                          <option value="National ID / NIN">
                            National ID / NIN
                          </option>

                          <option value="Voter's Card">
                            Voter&apos;s Card
                          </option>

                          <option value="Driver's Licence">
                            Driver&apos;s Licence
                          </option>

                          <option value="International Passport">
                            International Passport
                          </option>

                          <option value="Other">
                            Other
                          </option>

                        </select>

                      </div>

                      {/* ID NUMBER */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          ID Number *
                        </label>

                        <input
                          type="text"
                          name="id_number"
                          placeholder="Enter ID number"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* VALID ID */}

                      <div className="md:col-span-2">

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Upload Valid ID *
                        </label>

                        <input
                          type="file"
                          name="valid_id"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          required
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Accepted formats: JPG, JPEG, PNG,
                          WEBP or PDF. Maximum file size:
                          50 MB.
                        </p>

                      </div>

                    </div>

                  </section>

                  {/* =========================================
                      6. EMERGENCY CONTACT & NEXT OF KIN
                  ========================================= */}

                  <section>

                    <div className="mb-5 border-b pb-3">

                      <h3 className="text-xl font-bold text-slate-900">
                        6. Emergency Contact & Next of Kin
                      </h3>

                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      {/* EMERGENCY NAME */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Emergency Contact Name *
                        </label>

                        <input
                          type="text"
                          name="emergency_contact_name"
                          placeholder="Full name"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* EMERGENCY PHONE */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Emergency Contact Phone *
                        </label>

                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          placeholder="08012345678"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* RELATIONSHIP */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Relationship to Registrant *
                        </label>

                        <input
                          type="text"
                          name="emergency_relationship"
                          placeholder="e.g. Brother, Sister, Father, Mother"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                      {/* NEXT OF KIN PHONE */}

                      <div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Next of Kin Phone Number *
                        </label>

                        <input
                          type="tel"
                          name="next_of_kin_phone"
                          placeholder="08012345678"
                          required
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                      </div>

                    </div>

                  </section>

                  {/* =========================================
                      SUBMIT
                  ========================================= */}

                  <div className="border-t pt-6">

                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">

                      <strong>Important:</strong>{" "}
                      Please check that all information
                      provided is accurate before submitting.

                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        disabled={isSubmitting}
                        className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-blue-700 px-7 py-3 font-semibold text-white shadow hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting
                          ? "Submitting..."
                          : "Submit Registration"}
                      </button>

                    </div>

                  </div>

                </form>

              </>

            )}

          </div>

        </div>

      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t bg-white py-6 text-center text-sm text-slate-500">
        © 2026 Imotiv People Registration Platform
      </footer>

    </main>
  );
}