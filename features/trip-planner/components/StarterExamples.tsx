import type { TripInput } from "../types";

export type StarterExample = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  input: TripInput;
};

type StarterExamplesProps = {
  examples: StarterExample[];
  isLoading: boolean;
  onSelect: (example: StarterExample) => void;
};

export function StarterExamples({
  examples,
  isLoading,
  onSelect,
}: StarterExamplesProps) {
  return (
    <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel-muted)] p-6 sm:p-8">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-bold text-[var(--accent)]">여행을 시작해 볼까요?</p>
        <h3 className="mt-2 text-2xl font-bold">원하는 여행을 고르고 일정을 만들어 보세요.</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          아래 예시를 선택하면 조건을 채우고 바로 첫 일정 보드를 만들어 드려요.
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          {examples.map((example) => (
            <button
              className="starter-example"
              disabled={isLoading}
              key={example.id}
              onClick={() => onSelect(example)}
              type="button"
            >
              <span className="text-xs font-bold text-[var(--orange)]">{example.eyebrow}</span>
              <span className="mt-2 block font-bold">{example.title}</span>
              <span className="mt-2 block text-sm leading-5 text-slate-600">
                {example.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
