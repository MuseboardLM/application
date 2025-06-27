// components/museboard/ClientFormattedDate.tsx
"use client";

import { useState, useEffect } from "react";

interface ClientFormattedDateProps {
  date: string | Date;
}

export default function ClientFormattedDate({ date }: ClientFormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState("");

  // This effect runs only on the client, after the initial render.
  useEffect(() => {
    // We format the date here, ensuring it only happens on the client side.
    setFormattedDate(new Date(date).toLocaleDateString());
  }, [date]);

  // On the initial server render and first client render, this returns null, preventing a mismatch.
  // After hydration, the useEffect runs, state updates, and the component re-renders with the formatted date.
  if (!formattedDate) {
    return null; // Or a loading skeleton, but null is fine here.
  }

  return <span>{formattedDate}</span>;
}