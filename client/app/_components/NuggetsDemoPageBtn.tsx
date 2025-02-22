"use client";

import { Button } from "@/components/ui/button";

export function NuggetsDemoPageBtn() {

  const handleNuggetsDemoLinkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/nuggets';
  };

  return (
    <div className="flex items-center justify-center w-full my-4">
      <Button
        type="button"
        onClick={handleNuggetsDemoLinkClick}
        className="flex items-center gap-2 bg-[#8665a1] hover:bg-[#8665a1] text-white rounded"
      >
        <span>Nuggets Eliza Demo</span>
      </Button>
    </div>
  );
}
