import ReactMarkdown from "react-markdown";

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: (props) => (
          <h1
            className="mb-6 text-4xl font-bold tracking-tight text-cf-black"
            {...props}
          />
        ),
        h2: (props) => (
          <h2
            className="mt-12 mb-4 text-2xl font-semibold tracking-tight text-cf-black"
            {...props}
          />
        ),
        h3: (props) => (
          <h3
            className="mt-8 mb-3 text-lg font-semibold text-cf-black"
            {...props}
          />
        ),
        p: (props) => (
          <p
            className="my-4 text-[17px] leading-[1.7] text-cf-black/85"
            {...props}
          />
        ),
        ul: (props) => (
          <ul
            className="my-4 list-disc space-y-2 pl-6 text-[17px] leading-[1.7] text-cf-black/85"
            {...props}
          />
        ),
        ol: (props) => (
          <ol
            className="my-4 list-decimal space-y-2 pl-6 text-[17px] leading-[1.7] text-cf-black/85"
            {...props}
          />
        ),
        li: (props) => <li {...props} />,
        a: (props) => (
          <a
            className="text-cf-orange underline-offset-2 hover:underline"
            {...props}
          />
        ),
        strong: (props) => (
          <strong className="font-semibold text-cf-black" {...props} />
        ),
        em: (props) => <em className="italic text-cf-black/75" {...props} />,
        hr: () => <hr className="my-10 border-cf-black/15" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
