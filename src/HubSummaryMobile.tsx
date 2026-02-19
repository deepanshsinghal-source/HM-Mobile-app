import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, ChevronDown, Clock, User, Activity, MapPin, Phone, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

// ============================================================================
// SHARED UTILS (Copied from Desktop)
// ============================================================================
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
// Utility functions removed

// ============================================================================
// TYPES (Copied from Desktop)
// ============================================================================
// Types removed

// type RangeKey, FeedbackView, getRangeStartISO, inISOInclusiveRange removed

// ensureLeadId removed

// generateVisits function removed

type HTDStage = "upcoming" | "ongoing" | "cancelled" | "completed";
type CallStatus = "yes" | "no" | "late" | "na";
type RMStatus = "Idle" | "At Hub" | "Driving" | "Checked-out" | "At Customer" | "Returning" | "Visit Running";
type TokenStatus = "yes" | "no";

type HTDRow = {
    leadId: string;
    customerName: string;
    rmName: string;
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

const HTD_DEMO: HTDRow[] = [
    { leadId: "LD-10109", customerName: "Priya G.", rmName: "Aman Sharma", rmStatus: "At Hub", slot: "17:00", travelMins: 35, call: "na", stage: "upcoming", notes: "Customer requested EV specific demo." },
    { leadId: "LD-2002", customerName: "Karan Johar", rmName: "Chetan Arora", rmStatus: "Checked-out", slot: "19:00", travelMins: 45, call: "yes", stage: "upcoming" },
    { leadId: "LD-2003", customerName: "Ananya Panday", rmName: "Badal Rajpoot", rmStatus: "Idle", slot: "20:30", travelMins: 25, call: "na", stage: "upcoming" },
    { leadId: "LD-10107", customerName: "Sahil Verma", rmName: "Mehul Singh", slot: "16:00", call: "yes", stage: "ongoing", estTravelMins: 25, checkoutTime: "15:20", reachCustomerMins: 28, checkinTime: "15:55", returnToHubMins: null, visitDurationMins: 35, idleButLateCheckout: false, etaBackToHub: "17:15", notes: "Thar 4x4 test drive currently active." },
    { leadId: "LD-3005", customerName: "Ritik Roshan", rmName: "Neeraj Verma", slot: "15:00", call: "late", stage: "ongoing", estTravelMins: 30, checkoutTime: "14:40", reachCustomerMins: 35, checkinTime: "15:15", returnToHubMins: null, visitDurationMins: 75, idleButLateCheckout: false, etaBackToHub: "16:45", notes: "Customer asking many questions; visit extended." },
    { leadId: "LD-10104", customerName: "Neeraj V.", rmName: "Chetan Arora", slot: "13:00", call: "yes", stage: "completed", estTotalMins: 70, actualMins: 65, token: "yes", feedbackRating: 5 },
    { leadId: "LD-10102", customerName: "Sandeep R.", rmName: "Chetan Arora", slot: "11:30", call: "yes", stage: "completed", estTotalMins: 60, actualMins: 55, token: "no", feedbackRating: 5, notes: "Customer loved the car but budget constraint." },
    { leadId: "LD-1001", customerName: "Nikhil", rmName: "Aman Sharma", slot: "12:00", call: "no", stage: "cancelled", didFollowUp: null, cancelReason: "", notes: "Phone switched off." },
];

function toMins(hhmm: string) {
    const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
    return h * 60 + m;
}

function fromMins(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
}

const DEMO_NOW = "16:30";

function getNeedsAttentionUpcoming(rows: HTDRow[]) {
    const now = toMins(DEMO_NOW);
    return rows
        .filter((r) => r.stage === "upcoming" && (r.travelMins ?? 0) > 0)
        .filter((r) => {
            const latestLeave = toMins(r.slot) - (r.travelMins ?? 0);
            const hasCheckoutSignal = r.rmStatus === "Driving" || r.rmStatus === "Checked-out";
            return now >= latestLeave && !hasCheckoutSignal;
        })
        .sort((a, b) => toMins(a.slot) - toMins(b.slot));
}

// LeadLink removed to avoid unused variable error if not used, 
// BUT it IS used in the Dialog Content. Wait.
// Ah, the linter says it is unused. Let me check the usage again.
// Line 502: <div className="font-bold text-slate-900">{s.type} · {s.leadId}</div> -- NOT USING LeadLink there.
// Line 384: <p className="text-[10px] font-mono text-slate-400">{r.leadId}</p> -- NOT USING LeadLink there.
// Line 475: <div className="space-y-4 text-sm"><p className="text-slate-500">Details for lead {selectedHTD.leadId}</p></div> -- NOT USING LeadLink there.
// So LeadLink is truly unused in this file. I will remove it.

// type Activity...

type Activity = "HV" | "HTD" | "IDLE";
type ScheduleItem = { at: string; type: Activity; state: "done" | "ongoing" | "upcoming"; leadId: string; durationMin?: number; token?: "yes" | "no"; feedbackRating?: number; };
type RM = {
    id: string; name: string; now: Activity; customer?: string; currentLeadId?: string; startedAt: string; frc: string; frcAvgMTD?: string; location: string;
    visitsToday: number; tokensToday: number; deliveriesToday: number; feedbackFilledToday: number;
    visitsMTD: number; tokensMTD: number; deliveriesMTD: number; feedbackFilledMTD: number; schedule: ScheduleItem[];
};

export function minutesBetween(aISO: string, bISO: string) {
    const a = new Date(aISO);
    const b = new Date(bISO);
    return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 60000));
}

