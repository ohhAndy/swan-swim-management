import { getSlotPage } from "@/lib/api/schedule";
import { weekdayName, groupByOffering } from "@/lib/schedule/transform";
import { SlotPage } from "@school/shared-types";
import { SlotHeader } from "@/components/schedule/SlotHeader";
import { SlotBlock } from "@/components/schedule/SlotBlock";
import { BackButton } from "@/components/nav/BackButton";
import NextButton from "@/components/nav/NextButton";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";


function parseRange(range: string) {
    const [start, end] = range.split("-");
    return{ start, end };
}

export default async function SlotPageView({
    params,
}: {
    params: Promise<{ weekday: string, termId: string, range: string }>
}) {
    const user = await getCurrentUser(); 
    if (!user) {
        redirect('/login');
    }

    const resolvedParams = await params;
    const { weekday, termId, range } = resolvedParams;
    const { start, end } = parseRange(range);
    const data: SlotPage = await getSlotPage(termId, Number(weekday), start, end);

    const title = `${weekdayName(data.meta.weekday)} - ${data.meta.startTime} - ${data.meta.endTime}`;
    const subtitle = data.meta.term?.name ?? null;

    const dateLabels = data.days.map(d => new Date(d.date).toLocaleDateString());
    const isoDates = data.days.map(d => d.date);
    const blocks = groupByOffering(data);

    return (
        <main className="p-6 print:p-0">
            <div className="mb-3 flex items-center justify-between">
                <BackButton fallbackHref={`/term/${termId}/schedule`} />
                <NextButton baseHref={`/term/${termId}/schedule`} weekday={Number(weekday)} slotTime={decodeURIComponent(range)} termId={termId}/>
            </div>

            <SlotHeader title={title} subtitle={subtitle}/>
            <div className="grid gap-5">
                {blocks.map(b => (
                    <SlotBlock 
                        key={b.offeringKey}
                        title={b.title}
                        notes={b.notes}
                        dateLabels={dateLabels}
                        isoDates={isoDates}
                        rosters={b.rosters}
                        user={user}
                    />
                ))}
            </div>
        </main>
    );
}