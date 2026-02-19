import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    MapPin, Phone, AlertTriangle, Home, Briefcase, Star, Activity,
    CalendarDays
} from "lucide-react";

// ============================================================================
// TYPES & UTILS
// ============================================================================

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
function pad2(n: number) { return String(n).padStart(2, "0"); }
function parseISODate(iso: string): Date {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    return new Date(y, (m || 1) - 1, d || 1);
}
function formatISODate(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function addDaysISO(iso: string, deltaDays: number): string {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + deltaDays);
    return formatISODate(d);
}

// Visits Section Types
type VisitType = "HV" | "HTD";
type Status = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

type Visit = {
    leadId: string;
    id: string;
    type: VisitType;
    dateISO: string;
    time: string;
    customer: string;
    car: string;
    rm?: string;
    status: Status;
    feedbackRating?: 1 | 2 | 3 | 4 | 5;
    feedbackText?: string;
};

// HTD Section Types
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

// RM Section Types
type RMActivity = "HV" | "HTD" | "IDLE";
type ScheduleItem = { at: string; type: RMActivity; state: "done" | "ongoing" | "upcoming"; leadId: string; durationMin?: number; token?: "yes" | "no"; feedbackRating?: number; };
type RM = {
    id: string; name: string; now: RMActivity; customer?: string; currentLeadId?: string; startedAt: string; frc: string; frcAvgMTD?: string; location: string;
    visitsToday: number; tokensToday: number; deliveriesToday: number; feedbackFilledToday: number;
    visitsMTD: number; tokensMTD: number; deliveriesMTD: number; feedbackFilledMTD: number; schedule: ScheduleItem[];
};

// ============================================================================
// DATA GENERATORS
// ============================================================================

function generateVisits(baseDateISO: string): Visit[] {
    const d0 = baseDateISO;
    const d1 = addDaysISO(baseDateISO, -1);
    const d2 = addDaysISO(baseDateISO, -2);

    return [
        { leadId: "LD-10101", id: "1", type: "HV", dateISO: d0, time: "10:15", customer: "Amit Kumar", car: "Swift ZXi", rm: "Aman Sharma", status: "COMPLETED", feedbackRating: 4, feedbackText: "Polite staff, good demo." },
        { leadId: "LD-10102", id: "2", type: "HTD", dateISO: d0, time: "11:30", customer: "Sandeep R.", car: "Baleno Alpha", rm: "Chetan Arora", status: "COMPLETED", feedbackRating: 5, feedbackText: "Excellent experience!" },
        { leadId: "LD-10103", id: "3", type: "HV", dateISO: d0, time: "12:15", customer: "Varun T.", car: "Verna SX", rm: "Badal Rajpoot", status: "COMPLETED", feedbackRating: 2, feedbackText: "Car wasn't clean." },
        { leadId: "LD-10104", id: "4", type: "HTD", dateISO: d0, time: "13:00", customer: "Neeraj V.", car: "Creta SX(O)", rm: "Chetan Arora", status: "COMPLETED", feedbackRating: 5 },
        { leadId: "LD-10105", id: "5", type: "HV", dateISO: d0, time: "14:30", customer: "Pooja M.", car: "Grand i10", rm: "Mehul Singh", status: "CANCELLED", feedbackRating: undefined },
        { leadId: "LD-10106", id: "6", type: "HV", dateISO: d0, time: "13:30", customer: "Ritika M.", car: "City ZX", rm: "Neeraj Verma", status: "COMPLETED", feedbackRating: 3, feedbackText: "Okayish." },
        { leadId: "LD-10107", id: "7", type: "HTD", dateISO: d0, time: "16:00", customer: "Sahil Verma", car: "Thar 4x4", rm: "Mehul Singh", status: "ONGOING" },
        { leadId: "LD-10108", id: "8", type: "HV", dateISO: d0, time: "16:15", customer: "Vivek S.", car: "Brezza ZXi", rm: "Badal Rajpoot", status: "ONGOING" },
        { leadId: "LD-10109", id: "9", type: "HTD", dateISO: d0, time: "17:00", customer: "Priya G.", car: "Nexon EV", status: "SCHEDULED", rm: "Aman Sharma" },
        { leadId: "LD-10110", id: "10", type: "HV", dateISO: d0, time: "18:30", customer: "Arjun B.", car: "Scorpio-N", status: "SCHEDULED" },
        { leadId: "LD-10023", id: "11", type: "HV", dateISO: d1, time: "12:30", customer: "Nikhil P.", car: "i20 Asta", rm: "Aman Sharma", status: "COMPLETED", feedbackRating: 2, feedbackText: "Delay in arrival" },
        { leadId: "LD-10034", id: "12", type: "HTD", dateISO: d1, time: "15:40", customer: "Diya S.", car: "Venue SX", rm: "Neeraj Verma", status: "COMPLETED", feedbackRating: 5 },
        { leadId: "LD-10042", id: "13", type: "HV", dateISO: d2, time: "10:45", customer: "Rhea S.", car: "Amaze VX", rm: "Chetan Arora", status: "COMPLETED", feedbackRating: 4, feedbackText: "Smooth process" },
    ];
}

