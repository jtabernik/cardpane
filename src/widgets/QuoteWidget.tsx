import React, { useEffect, useState } from 'react';
import type { Widget, WidgetProps } from '../core/types';

interface QuoteData {
    content: string;
    author: string;
}

const QuoteComponent: React.FC<WidgetProps> = () => {
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);

    const FALLBACK_QUOTES = [
        { content: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
        { content: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
        { content: "Make it work, make it right, make it fast.", author: "Kent Beck" }
    ];

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
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.1rem', fontStyle: 'italic', lineHeight: '1.5' }}>
                "{quote?.content}"
            </div>
            <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                — {quote?.author}
            </div>
            <button
                onClick={fetchQuote}
                style={{
                    marginTop: '15px',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: '1px solid var(--primary-color)',
                    color: 'var(--primary-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    fontSize: '0.8rem'
                }}
            >
                New Quote
            </button>
        </div>
    );
};

export const QuoteWidget: Widget = {
    id: 'quote-widget',
    name: 'Random Quote',
    description: 'Fetches a random inspirational quote',
    component: QuoteComponent,
    defaultSize: { w: 4, h: 4 }
};
