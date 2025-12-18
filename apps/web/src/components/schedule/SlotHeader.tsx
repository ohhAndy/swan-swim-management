import { PrintButton } from "./PrintButton";

export function SlotHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-md bg-slate-200 px-4 py-2 print:hidden">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <PrintButton />
    </div>
  );
}
