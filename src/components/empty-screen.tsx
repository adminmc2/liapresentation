import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welcome to RainAI!
        </h1>
        <p className="leading-normal text-muted-foreground">
          This is an open source AI chatbot built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>, the{' '}
          <ExternalLink href="https://ui.shadcn.com/">
            Shadcn/ui
          </ExternalLink>
          , and{' '}
          <ExternalLink href="https://openai.com/">
            OpenAI
          </ExternalLink>
          .
        </p>
        <p className="leading-normal text-muted-foreground">
          Now you can check the weather in your city before leaving home!
        </p>
      </div>
    </div>
  )
}
