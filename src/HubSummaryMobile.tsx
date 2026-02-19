import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    User, MapPin, Phone, AlertTriangle, CheckCircle2, Home,
    ChevronRight, Search, Check, Navigation, Briefcase, Star, Activity as ActivityIcon
} from "lucide-react";

// ============================================================================
// TYPES & DATA (Mirrored from Desktop for Consistency)
// ============================================================================

type HTDStage = "upcoming" | "ongoing" | "cancelled" | "completed";
type CallStatus = "yes" | "no" | "late" | "na";
type RMStatus = "Idle" | "At Hub" | "Driving" | "Checked-out" | "At Customer" | "Returning" | "Visit Running";
type TokenStatus = "yes" | "no";
// Types removed

type HTDRow = {
    leadId: string;
    customerName: string;
    rmName: string;
    car: string; // Added car property
    slot: string;
    stage: HTDStage;
    call?: CallStatus;
    rmStatus?: RMStatus;
    travelMins?: number;
    estTravelMins?: number;
    checkoutTime?: string | null;
    checkinTime?: string | null;
    reachCustomerMins?: number | null;
    returnToHubMins?: number | null;
    visitDurationMins?: number | null;
    idleButLateCheckout?: boolean | null;
    etaBackToHub?: string | null;
    estTotalMins?: number | null;
    actualMins?: number | null;
    token?: TokenStatus;
    feedbackRating?: 1 | 2 | 3 | 4 | 5 | null;
    didFollowUp?: boolean | null;
    cancelReason?: string;
    notes?: string;
};

// car property added to HTD_DEMO items
const HTD_DEMO: HTDRow[] = [
    { leadId: "LD-10109", customerName: "Priya G.", car: "Nexon EV", rmName: "Aman Sharma", rmStatus: "At Hub", slot: "17:00", travelMins: 35, call: "na", stage: "upcoming", notes: "Customer requested EV specific demo." },
    { leadId: "LD-2002", customerName: "Karan Johar", car: "Scorpio-N", rmName: "Chetan Arora", rmStatus: "Checked-out", slot: "19:00", travelMins: 45, call: "yes", stage: "upcoming" },
    { leadId: "LD-2003", customerName: "Ananya Panday", car: "Thar", rmName: "Badal Rajpoot", rmStatus: "Idle", slot: "20:30", travelMins: 25, call: "na", stage: "upcoming" },
    { leadId: "LD-10107", customerName: "Sahil Verma", car: "Thar 4x4", rmName: "Mehul Singh", slot: "16:00", call: "yes", stage: "ongoing", estTravelMins: 25, checkoutTime: "15:20", reachCustomerMins: 28, checkinTime: "15:55", returnToHubMins: null, visitDurationMins: 35, idleButLateCheckout: false, etaBackToHub: "17:15", notes: "Thar 4x4 test drive currently active." },
    { leadId: "LD-3005", customerName: "Ritik Roshan", car: "XUV700", rmName: "Neeraj Verma", slot: "15:00", call: "late", stage: "ongoing", estTravelMins: 30, checkoutTime: "14:40", reachCustomerMins: 35, checkinTime: "15:15", returnToHubMins: null, visitDurationMins: 75, idleButLateCheckout: false, etaBackToHub: "16:45", notes: "Customer asking many questions; visit extended." },
    { leadId: "LD-10104", customerName: "Neeraj V.", car: "Creta SX(O)", rmName: "Chetan Arora", slot: "13:00", call: "yes", stage: "completed", estTotalMins: 70, actualMins: 65, token: "yes", feedbackRating: 5 },
    { leadId: "LD-10102", customerName: "Sandeep R.", car: "Baleno Alpha", rmName: "Chetan Arora", slot: "11:30", call: "yes", stage: "completed", estTotalMins: 60, actualMins: 55, token: "no", feedbackRating: 5, notes: "Customer loved the car but budget constraint." },
    { leadId: "LD-1001", customerName: "Nikhil", car: "i20", rmName: "Aman Sharma", slot: "12:00", call: "no", stage: "cancelled", didFollowUp: null, cancelReason: "", notes: "Phone switched off." },
];

type Activity = "HV" | "HTD" | "IDLE";
type ScheduleItem = { at: string; type: Activity; state: "done" | "ongoing" | "upcoming"; leadId: string; durationMin?: number; token?: "yes" | "no"; feedbackRating?: number; };
type RM = {
    id: string; name: string; now: Activity; customer?: string; currentLeadId?: string; startedAt: string; frc: string; frcAvgMTD?: string; location: string;
    visitsToday: number; tokensToday: number; deliveriesToday: number; feedbackFilledToday: number;
    visitsMTD: number; tokensMTD: number; deliveriesMTD: number; feedbackFilledMTD: number; schedule: ScheduleItem[];
};

