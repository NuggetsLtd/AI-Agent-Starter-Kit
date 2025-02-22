"use client";

import { ReactElement } from "react";
import NuggetsChat from "../_components/NuggetsChat";

export default function Nuggets(): ReactElement {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <NuggetsChat />
      </div>
    </main>
  );
}