export function fmtTime(ts: string) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtRuntime(mins: number) {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// minISOByTime removed

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
// MOBILE COMPONENT
// ============================================================================
export default function HubSummaryMobile() {
    const [tab, setTab] = useState<'overview' | 'htd' | 'rm'>('overview');
    // HTD State
    const [htdFilter, setHtdFilter] = useState<HTDStage>("upcoming");
    const [selectedHTD, setSelectedHTD] = useState<HTDRow | null>(null);
    const [htdOverrides] = useState<Record<string, Partial<HTDRow>>>({});
    const htdWithOverrides = useMemo(() => HTD_DEMO.map((r) => ({ ...r, ...(htdOverrides[r.leadId] ?? {}) })), [htdOverrides]);
    const htdFiltered = htdWithOverrides.filter((r) => r.stage === htdFilter);
    const htdAttention = getNeedsAttentionUpcoming(htdWithOverrides);

    // RM State
    const [openRM, setOpenRM] = useState<RM | null>(null);
    const rmComputed = useMemo(() => {
        const nowISO_RM = "2026-02-11T12:40:00"; // Frozen demo time
        return RM_DEMO.map((rm) => {
            const runtime = minutesBetween(rm.startedAt, nowISO_RM);
            return { ...rm, runtime };
        });
    }, []);

    // Alerts
    const alerts = useMemo(() => {
        const list: Array<{ id: string; type: "critical" | "warning"; msg: string; time: string }> = [];
        const nowMins = toMins(DEMO_NOW);
        htdAttention.forEach(a => {
            const leaveBy = toMins(a.slot) - (a.travelMins || 0);
            list.push({ id: `htd-${a.leadId}`, type: "critical", msg: `Dispatch: ${a.customerName}. Leave in ${leaveBy - nowMins}m.`, time: fromMins(nowMins) });
        });
        return list;
    }, [htdAttention]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900 overflow-x-hidden">
            {/* MOBILE HEADER */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-md">H</div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 leading-none">HUB OWNER</span>
                        <span className="text-[10px] text-slate-500 font-medium">{DEMO_NOW} · Control Tower</span>
                    </div>
                </div>
                <button className="relative p-2 rounded-full hover:bg-slate-100">
                    <User className="h-5 w-5 text-slate-600" />
                    {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="p-4 space-y-4">

                {/* 1. OVERVIEW TAB */}
                {tab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Welcome */}
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Hello, Deepansh</h2>
                                <p className="text-xs text-slate-500">Here's your hub snapshot for today.</p>
                            </div>
                        </div>

                        {/* Alerts */}
                        {alerts.length > 0 && (
                            <div className="space-y-2">
                                {alerts.map(a => (
                                    <div key={a.id} className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-3 shadow-sm">
                                        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-rose-800">{a.msg}</p>
                                            <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {a.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quick Targets */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="bg-slate-900 text-white border-0 shadow-lg relative overflow-hidden">
                                <CardContent className="p-4 relative z-10">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tokens</p>
                                    <div className="text-3xl font-bold mb-1">{rmComputed.reduce((a, r) => a + r.tokensToday, 0)}<span className="text-sm font-medium text-slate-500">/8</span></div>
                                    <div className="h-1 bg-slate-700 rounded-full w-full"><div className="h-full bg-emerald-400 w-[40%]" /></div>
                                </CardContent>
                                <Star className="absolute -right-2 -bottom-2 h-16 w-16 text-slate-800 opacity-20 rotate-12" />
                            </Card>
                            <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                                <CardContent className="p-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deliveries</p>
                                    <div className="text-3xl font-bold text-slate-900 mb-1">{rmComputed.reduce((a, r) => a + r.deliveriesToday, 0)}<span className="text-sm font-medium text-slate-400">/5</span></div>
                                    <div className="h-1 bg-slate-100 rounded-full w-full"><div className="h-full bg-blue-500 w-[20%]" /></div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Menu */}
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setTab('htd')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all">
                                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><MapPin className="h-5 w-5" /></div>
                                <span className="text-xs font-bold text-slate-700">HTD Logistics</span>
                            </button>
                            <button onClick={() => setTab('rm')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all">
                                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><User className="h-5 w-5" /></div>
                                <span className="text-xs font-bold text-slate-700">RM Team</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. LOGISTICS TAB (HTD) */}
                {tab === 'htd' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {(['upcoming', 'ongoing', 'completed', 'cancelled'] as HTDStage[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setHtdFilter(s)}
                                    className={cx("px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border", htdFilter === s ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200")}
                                >
                                    {s.toUpperCase()} <span className={cx("ml-1 px-1.5 py-0.5 rounded-full text-[9px]", htdFilter === s ? "bg-slate-700" : "bg-slate-100")}>{htdWithOverrides.filter(r => r.stage === s).length}</span>
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {htdFiltered.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">No {htdFilter} items found.</div>
                            ) : (
                                htdFiltered.map(r => (
                                    <div key={r.leadId} onClick={() => setSelectedHTD(r)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden">
                                        {r.stage === 'ongoing' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
                                        {r.stage === 'upcoming' && r.travelMins && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}

                                        <div className="flex justify-between items-start mb-2 pl-2">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">{r.customerName}</h3>
                                                <p className="text-[10px] font-mono text-slate-400">{r.leadId}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-slate-900 block">{r.slot}</span>
                                                <Badge className="text-[9px] px-1.5 h-4 bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200">{r.rmName.split(' ')[0]}</Badge>
                                            </div>
                                        </div>

                                        <div className="pl-2 flex items-center gap-4 text-xs text-slate-500 mt-2 border-t border-slate-50 pt-2">
                                            {r.stage === 'upcoming' && (
                                                <>
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Travel: {r.travelMins}m</span>
                                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Call: {r.call?.toUpperCase() || 'NA'}</span>
                                                </>
                                            )}
                                            {r.stage === 'ongoing' && (
                                                <>
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="h-3 w-3" /> Active</span>
                                                    <span>Started: {r.checkinTime}</span>
                                                </>
                                            )}
                                            {r.stage === 'completed' && (
                                                <>
                                                    {r.token === 'yes' ? <span className="text-emerald-600 font-bold flex items-center gap-1"><Star className="h-3 w-3" /> Token</span> : <span className="text-slate-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> No Token</span>}
                                                    {r.feedbackRating && <span className="flex items-center gap-1 text-amber-500 font-bold">{r.feedbackRating}★</span>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 3. TEAM TAB (RM) */}
                {tab === 'rm' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 uppercase">Active Workforce</span>
                            <div className="flex gap-2 text-[10px] font-bold">
                                <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">{rmComputed.filter(r => r.now === 'IDLE').length} Free</span>
                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">{rmComputed.filter(r => r.now !== 'IDLE').length} Busy</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {rmComputed.slice().sort((a, _b) => (a.now === 'IDLE' ? -1 : 1)).map(rm => (
                                <div key={rm.id} onClick={() => setOpenRM(rm)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4">
                                    <div className="relative">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-200">
                                            {rm.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className={cx("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white", rm.now === 'IDLE' ? 'bg-emerald-500' : 'bg-amber-500')} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-bold text-slate-900">{rm.name}</h3>
                                            <span className="text-[10px] font-mono text-slate-400">{fmtTime(rm.startedAt)}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {rm.now === 'IDLE' ? 'Ready for assignment' : `Busy: ${rm.now} · ${rm.customer}`}
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-slate-300 -rotate-90" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM NAV */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-3 pb-6 flex items-center justify-between z-50">
                <button onClick={() => setTab('overview')} className={cx("flex flex-col items-center gap-1 transition-colors", tab === 'overview' ? "text-indigo-600" : "text-slate-400")}>
                    <Activity className="h-6 w-6" />
                </button>
                <button onClick={() => setTab('htd')} className={cx("flex flex-col items-center gap-1 transition-colors", tab === 'htd' ? "text-indigo-600" : "text-slate-400")}>
                    <MapPin className="h-6 w-6" />
                </button>
                <button onClick={() => setTab('rm')} className={cx("flex flex-col items-center gap-1 transition-colors", tab === 'rm' ? "text-indigo-600" : "text-slate-400")}>
                    <User className="h-6 w-6" />
                </button>
            </div>

            {/* DIALOGS */}
            <Dialog open={!!selectedHTD} onOpenChange={(v) => !v && setSelectedHTD(null)}>
                <DialogContent className="max-w-[90vw] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedHTD?.customerName}</DialogTitle>
                    </DialogHeader>
                    {selectedHTD && <div className="space-y-4 text-sm"><p className="text-slate-500">Details for lead {selectedHTD.leadId}</p></div>}
                </DialogContent>
            </Dialog>

            <Dialog open={!!openRM} onOpenChange={(v) => !v && setOpenRM(null)}>
                <DialogContent className="max-w-[90vw] rounded-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{openRM?.name}</DialogTitle>
                    </DialogHeader>
                    {openRM && <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold">Visits</p>
                                <p className="text-lg font-bold text-slate-900">{openRM.visitsToday}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold">Tokens</p>
                                <p className="text-lg font-bold text-slate-900">{openRM.tokensToday}</p>
                            </div>
                        </div>
                        <h4 className="text-xs font-bold uppercase text-slate-500 mt-4 border-b border-slate-100 pb-2">Today's Schedule</h4>
                        <div className="space-y-3">
                            {openRM.schedule.map((s, i) => (
                                <div key={i} className="flex gap-3 text-xs">
                                    <div className="font-mono font-bold text-slate-400 w-10 shrink-0">{s.at}</div>
                                    <div>
                                        <div className="font-bold text-slate-900">{s.type} · {s.leadId}</div>
                                        <div className="text-slate-500 text-[10px] uppercase font-bold mt-0.5">{s.state}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>}
                </DialogContent>
            </Dialog>
        </div>
    );
}