const RM_DEMO: RM[] = [
    {
        id: "1", name: "Mehul Singh", now: "HTD", customer: "Sahil Verma", currentLeadId: "LD-10107",
        startedAt: "2026-02-11T15:20:00", frc: "2026-02-11T09:45:00", frcAvgMTD: "09:35", location: "At Customer",
        visitsToday: 2, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 0,
        visitsMTD: 26, tokensMTD: 8, deliveriesMTD: 3, feedbackFilledMTD: 14,
        schedule: [{ at: "14:30", type: "HV", state: "done", leadId: "LD-10105", durationMin: 45, token: "no", feedbackRating: 4 }, { at: "16:00", type: "HTD", state: "ongoing", leadId: "LD-10107" }]
    },
    {
        id: "2", name: "Chetan Arora", now: "IDLE",
        startedAt: "2026-02-11T14:30:00", frc: "2026-02-11T09:05:00", frcAvgMTD: "09:18", location: "Hub",
        visitsToday: 2, tokensToday: 1, deliveriesToday: 0, feedbackFilledToday: 2,
        visitsMTD: 43, tokensMTD: 15, deliveriesMTD: 6, feedbackFilledMTD: 28,
        schedule: [{ at: "11:30", type: "HTD", state: "done", leadId: "LD-10102", durationMin: 55, token: "yes", feedbackRating: 5 }, { at: "13:00", type: "HTD", state: "done", leadId: "LD-10104", durationMin: 65, token: "no", feedbackRating: 5 }, { at: "19:00", type: "HTD", state: "upcoming", leadId: "LD-2002" }]
    },
    {
        id: "3", name: "Badal Rajpoot", now: "HV", customer: "Vivek S.", currentLeadId: "LD-10108",
        startedAt: "2026-02-11T15:55:00", frc: "2026-02-11T09:10:00", frcAvgMTD: "09:22", location: "Driving",
        visitsToday: 2, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 1,
        visitsMTD: 55, tokensMTD: 18, deliveriesMTD: 7, feedbackFilledMTD: 30,
        schedule: [{ at: "12:15", type: "HV", state: "done", leadId: "LD-10103", durationMin: 45, token: "no", feedbackRating: 2 }, { at: "16:15", type: "HV", state: "ongoing", leadId: "LD-10108" }, { at: "20:30", type: "HTD", state: "upcoming", leadId: "LD-2003" }]
    },
    {
        id: "4", name: "Neeraj Verma", now: "HTD", customer: "Ritik Roshan", currentLeadId: "LD-3005",
        startedAt: "2026-02-11T14:40:00", frc: "2026-02-11T08:55:00", frcAvgMTD: "09:08", location: "At Customer",
        visitsToday: 2, tokensToday: 0, deliveriesToday: 1, feedbackFilledToday: 1,
        visitsMTD: 72, tokensMTD: 30, deliveriesMTD: 15, feedbackFilledMTD: 40,
        schedule: [{ at: "13:30", type: "HV", state: "done", leadId: "LD-10106", durationMin: 30, token: "no", feedbackRating: 3 }, { at: "15:00", type: "HTD", state: "ongoing", leadId: "LD-3005" }]
    },
    {
        id: "5", name: "Aman Sharma", now: "IDLE",
        startedAt: "2026-02-11T12:05:00", frc: "2026-02-11T09:20:00", frcAvgMTD: "09:25", location: "Hub",
        visitsToday: 1, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 1,
        visitsMTD: 86, tokensMTD: 35, deliveriesMTD: 18, feedbackFilledMTD: 55,
        schedule: [{ at: "10:15", type: "HV", state: "done", leadId: "LD-10101", durationMin: 45, token: "no", feedbackRating: 4 }, { at: "17:00", type: "HTD", state: "upcoming", leadId: "LD-10109" }]
    }
];

