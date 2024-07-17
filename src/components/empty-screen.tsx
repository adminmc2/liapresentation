import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welcome to Chatbot Next.js!
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
          Make the most of all the power of ChatGPT Turbo!
        </p>
      </div>
    </div>
  )
}