const HTD_DEMO: HTDRow[] = [
    { leadId: "LD-10109", customerName: "Priya G.", rmName: "Aman Sharma", slot: "17:00", stage: "upcoming", notes: "EV Demo", travelMins: 35, call: "na", rmStatus: "At Hub" },
    { leadId: "LD-2002", customerName: "Karan Johar", rmName: "Chetan Arora", slot: "19:00", stage: "upcoming", travelMins: 45, call: "yes", rmStatus: "Checked-out" },
    { leadId: "LD-2003", customerName: "Ananya Panday", rmName: "Badal Rajpoot", slot: "20:30", stage: "upcoming", travelMins: 25, call: "na", rmStatus: "Idle" },
    { leadId: "LD-10107", customerName: "Sahil Verma", rmName: "Mehul Singh", slot: "16:00", stage: "ongoing", estTravelMins: 25, checkoutTime: "15:20", reachCustomerMins: 28, checkinTime: "15:55", visitDurationMins: 35, rmStatus: "Visit Running" },
    { leadId: "LD-3005", customerName: "Ritik Roshan", rmName: "Neeraj Verma", slot: "15:00", stage: "ongoing", estTravelMins: 30, checkoutTime: "14:40", reachCustomerMins: 35, checkinTime: "15:15", visitDurationMins: 75, call: "late", rmStatus: "Visit Running" },
    { leadId: "LD-10104", customerName: "Neeraj V.", rmName: "Chetan Arora", slot: "13:00", stage: "completed", estTotalMins: 70, actualMins: 65, token: "yes", feedbackRating: 5 },
    { leadId: "LD-10102", customerName: "Sandeep R.", rmName: "Chetan Arora", slot: "11:30", stage: "completed", estTotalMins: 60, actualMins: 55, token: "no", feedbackRating: 5 },
    { leadId: "LD-1001", customerName: "Nikhil", rmName: "Aman Sharma", slot: "12:00", stage: "cancelled", cancelReason: "Phone switched off." },
];

