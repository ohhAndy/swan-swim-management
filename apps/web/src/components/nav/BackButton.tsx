'use client'

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function BackButton( {
    fallbackHref,
} : {
    fallbackHref?: string;
}) {
    const router = useRouter();

    return (
        <Button
            variant="outline"
            onClick={() => {
                if(window.history.length > 1) router.back();
                else if (fallbackHref) router.push(fallbackHref);
            }}
        >
            ← Back
        </Button>
    );
}