// ============================================================================
// UTILS
// ============================================================================

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
function formatTime(ts: string) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function toMins(hhmm: string) {
    const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
    return h * 60 + m;
}
function fromMins(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const DEMO_NOW = "16:30";

// ============================================================================
// MOBILE COMPONENT
// ============================================================================

export default function HubSummaryMobile() {
    const [activeTab, setActiveTab] = useState<'home' | 'dispatch' | 'team'>('home');
    const [selectedHTD, setSelectedHTD] = useState<HTDRow | null>(null);
    const [selectedRM, setSelectedRM] = useState<RM | null>(null);

    // --- Computed Data ---
    const nowMins = toMins(DEMO_NOW);

    // Alerts Logic
    const alerts = useMemo(() => {
        const list: Array<{ id: string; level: 'critical' | 'warning'; msg: string; time: string }> = [];
        HTD_DEMO.filter(r => r.stage === 'upcoming' && r.travelMins).forEach(r => {
            const leaveBy = toMins(r.slot) - (r.travelMins || 0);
            if (nowMins >= leaveBy && r.rmStatus !== 'Driving' && r.rmStatus !== 'Checked-out') {
                list.push({
                    id: r.leadId, level: 'critical',
                    msg: `Late Dispatch: ${r.customerName} (${r.slot})`,
                    time: fromMins(nowMins)
                });
            }
        });
        return list;
    }, [nowMins]);

    const activeRMs = RM_DEMO.filter(r => r.now !== 'IDLE');
    const idleRMs = RM_DEMO.filter(r => r.now === 'IDLE');

    return (
        <div className="flex flex-col h-screen bg-neutral-50 font-sans text-slate-900 overflow-hidden">

            {/* --- HEADER --- */}
            <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Hub Control</h1>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{new Date().toDateString()} · {DEMO_NOW}</p>
                </div>
                <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                        <User className="h-5 w-5 text-slate-600" />
                    </div>
                    {alerts.length > 0 && <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-rose-500 border-2 border-white" />}
                </div>
            </header>

            {/* --- MAIN SCROLLABLE CONTENT --- */}
            <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">

                {/* === HOME TAB === */}
                {activeTab === 'home' && (
                    <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* 1. Alerts Section (If Any) */}
                        {alerts.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-rose-500" /> Action Required ({alerts.length})
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {alerts.map(a => (
                                        <div key={a.id} className="bg-white border-l-4 border-rose-500 rounded-r-xl shadow-sm p-4 flex justify-between items-center active:bg-rose-50 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{a.msg}</p>
                                                <p className="text-xs text-slate-500 mt-1">Detected at {a.time}</p>
                                            </div>
                                            < ChevronRight className="h-5 w-5 text-slate-300" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Key Metrics Grid */}
                        <section className="grid grid-cols-2 gap-4">
                            <Card className="border-none shadow-sm bg-slate-900 text-white relative overflow-hidden">
                                <CardContent className="p-4 relative z-10">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Tokens Today</div>
                                    <div className="text-4xl font-bold tracking-tighter">3<span className="text-lg text-slate-600 font-normal">/8</span></div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: '37%' }} />
                                    </div>
                                </CardContent>
                                {/* Background Decoration */}
                                <div className="absolute -right-4 -bottom-6 opacity-10">
                                    <CheckCircle2 className="h-24 w-24" />
                                </div>
                            </Card>

                            <Card className="border-none shadow-sm bg-white text-slate-900">
                                <CardContent className="p-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Active Team</div>
                                    <div className="flex items-baseline gap-1">
                                        <div className="text-4xl font-bold tracking-tighter text-blue-600">{activeRMs.length}</div>
                                        <div className="text-sm text-slate-400 font-medium">busy</div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {idleRMs.length} Available
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* 3. Pulse / Feedback Section */}
                        <section>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Customer Pulse</h2>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-500">Avg Rating</span>
                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-sm font-bold">
                                        4.8 <Star className="h-3 w-3 fill-amber-700" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {HTD_DEMO.filter(r => r.feedbackRating).slice(0, 3).map((r, i) => (
                                        <div key={i} className="flex gap-3 items-start border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                                {r.customerName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <p className="text-xs font-bold text-slate-900">{r.customerName}</p>
                                                    <div className="flex text-[10px] text-amber-500">
                                                        {[...Array(r.feedbackRating)].map((_, j) => <Star key={j} className="h-3 w-3 fill-amber-500" />)}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{r.rmName} · {r.car}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* === DISPATCH TAB (HTD) === */}
                {activeTab === 'dispatch' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-full bg-white">
                        {/* Sticky Filter Bar */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar z-10">
                            {(['upcoming', 'ongoing', 'completed', 'cancelled'] as const).map(f => (
                                <button
                                    key={f}
                                    className={cx(
                                        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                        "bg-slate-900 text-white border-slate-900 shadow-md transform active:scale-95" // Selected style for now, fix later with state
                                    )}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="divide-y divide-slate-100">
                            {HTD_DEMO.filter(r => r.stage === 'upcoming').map(r => (
                                <div
                                    key={r.leadId}
                                    onClick={() => setSelectedHTD(r)}
                                    className="p-5 active:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 rounded-lg h-12 w-12 flex flex-col items-center justify-center text-slate-700 font-bold border border-slate-200">
                                                <span className="text-sm leading-none">{r.slot.split(':')[0]}</span>
                                                <span className="text-[10px] leading-none text-slate-400">{r.slot.split(':')[1]}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 leading-tight">{r.customerName}</h3>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> 12km · {r.travelMins}m drive
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px] font-bold">
                                            {r.rmName.split(' ')[0]}
                                        </Badge>
                                    </div>

                                    {/* Footer Actions / Status */}
                                    <div className="pl-[60px] flex items-center gap-4 mt-3">
                                        {r.call === 'yes' ? (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> Called
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1 relative">
                                                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse absolute -top-1 -right-1 border border-white" />
                                                <Phone className="h-3 w-3" /> Call Pending
                                            </span>
                                        )}

                                        {/* Dynamic Status Text */}
                                        <span className={cx(
                                            "text-[10px] font-medium ml-auto flex items-center gap-1",
                                            r.rmStatus === 'Idle' ? "text-slate-400" : "text-blue-600"
                                        )}>
                                            {r.rmStatus === 'Idle' ? 'RM Not Started' : `RM: ${r.rmStatus}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {/* DEMO: Show Ongoing too just for visual fullness if list is short */}
                            {HTD_DEMO.filter(r => r.stage === 'ongoing').map(r => (
                                <div key={r.leadId} onClick={() => setSelectedHTD(r)} className="p-5 bg-blue-50/30 border-l-4 border-blue-500 active:bg-blue-50 cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 rounded-lg h-12 w-12 flex items-center justify-center text-blue-700 animate-pulse">
                                                <ActivityIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 leading-tight">{r.customerName}</h3>
                                                <p className="text-xs text-blue-600 font-bold mt-0.5">Visit in Progress</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-mono font-bold text-slate-900">{r.checkinTime}</div>
                                            <div className="text-[10px] text-slate-500">Started</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === TEAM TAB (RM) === */}
                {activeTab === 'team' && (
                    <div className="p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search RM or Location..."
                                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Cards */}
                        <div className="space-y-3">
                            {RM_DEMO.map(rm => (
                                <div
                                    key={rm.id}
                                    onClick={() => setSelectedRM(rm)}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border-2 border-white shadow-sm">
                                                {rm.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className={cx(
                                                "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                                                rm.now === 'IDLE' ? 'bg-emerald-500' : 'bg-amber-500'
                                            )} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-bold text-slate-900 truncate">{rm.name}</h3>
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    {formatTime(rm.startedAt)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-1">
                                                {rm.now === 'IDLE' ? (
                                                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> At Hub
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-600 truncate flex items-center gap-1">
                                                        <Navigation className="h-3 w-3 text-blue-500" /> {rm.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini Stats Footer */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-500">
                                        <div className="text-center w-1/3 border-r border-slate-100">
                                            <span className="block font-bold text-slate-900 text-xs">{rm.visitsToday}</span>
                                            Visits
                                        </div>
                                        <div className="text-center w-1/3 border-r border-slate-100">
                                            <span className="block font-bold text-slate-900 text-xs">{rm.tokensToday}</span>
                                            Tokens
                                        </div>
                                        <div className="text-center w-1/3">
                                            <span className="block font-bold text-slate-900 text-xs">{rm.deliveriesToday}</span>
                                            Delivered
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>

            {/* --- BOTTOM NAVIGATION --- */}
            <nav className="shrink-0 bg-white border-t border-slate-200 pb-safe pt-2 px-6 flex justify-between items-center z-20">
                <button
                    onClick={() => setActiveTab('home')}
                    className={cx(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                        activeTab === 'home' ? "bg-slate-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                >
                    <Home className={cx("h-6 w-6", activeTab === 'home' && "fill-current")} />
                    <span className="text-[10px] font-bold">Home</span>
                </button>

                <button
                    onClick={() => setActiveTab('dispatch')}
                    className={cx(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                        activeTab === 'dispatch' ? "bg-slate-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                >
                    <Briefcase className={cx("h-6 w-6", activeTab === 'dispatch' && "fill-current")} />
                    <span className="text-[10px] font-bold">Tasks</span>
                </button>

                <button
                    onClick={() => setActiveTab('team')}
                    className={cx(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                        activeTab === 'team' ? "bg-slate-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                >
                    <User className={cx("h-6 w-6", activeTab === 'team' && "fill-current")} />
                    <span className="text-[10px] font-bold">Team</span>
                </button>
            </nav>

            {/* --- DIALOGS (Styled as Bottom Sheets for Mobile) --- */}

            {/* HTD Detail Sheet */}
            <Dialog open={!!selectedHTD} onOpenChange={(v) => !v && setSelectedHTD(null)}>
                <DialogContent className="fixed bottom-0 md:bottom-auto md:top-1/2 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-[400px] rounded-t-3xl md:rounded-2xl p-0 gap-0 bg-slate-50 safe-pb overscroll-contain max-h-[90vh] overflow-y-auto">
                    {selectedHTD && (
                        <>
                            <div className="bg-white p-6 pb-8 border-b border-slate-100 rounded-t-3xl">
                                <div className="mx-auto w-12 h-1.5 bg-slate-200 rounded-full mb-6" />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">{selectedHTD.stage.toUpperCase()}</Badge>
                                        <DialogTitle className="text-2xl font-bold text-slate-900">{selectedHTD.customerName}</DialogTitle>
                                        <p className="text-sm text-slate-500 font-mono mt-1">{selectedHTD.leadId}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900">{selectedHTD.slot}</div>
                                        <div className="text-xs text-slate-400 font-bold uppercase">Time Slot</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Actions Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="bg-emerald-500 text-white rounded-xl py-3 font-bold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
                                        <Phone className="h-4 w-4" /> Call Client
                                    </button>
                                    <button className="bg-white border border-slate-200 text-slate-700 rounded-xl py-3 font-bold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
                                        <MapPin className="h-4 w-4" /> Navigation
                                    </button>
                                </div>

                                {/* Detail Blocks */}
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Assigned RM</span>
                                        <span className="text-sm font-bold text-slate-900">{selectedHTD.rmName}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Notes</span>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                                            {selectedHTD.notes || "No additional notes provided for this visit."}
                                        </p>
                                    </div>
                                </div>

                                {selectedHTD.stage === 'completed' && (
                                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                                        <div className="text-xs font-bold text-amber-700 uppercase mb-1">Feedback Received</div>
                                        <div className="text-2xl font-bold text-amber-900 flex justify-center items-center gap-2">
                                            {selectedHTD.feedbackRating} <Star className="h-6 w-6 fill-amber-600 text-amber-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* RM Detail Sheet */}
            <Dialog open={!!selectedRM} onOpenChange={(v) => !v && setSelectedRM(null)}>
                <DialogContent className="fixed bottom-0 md:bottom-auto md:top-1/2 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-[400px] rounded-t-3xl md:rounded-2xl p-0 gap-0 bg-slate-50 safe-pb overscroll-contain max-h-[90vh] overflow-y-auto">
                    {selectedRM && (
                        <>
                            <div className="bg-white p-6 border-b border-slate-100 rounded-t-3xl">
                                <div className="mx-auto w-12 h-1.5 bg-slate-200 rounded-full mb-6" />
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold">
                                        {selectedRM.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold text-slate-900">{selectedRM.name}</DialogTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={cx("border-none px-2 py-0.5", selectedRM.now === 'IDLE' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                                {selectedRM.now === 'IDLE' ? 'Available' : `Busy: ${selectedRM.now}`}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Timeline */}
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Today's Timeline</h4>
                                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-6">
                                    {selectedRM.schedule.map((s, i) => (
                                        <div key={i} className="relative pl-6">
                                            <div className={cx(
                                                "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                                                s.state === 'done' ? "bg-slate-300" : s.state === 'ongoing' ? "bg-blue-500 animate-pulse" : "bg-white border-slate-300"
                                            )} />
                                            <div>
                                                <div className="text-xs font-mono font-bold text-slate-500 mb-0.5">{s.at}</div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-sm text-slate-900">{s.type} Visit</span>
                                                        <span className={cx(
                                                            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                                            s.state === 'done' ? "bg-slate-100 text-slate-500" : s.state === 'ongoing' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                                                        )}>{s.state}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Lead: {s.leadId}</p>
                                                    {s.token && (
                                                        <div className="mt-2 pt-2 border-t border-slate-50 flex gap-2">
                                                            {s.token === 'yes' ? (
                                                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Token Collected</span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400">No Token</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
