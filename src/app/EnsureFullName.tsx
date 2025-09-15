'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function EnsureFullName() {
  const { user, isLoaded } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    if (!user.firstName || !user.lastName) {
      setShowModal(false);
    }
  }, [user, isLoaded]);

  const handleSave = async () => {
    try {
      if (!fullName.trim()) {
        alert("Please enter your name");
        return;
      }

      // option 1: save as username
      // await user?.update({ username: fullName });
      console.log("allow saving full name by fixing clerk setings:", fullName);

      // option 2: or save in metadata
      // await user?.update({ publicMetadata: { fullName } });

      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save name. Please try again.");
    }
  };


  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-6 w-80 sm:w-96 text-foreground space-y-4 shadow-lg">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
          Enter Your Full Name
        </h2>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-2 rounded-md bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-md border border-border text-muted-foreground hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] text-white font-medium hover:opacity-90 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
