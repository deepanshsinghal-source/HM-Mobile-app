import { useState, useEffect } from 'react';
import HubSummaryDesignerRevamp from './HubSummaryDesignerRevamp';
import HubSummaryMobile from './HubSummaryMobile';

function App() {
    const [view, setView] = useState<'desktop' | 'mobile'>('desktop');

    useEffect(() => {
        const checkHash = () => {
            if (window.location.hash === '#mobile') {
                setView('mobile');
            } else {
                setView('desktop');
            }
        };
        checkHash();
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, []);

    return (
        <>
            {view === 'mobile' ? <HubSummaryMobile /> : <HubSummaryDesignerRevamp />}
            {/* Dev toggle for easy switching */}
            <div className="fixed bottom-4 right-4 z-[9999] opacity-50 hover:opacity-100 transition-opacity">
                <a
                    href={view === 'desktop' ? '#mobile' : '#'}
                    className="bg-black text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg border border-slate-700 hover:bg-slate-800"
                >
                    Switch to {view === 'desktop' ? 'Mobile App' : 'Desktop'}
                </a>
            </div>
        </>
    );
}

export default App;