const RM_DEMO: RM[] = [
    {
        id: "1", name: "Mehul Singh", now: "HTD", customer: "Sahil Verma", currentLeadId: "LD-10107",
        startedAt: "2026-02-11T15:20:00", frc: "2026-02-11T09:45:00", location: "At Customer",
        visitsToday: 2, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 0,
        visitsMTD: 26, tokensMTD: 8, deliveriesMTD: 3, feedbackFilledMTD: 14,
        schedule: [{ at: "14:30", type: "HV", state: "done", leadId: "LD-10105", durationMin: 45, token: "no", feedbackRating: 4 }, { at: "16:00", type: "HTD", state: "ongoing", leadId: "LD-10107" }]
    },
    {
        id: "2", name: "Chetan Arora", now: "IDLE",
        startedAt: "2026-02-11T14:30:00", frc: "2026-02-11T09:05:00", location: "Hub",
        visitsToday: 2, tokensToday: 1, deliveriesToday: 0, feedbackFilledToday: 2,
        visitsMTD: 43, tokensMTD: 15, deliveriesMTD: 6, feedbackFilledMTD: 28,
        schedule: [{ at: "11:30", type: "HTD", state: "done", leadId: "LD-10102", durationMin: 55, token: "yes", feedbackRating: 5 }, { at: "13:00", type: "HTD", state: "done", leadId: "LD-10104", durationMin: 65, token: "no", feedbackRating: 5 }, { at: "19:00", type: "HTD", state: "upcoming", leadId: "LD-2002" }]
    },
    {
        id: "3", name: "Badal Rajpoot", now: "HV", customer: "Vivek S.", currentLeadId: "LD-10108",
        startedAt: "2026-02-11T15:55:00", frc: "2026-02-11T09:10:00", location: "Driving",
        visitsToday: 2, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 1,
        visitsMTD: 55, tokensMTD: 18, deliveriesMTD: 7, feedbackFilledMTD: 30,
        schedule: [{ at: "12:15", type: "HV", state: "done", leadId: "LD-10103", durationMin: 45, token: "no", feedbackRating: 2 }, { at: "16:15", type: "HV", state: "ongoing", leadId: "LD-10108" }, { at: "20:30", type: "HTD", state: "upcoming", leadId: "LD-2003" }]
    },
    {
        id: "4", name: "Neeraj Verma", now: "HTD", customer: "Ritik Roshan", currentLeadId: "LD-3005",
        startedAt: "2026-02-11T14:40:00", frc: "2026-02-11T08:55:00", location: "At Customer",
        visitsToday: 2, tokensToday: 0, deliveriesToday: 1, feedbackFilledToday: 1,
        visitsMTD: 72, tokensMTD: 30, deliveriesMTD: 15, feedbackFilledMTD: 40,
        schedule: [{ at: "13:30", type: "HV", state: "done", leadId: "LD-10106", durationMin: 30, token: "no", feedbackRating: 3 }, { at: "15:00", type: "HTD", state: "ongoing", leadId: "LD-3005" }]
    },
    {
        id: "5", name: "Aman Sharma", now: "IDLE",
        startedAt: "2026-02-11T12:05:00", frc: "2026-02-11T09:20:00", location: "Hub",
        visitsToday: 1, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 1,
        visitsMTD: 86, tokensMTD: 35, deliveriesMTD: 18, feedbackFilledMTD: 55,
        schedule: [{ at: "10:15", type: "HV", state: "done", leadId: "LD-10101", durationMin: 45, token: "no", feedbackRating: 4 }, { at: "17:00", type: "HTD", state: "upcoming", leadId: "LD-10109" }]
    }
];

function formatTime(ts: string) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function toMins(hhmm: string) {
    const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
    return h * 60 + m;
}

const DEMO_NOW = "16:30";

// ============================================================================
// COMPONENT
// ============================================================================

