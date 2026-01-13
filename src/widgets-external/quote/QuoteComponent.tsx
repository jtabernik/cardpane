import React, { useEffect, useState } from 'react';
import type { WidgetProps } from '../../core/types';

interface QuoteData {
    content: string;
    author: string;
}

const FALLBACK_QUOTES = [
    { content: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { content: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
    { content: "Make it work, make it right, make it fast.", author: "Kent Beck" }
];

export const QuoteComponent: React.FC<WidgetProps> = () => {
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQuote = async () => {
        setLoading(true);
        try {
            const res = await fetch('https://api.quotable.io/random?tags=technology,inspirational');
            if (!res.ok) throw new Error('API down');
            const data = await res.json();
            setQuote({ content: data.content, author: data.author });
        } catch (e) {
            console.warn('[QuoteWidget] API error (likely offline):', e);
            const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
            setQuote(randomFallback);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuote();
    }, []);

    if (loading) {
        return (
            <div className="widget-card flex-center-column">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="widget-card flex-column" style={{ justifyContent: 'space-between' }}>
            <div className="text-secondary italic" style={{ fontSize: '1.1rem' }}>
                "{quote?.content}"
            </div>
            <div className="text-accent mt-medium text-small text-right font-bold">
                — {quote?.author}
            </div>
            <button
                onClick={fetchQuote}
                className="btn-secondary mt-large"
                style={{ alignSelf: 'flex-start' }}
            >
                New Quote
            </button>
        </div>
    );
};
