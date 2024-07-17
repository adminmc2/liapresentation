import * as React from "react";

import { cn } from "@/lib/utils";

import { CloudRainWind } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { IconGitHub } from "@/components/ui/icons";

export function Header() {
  return (
    <header className='sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl'>
      <div className='flex items-center'>
        <CloudRainWind className="text-primary" />
      </div>

      <span className="font-bold text-primary">Should I go outside today?</span>

      <div className='flex items-center justify-end'>
        <a
          target='_blank'
          href='https://github.com/vercel/nextjs-ai-chatbot/'
          rel='noopener noreferrer'
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <IconGitHub />
          <span className='hidden ml-2 md:flex'>Star</span>
        </a>
      </div>
    </header>
  );
}