export default function HubSummaryMobile() {
    const [activeTab, setActiveTab] = useState<'hub' | 'dispatch' | 'team'>('hub');
    const [dateISO] = useState("2026-02-11"); // Fixed demo date

    // Derived Data
    const visitsAll = useMemo(() => generateVisits(dateISO), [dateISO]);
    const visitsToday = visitsAll.filter(v => v.dateISO === dateISO);

    // Sort logic: Ongoing -> Scheduled (by time) -> Completed -> Cancelled
    const visitsSorted = [...visitsToday].sort((a, b) => {
        const score = (s: Status) => {
            if (s === 'ONGOING') return 0;
            if (s === 'SCHEDULED') return 1;
            if (s === 'COMPLETED') return 2;
            return 3;
        }
        if (score(a.status) !== score(b.status)) return score(a.status) - score(b.status);
        if (a.time !== b.time) return a.time.localeCompare(b.time);
        return 0;
    });

    // Alert Logic
    const nowMins = toMins(DEMO_NOW);
    const alerts = useMemo(() => {
        const list: Array<{ id: string; msg: string; time: string }> = [];
        HTD_DEMO.filter(r => r.stage === 'upcoming' && r.travelMins).forEach(r => {
            const leaveBy = toMins(r.slot) - (r.travelMins || 0);
            if (nowMins >= leaveBy && r.rmStatus !== 'Driving' && r.rmStatus !== 'Checked-out') {
                list.push({
                    id: r.leadId,
                    msg: `Late Dispatch: ${r.customerName}`,
                    time: r.slot
                });
            }
        });
        return list;
    }, [nowMins]);

    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [selectedRM, setSelectedRM] = useState<RM | null>(null);

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

            {/* ALERT BANNER (If any) */}
            {activeTab === 'hub' && alerts.length > 0 && (
                <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0 shadow-md z-30">
                    <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 fill-white text-rose-600" />
                        {alerts.length} Critical Actions
                    </span>
                    <span className="opacity-90">{alerts[0].msg}</span>
                </div>
            )}

            {/* HEADER */}
            {activeTab === 'hub' && (
                <div className="bg-white border-b border-slate-200 px-5 py-4 shrink-0 shadow-sm z-20">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Hub Summary</h1>
                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                            <button className="p-1 rounded bg-white shadow-sm text-slate-900"><CalendarDays className="h-4 w-4" /></button>
                            <span className="text-xs font-bold px-2">Today</span>
                        </div>
                    </div>
                    {/* Score Cards (Proportional Utility) */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-900 text-white rounded-xl p-3 shadow-sm flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase opacity-70">Total Visits</span>
                            <span className="text-2xl font-bold">{visitsToday.length}</span>
                        </div>
                        <div className="bg-white border border-slate-200 text-slate-900 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Scheduled</span>
                            <span className="text-2xl font-bold text-blue-600">{visitsToday.filter(v => v.status === 'SCHEDULED' || v.status === 'ONGOING').length}</span>
                        </div>
                        <div className="bg-white border border-slate-200 text-slate-900 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Completed</span>
                            <span className="text-2xl font-bold text-emerald-600">{visitsToday.filter(v => v.status === 'COMPLETED').length}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT */}
            <main className="flex-1 overflow-y-auto scroll-smooth pb-24">

                {/* 1. HUB SUMMARY (HERO: THE VISITS LIST) */}
                {activeTab === 'hub' && (
                    <div className="p-0">
                        <div className="divide-y divide-slate-100 bg-white">
                            {visitsSorted.map(v => (
                                <div key={v.id} onClick={() => setSelectedVisit(v)} className="p-4 active:bg-slate-50 transition-colors flex items-start gap-3">
                                    {/* Time Column */}
                                    <div className="w-[50px] shrink-0 text-right pt-0.5">
                                        <div className="text-sm font-bold text-slate-900">{v.time}</div>
                                        <div className="text-[10px] font-bold text-slate-400">{v.type}</div>
                                    </div>

                                    {/* Data Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-bold text-slate-900 truncate pr-2">{v.customer}</h3>
                                            <Badge className={cx("text-[9px] px-1.5 h-5 border-none",
                                                v.status === 'ONGOING' ? "bg-blue-100 text-blue-700 animate-pulse" :
                                                    v.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" :
                                                        v.status === 'CANCELLED' ? "bg-slate-100 text-slate-500 line-through decoration-slate-400" :
                                                            "bg-amber-100 text-amber-700"
                                            )}>
                                                {v.status === 'ONGOING' ? 'ACTIVE' : v.status}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                            <span className="font-medium">{v.car}</span>
                                            <span>·</span>
                                            <span>{v.rm ? v.rm.split(' ')[0] : 'Unassigned'}</span>
                                        </div>

                                        {/* Actionable / Feedback Footer */}
                                        {v.status === 'COMPLETED' && v.feedbackRating && (
                                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 w-fit px-1.5 py-0.5 rounded">
                                                <span>Rating: {v.feedbackRating}</span>
                                                <Star className="h-2.5 w-2.5 fill-amber-600" />
                                            </div>
                                        )}
                                        {v.status === 'ONGOING' && (
                                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                                <Activity className="h-3 w-3" /> Visit in progress
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. DISPATCH (HTD LOGISTICS) */}
                {activeTab === 'dispatch' && (
                    <div className="bg-white min-h-full">
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 z-10">
                            <h2 className="text-lg font-bold text-slate-900">Control Tower</h2>
                            <p className="text-xs text-slate-500">Manage drivers & timeline</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {HTD_DEMO.filter(r => r.stage === 'upcoming' || r.stage === 'ongoing').map(r => (
                                <div key={r.leadId} className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 rounded-lg h-12 w-12 flex flex-col items-center justify-center text-slate-700 font-bold border border-slate-200">
                                                <span className="text-sm leading-none">{r.slot.split(':')[0]}</span>
                                                <span className="text-[10px] leading-none text-slate-400">{r.slot.split(':')[1]}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 leading-tight">{r.customerName}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{r.rmName.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {r.stage === 'ongoing' ? (
                                            <Badge className="bg-blue-100 text-blue-700 border-none animate-pulse">ACTIVE</Badge>
                                        ) : (
                                            <Badge className="bg-white border text-slate-500 border-slate-300">UPCOMING</Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button className="flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold active:scale-95 transition-transform"><Phone className="h-3 w-3" /> Call</button>
                                        <button className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold active:scale-95 transition-transform"><MapPin className="h-3 w-3" /> Nav</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="p-4 space-y-3">
                        {RM_DEMO.map(rm => (
                            <div key={rm.id} onClick={() => setSelectedRM(rm)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 active:scale-[0.98] transition-transform">
                                <div className="relative h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold border border-slate-200">
                                    {rm.name.split(' ').map(n => n[0]).join('')}
                                    <div className={cx("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white", rm.now === 'IDLE' ? 'bg-emerald-500' : 'bg-amber-500')} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-sm font-bold text-slate-900">{rm.name}</h3>
                                        <span className="text-[10px] font-mono text-slate-400">{formatTime(rm.startedAt)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{rm.now === 'IDLE' ? 'Available at Hub' : `${rm.now} · ${rm.customer}`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* BOTTOM NAV */}
            <nav className="shrink-0 bg-white border-t border-slate-200 pb-safe pt-2 px-6 flex justify-between items-center z-20 h-[80px] pb-5">
                <button onClick={() => setActiveTab('hub')} className={cx("flex flex-col items-center gap-1 w-16 transition-colors", activeTab === 'hub' ? "text-slate-900" : "text-slate-400")}>
                    <Home className={cx("h-6 w-6", activeTab === 'hub' && "fill-current")} />
                    <span className="text-[10px] font-bold">Summary</span>
                </button>
                <button onClick={() => setActiveTab('dispatch')} className={cx("flex flex-col items-center gap-1 w-16 transition-colors", activeTab === 'dispatch' ? "text-slate-900" : "text-slate-400")}>
                    <Briefcase className={cx("h-6 w-6", activeTab === 'dispatch' && "fill-current")} />
                    <span className="text-[10px] font-bold">Dispatch</span>
                </button>
                <button onClick={() => setActiveTab('team')} className={cx("flex flex-col items-center gap-1 w-16 transition-colors", activeTab === 'team' ? "text-slate-900" : "text-slate-400")}>
                    <div className="relative">
                        <AlertTriangle className={cx("h-6 w-6", activeTab === 'team' && "fill-current")} />
                        {/* Using AlertTriangle/User for Team... let's stick to User */}
                    </div>
                    <span className="text-[10px] font-bold">Team</span>
                </button>
            </nav>

            {/* VISIT DETAIL DIALOG */}
            <Dialog open={!!selectedVisit} onOpenChange={(v) => !v && setSelectedVisit(null)}>
                <DialogContent className="max-w-[90vw] rounded-2xl">
                    <DialogTitle>{selectedVisit?.customer}</DialogTitle>
                    {selectedVisit && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Type</span>
                                    <span className="font-bold text-slate-900">{selectedVisit.type}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Car</span>
                                    <span className="font-bold text-slate-900">{selectedVisit.car}</span>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Feedback</span>
                                {selectedVisit.feedbackText ? (
                                    <p className="text-sm text-slate-700 italic">"{selectedVisit.feedbackText}"</p>
                                ) : <span className="text-xs text-slate-400">No text feedback recorded.</span>}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* RM DETAIL DIALOG */}
            <Dialog open={!!selectedRM} onOpenChange={(v) => !v && setSelectedRM(null)}>
                <DialogContent className="max-w-[90vw] rounded-2xl">
                    <DialogTitle>{selectedRM?.name}</DialogTitle>
                    {selectedRM && (
                        <div className="space-y-4">
                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase">
                                        <tr><th className="p-3">Metric</th><th className="p-3">Today</th><th className="p-3 text-slate-400">MTD</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <tr><td className="p-3">Visits</td><td className="p-3 font-bold">{selectedRM.visitsToday}</td><td className="p-3 text-slate-400">{selectedRM.visitsMTD}</td></tr>
                                        <tr><td className="p-3">Tokens</td><td className="p-3 font-bold">{selectedRM.tokensToday}</td><td className="p-3 text-slate-400">{selectedRM.tokensMTD}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
