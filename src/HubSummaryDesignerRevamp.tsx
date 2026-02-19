import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Star, ChevronDown, ChevronUp, Clock } from "lucide-react";

/**
 * HUB SUMMARY — UX Designer Revamp ✨
 * Unified Dashboard View with Control Tower & Alerts
 */

// ============================================================================
// SHARED UTILS
// ============================================================================
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
function pad2(n: number) { return String(n).padStart(2, "0"); }
// statusLabel removed
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

// ============================================================================
// SECTION 1: VISITS (ORIGINAL)
// ============================================================================
type VisitType = "HV" | "HTD";
type Scope = VisitType | "ALL";
type Status = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

type Visit = {
    leadId: string;
    id: string;
    type: VisitType;
    dateISO: string; // YYYY-MM-DD
    time: string; // HH:mm
    customer: string;
    car: string;
    rm?: string;
    status: Status;
    feedbackRating?: 1 | 2 | 3 | 4 | 5;
    feedbackText?: string;
};

type FocusStatus = "ALL" | Status;
type FocusRating = "ALL" | "NF" | 1 | 2 | 3 | 4 | 5;
type RangeKey = "1D" | "2D" | "7D" | "CUSTOM";
type FeedbackView = "HUB" | "RM";

function getRangeStartISO(endISO: string, range: RangeKey, customStartISO: string): string {
    if (range === "CUSTOM") return customStartISO || endISO;
    if (range === "1D") return endISO;
    if (range === "2D") return addDaysISO(endISO, -1);
    return addDaysISO(endISO, -6);
}

function inISOInclusiveRange(dISO: string, startISO: string, endISO: string): boolean {
    return dISO >= startISO && dISO <= endISO;
}

function ensureLeadId(leadId: string | undefined, index: number): string {
    const raw = String(leadId ?? "").trim();
    return raw ? raw : `LD-${10000 + index}`;
}

function generateVisits(baseDateISO: string): Visit[] {
    const d0 = baseDateISO;
    const d1 = addDaysISO(baseDateISO, -1);
    const d2 = addDaysISO(baseDateISO, -2);

    return [
        // TODAY (d0) - Context: NOW is 16:30
        { leadId: "LD-10101", id: "1", type: "HV", dateISO: d0, time: "10:15", customer: "Amit Kumar", car: "Swift ZXi", rm: "Aman Sharma", status: "COMPLETED", feedbackRating: 4, feedbackText: "Polite staff, good demo." },
        { leadId: "LD-10102", id: "2", type: "HTD", dateISO: d0, time: "11:30", customer: "Sandeep R.", car: "Baleno Alpha", rm: "Chetan Arora", status: "COMPLETED", feedbackRating: 5, feedbackText: "Excellent experience!" },
        { leadId: "LD-10103", id: "3", type: "HV", dateISO: d0, time: "12:15", customer: "Varun T.", car: "Verna SX", rm: "Badal Rajpoot", status: "COMPLETED", feedbackRating: 2, feedbackText: "Car wasn't clean." },
        { leadId: "LD-10104", id: "4", type: "HTD", dateISO: d0, time: "13:00", customer: "Neeraj V.", car: "Creta SX(O)", rm: "Chetan Arora", status: "COMPLETED", feedbackRating: 5 }, // Token!
        { leadId: "LD-10105", id: "5", type: "HV", dateISO: d0, time: "14:30", customer: "Pooja M.", car: "Grand i10", rm: "Mehul Singh", status: "CANCELLED", feedbackRating: undefined },
        { leadId: "LD-10106", id: "6", type: "HV", dateISO: d0, time: "13:30", customer: "Ritika M.", car: "City ZX", rm: "Neeraj Verma", status: "COMPLETED", feedbackRating: 3, feedbackText: "Okayish." },
        { leadId: "LD-10107", id: "7", type: "HTD", dateISO: d0, time: "16:00", customer: "Sahil Verma", car: "Thar 4x4", rm: "Mehul Singh", status: "ONGOING" }, // Just started
        { leadId: "LD-10108", id: "8", type: "HV", dateISO: d0, time: "16:15", customer: "Vivek S.", car: "Brezza ZXi", rm: "Badal Rajpoot", status: "ONGOING" },
        { leadId: "LD-10109", id: "9", type: "HTD", dateISO: d0, time: "17:00", customer: "Priya G.", car: "Nexon EV", status: "SCHEDULED", rm: "Aman Sharma" },
        { leadId: "LD-10110", id: "10", type: "HV", dateISO: d0, time: "18:30", customer: "Arjun B.", car: "Scorpio-N", status: "SCHEDULED" },

        // YESTERDAY (d1)
        { leadId: "LD-10023", id: "11", type: "HV", dateISO: d1, time: "12:30", customer: "Nikhil P.", car: "i20 Asta", rm: "Aman Sharma", status: "COMPLETED", feedbackRating: 2, feedbackText: "Delay in arrival" },
        { leadId: "LD-10034", id: "12", type: "HTD", dateISO: d1, time: "15:40", customer: "Diya S.", car: "Venue SX", rm: "Neeraj Verma", status: "COMPLETED", feedbackRating: 5 },

        // 2 DAYS AGO (d2)
        { leadId: "LD-10042", id: "13", type: "HV", dateISO: d2, time: "10:45", customer: "Rhea S.", car: "Amaze VX", rm: "Chetan Arora", status: "COMPLETED", feedbackRating: 4, feedbackText: "Smooth process" },
    ];
}


// ============================================================================
// SECTION 2: HTD CONTROL TOWER
// ============================================================================
type HTDStage = "upcoming" | "ongoing" | "cancelled" | "completed";
type CallStatus = "yes" | "no" | "late" | "na";
type RMStatus = "Idle" | "At Hub" | "Driving" | "Checked-out" | "At Customer" | "Returning" | "Visit Running";
type TokenStatus = "yes" | "no";

type HTDRow = {
    leadId: string;
    customerName: string;
    rmName: string;
    slot: string; // HH:MM
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
    // 1. UPCOMING
    { leadId: "LD-10109", customerName: "Priya G.", rmName: "Aman Sharma", rmStatus: "At Hub", slot: "17:00", travelMins: 35, call: "na", stage: "upcoming", notes: "Customer requested EV specific demo." },
    { leadId: "LD-2002", customerName: "Karan Johar", rmName: "Chetan Arora", rmStatus: "Checked-out", slot: "19:00", travelMins: 45, call: "yes", stage: "upcoming" },
    { leadId: "LD-2003", customerName: "Ananya Panday", rmName: "Badal Rajpoot", rmStatus: "Idle", slot: "20:30", travelMins: 25, call: "na", stage: "upcoming" },

    // 2. ONGOING
    { leadId: "LD-10107", customerName: "Sahil Verma", rmName: "Mehul Singh", slot: "16:00", call: "yes", stage: "ongoing", estTravelMins: 25, checkoutTime: "15:20", reachCustomerMins: 28, checkinTime: "15:55", returnToHubMins: null, visitDurationMins: 35, idleButLateCheckout: false, etaBackToHub: "17:15", notes: "Thar 4x4 test drive currently active." },

    // 3. ONGOING BUT LATE (Visual Alert)
    { leadId: "LD-3005", customerName: "Ritik Roshan", rmName: "Neeraj Verma", slot: "15:00", call: "late", stage: "ongoing", estTravelMins: 30, checkoutTime: "14:40", reachCustomerMins: 35, checkinTime: "15:15", returnToHubMins: null, visitDurationMins: 75, idleButLateCheckout: false, etaBackToHub: "16:45", notes: "Customer asking many questions; visit extended." },

    // 4. COMPLETED
    { leadId: "LD-10104", customerName: "Neeraj V.", rmName: "Chetan Arora", slot: "13:00", call: "yes", stage: "completed", estTotalMins: 70, actualMins: 65, token: "yes", feedbackRating: 5 },
    { leadId: "LD-10102", customerName: "Sandeep R.", rmName: "Chetan Arora", slot: "11:30", call: "yes", stage: "completed", estTotalMins: 60, actualMins: 55, token: "no", feedbackRating: 5, notes: "Customer loved the car but budget constraint." },

    // 5. CANCELLED
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

function Pill({ tone, children }: React.PropsWithChildren<{ tone: "ok" | "warn" | "muted" | "bad" }>) {
    const map = {
        ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warn: "bg-amber-50 text-amber-800 border-amber-200",
        muted: "bg-slate-50 text-slate-600 border-slate-200",
        bad: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
}


function LeadLink({ id }: { id: string }) {
    if (!id) return null;
    return (
        <button
            onClick={(e) => { e.stopPropagation(); console.log(`Redirect to Lead: ${id}`); }}
            className="font-mono text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
            {id}
        </button>
    );
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-left">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-100 transition-colors">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">{title}</h4>
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {isOpen && <div className="p-4 border-t border-slate-100">{children}</div>}
        </div>
    );
}

// ============================================================================
// SECTION 3: RM LIVE PRODUCTIVITY
// ============================================================================
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

function toMinutesFromHHMM(hhmm: string) {
    const [hhStr, mmStr] = hhmm.split(":");
    return Number(hhStr) * 60 + Number(mmStr);
}

function toHHMMFromMinutes(totalMinutes: number) {
    const m = ((totalMinutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function avgHHMM(values: string[]) {
    if (!values.length) return "00:00";
    const sum = values.reduce((acc, v) => acc + toMinutesFromHHMM(v), 0);
    return toHHMMFromMinutes(Math.round(sum / values.length));
}

function minISOByTime(isos: string[]) {
    if (!isos.length) return "";
    return [...isos].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

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
// COMPONENT
// ============================================================================
export default function HubSummaryDesignerRevamp() {
    // ----- STATE: MAIN DASHBOARD -----
    const todayISO = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }, []);

    const [dateISO, setDateISO] = useState(todayISO);
    const [scope, setScope] = useState<Scope>("ALL");
    const [focusStatus, setFocusStatus] = useState<FocusStatus>("ALL");
    // const [visitsOpen, setVisitsOpen] = useState(true); // Unused
    const [rangeKey, setRangeKey] = useState<RangeKey>("1D");
    const [customStartISO, setCustomStartISO] = useState(todayISO);
    const [feedbackView, setFeedbackView] = useState<FeedbackView>("HUB");
    const [focusRating, setFocusRating] = useState<FocusRating>("ALL");

    const visitsRaw = useMemo(() => generateVisits(dateISO), [dateISO]);
    const visits = useMemo(() => visitsRaw.map((v, i) => ({ ...v, leadId: ensureLeadId(v.leadId, i) })), [visitsRaw]);
    const scoped = useMemo(() => scope === "ALL" ? visits : visits.filter((v) => v.type === scope), [scope, visits]);
    const counts = useMemo(() => ({
        total: scoped.length,
        completed: scoped.filter((v) => v.status === "COMPLETED").length,
        ongoing: scoped.filter((v) => v.status === "ONGOING").length,
        scheduled: scoped.filter((v) => v.status === "SCHEDULED").length,
        cancelled: scoped.filter((v) => v.status === "CANCELLED").length,
    }), [scoped]);

    const visibleVisits = useMemo(() => {
        const list = focusStatus === "ALL" ? scoped : scoped.filter((v) => v.status === focusStatus);
        return list.slice().sort((a, b) => (a.time + a.id).localeCompare(b.time + b.id));
    }, [scoped, focusStatus]);

    const rangeStartISO = useMemo(() => getRangeStartISO(dateISO, rangeKey, customStartISO), [dateISO, rangeKey, customStartISO]);
    const completedInRange = useMemo(() => scoped.filter((v) => v.status === "COMPLETED" && inISOInclusiveRange(v.dateISO, rangeStartISO, dateISO)), [scoped, rangeStartISO, dateISO]);
    const ratingCounts = useMemo(() => {
        const out: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0, NF: 0 };
        completedInRange.forEach((v) => {
            if (typeof v.feedbackRating === "number") out[String(v.feedbackRating)]++;
            else out.NF++;
        });
        return out;
    }, [completedInRange]);
    const visibleFeedback = useMemo(() => {
        if (focusRating === "ALL") return completedInRange;
        if (focusRating === "NF") return completedInRange.filter((v) => !v.feedbackRating);
        return completedInRange.filter((v) => v.feedbackRating === focusRating);
    }, [completedInRange, focusRating]);
    const rmAggregated = useMemo(() => {
        const map: Record<string, { total: number; below3: number; aboveEq3: number; nf: number }> = {};
        completedInRange.forEach((v) => {
            const rmName = v.rm || "Unassigned";
            if (!map[rmName]) map[rmName] = { total: 0, below3: 0, aboveEq3: 0, nf: 0 };
            map[rmName].total += 1;
            if (typeof v.feedbackRating === "number") {
                if (v.feedbackRating < 3) map[rmName].below3 += 1;
                else map[rmName].aboveEq3 += 1;
            } else {
                map[rmName].nf += 1;
            }
        });
        return Object.entries(map).map(([rm, d]) => ({ rm, ...d })).sort((a, b) => b.total - a.total);
    }, [completedInRange]);


    // ----- STATE: HTD TOWER -----
    const [htdFilter, setHtdFilter] = useState<HTDStage>("upcoming");
    const [selectedHTD, setSelectedHTD] = useState<HTDRow | null>(null);
    const [htdOverrides, setHtdOverrides] = useState<Record<string, Partial<HTDRow>>>({});

    const htdWithOverrides = useMemo(() => HTD_DEMO.map((r) => ({ ...r, ...(htdOverrides[r.leadId] ?? {}) })), [htdOverrides]);
    const htdFiltered = htdWithOverrides.filter((r) => r.stage === htdFilter);
    const htdAttention = getNeedsAttentionUpcoming(htdWithOverrides);
    // htdCounts removed (unused)


    // ----- STATE: RM PRODUCTIVITY -----
    const [openRM, setOpenRM] = useState<RM | null>(null);
    const rmComputed = useMemo(() => {
        const nowISO_RM = "2026-02-11T12:40:00"; // Frozen demo time
        return RM_DEMO.map((rm) => {
            const runtime = minutesBetween(rm.startedAt, nowISO_RM);
            const minutesSinceFRC = minutesBetween(rm.frc, nowISO_RM);
            const busyMinutesDone = rm.schedule.filter((s) => s.state === "done").reduce((acc, s) => acc + (s.durationMin || 0), 0);
            const busyMinutesOngoing = rm.now !== "IDLE" ? runtime : 0;
            const utilRate = minutesSinceFRC ? Math.round(((busyMinutesDone + busyMinutesOngoing) / minutesSinceFRC) * 100) : 0;
            return { ...rm, runtime, utilRate, hvCount: rm.schedule.filter(s => s.type === "HV" && s.state === "done").length, htdCount: rm.schedule.filter(s => s.type === "HTD" && s.state === "done").length, nextHTD: rm.schedule.find(s => s.type === "HTD" && s.state === "upcoming") };
        }).sort((a, b) => a.utilRate - b.utilRate);
    }, []);

    const openHub = () => {
        const nowISO_RM = "2026-02-11T12:40:00";
        setOpenRM({
            id: "HUB", name: "Hub View — All RMs", now: "IDLE", startedAt: nowISO_RM, frc: minISOByTime(rmComputed.map(r => r.frc)) || nowISO_RM, frcAvgMTD: avgHHMM(rmComputed.map(r => r.frcAvgMTD || fmtTime(r.frc))), location: "—",
            visitsToday: rmComputed.reduce((a, r) => a + r.visitsToday, 0), tokensToday: rmComputed.reduce((a, r) => a + r.tokensToday, 0), deliveriesToday: rmComputed.reduce((a, r) => a + r.deliveriesToday, 0), feedbackFilledToday: rmComputed.reduce((a, r) => a + r.feedbackFilledToday, 0),
            visitsMTD: rmComputed.reduce((a, r) => a + r.visitsMTD, 0), tokensMTD: rmComputed.reduce((a, r) => a + r.tokensMTD, 0), deliveriesMTD: rmComputed.reduce((a, r) => a + r.deliveriesMTD, 0), feedbackFilledMTD: rmComputed.reduce((a, r) => a + r.feedbackFilledMTD, 0), schedule: []
        });
    };

    // ----- ALERTS GENERATION -----
    const alerts = useMemo(() => {
        const list: Array<{ id: string; type: "critical" | "warning" | "info"; msg: string; time: string }> = [];
        const nowMins = toMins(DEMO_NOW); // 16:30

        // 1. HTD Needs Attention
        htdAttention.forEach(a => {
            const leaveBy = toMins(a.slot) - (a.travelMins || 0);
            const minsLeft = leaveBy - nowMins;
            list.push({
                id: `htd-${a.leadId}`,
                type: "critical",
                msg: `HTD Dispatch: ${a.customerName} (${a.slot}). Leave in ${minsLeft}m.`,
                time: fromMins(nowMins)
            });
        });

        // 2. Long Running Visits (HV > 60m)
        // Using simple mock check for 'ONGOING' visits in main visits list
        visits.filter(v => v.status === "ONGOING").forEach(v => {
            // Assume active if status ongoing.
            // Mock check: if visit started > 60 mins ago.
            const start = toMins(v.time);
            const duration = nowMins - start;
            if (duration > 60) {
                list.push({ id: `hv-${v.id}`, type: "warning", msg: `Long Visit: ${v.customer} running for ${duration}m.`, time: v.time });
            }
        });

        // 3. Negative Feedback
        completedInRange.filter(v => v.feedbackRating && v.feedbackRating < 3).forEach(v => {
            list.push({ id: `fb-${v.id}`, type: "critical", msg: `Low Rating (${v.feedbackRating}★): ${v.customer} (${v.rm}).`, time: v.time });
        });

        return list;
    }, [htdAttention, visits, completedInRange]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">

            {/* ------------------- HEADER ------------------- */}
            <div className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">H</div>
                            <h1 className="text-lg font-bold tracking-tight">Hub Owner Super View</h1>
                        </div>
                        <p className="text-xs text-slate-500 font-medium ml-10">Live Control Tower · {DEMO_NOW}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <CalendarDays className="h-4 w-4 ml-2 text-slate-400" />
                        <Input type="date" value={dateISO} onChange={(e) => { setDateISO(e.target.value); setCustomStartISO(e.target.value); }} className="w-[140px] border-none bg-transparent h-8 text-xs font-semibold focus-visible:ring-0" />
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1600px] px-6 py-6">

                {/* ------------------- TOP KPIs (REMOVED - DUPLICATE) ------------------- */}
                {/* <div className="mb-6 grid grid-cols-5 gap-4">...</div> */}

                {/* ------------------- MAIN UTILITY GRID ------------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* <<< LEFT COLUMN: OPERATIONS (3 SPAN) >>> */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* 1. LIVE OPERATIONS CENTER (Hub Summary) */}
                        <section>
                            <CollapsibleSection title="1. Hub Summary" defaultOpen={true}>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {(["ALL", "HV", "HTD"] as Scope[]).map((t) => (
                                            <button key={t} onClick={() => setScope(t)} className={cx("px-3 py-1 rounded-lg border text-xs font-semibold transition-colors", scope === t ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50")}>{t}</button>
                                        ))}
                                    </div>
                                </div>

                                <Card className="rounded-2xl shadow-sm border-slate-200 bg-white">
                                    <CardContent className="p-0">
                                        {/* A. KPI Row */}
                                        <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100">
                                            {[
                                                { key: "ALL" as const, label: "Total Visits", value: counts.total },
                                                { key: "COMPLETED" as const, label: "Completed", value: counts.completed },
                                                { key: "ONGOING" as const, label: "Ongoing", value: counts.ongoing },
                                                { key: "SCHEDULED" as const, label: "Scheduled", value: counts.scheduled },
                                                { key: "CANCELLED" as const, label: "Cancelled", value: counts.cancelled },
                                            ].map((k) => (
                                                <button key={k.key} onClick={() => setFocusStatus(k.key as FocusStatus)} className={cx("p-4 text-left hover:bg-slate-50 transition-colors group relative", focusStatus === k.key && "bg-slate-50")}>
                                                    {focusStatus === k.key && <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-900" />}
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                                                    <p className="text-2xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">{k.value}</p>
                                                </button>
                                            ))}
                                        </div>

                                        {/* B. Split View: List + Radar */}
                                        <div className="grid md:grid-cols-12 min-h-[500px]">

                                            {/* Left: Visits List (7 cols) */}
                                            <div className="md:col-span-7 border-r border-slate-100 flex flex-col">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0">
                                                    <span className="text-xs font-bold text-slate-600">Visits Log</span>
                                                    {focusStatus !== "ALL" && <button onClick={() => setFocusStatus("ALL")} className="text-[10px] font-semibold text-blue-600 hover:underline">Clear Filter ({focusStatus})</button>}
                                                </div>
                                                <div className="p-3 space-y-2 overflow-y-auto max-h-[500px] flex-1">
                                                    {visibleVisits.length > 0 ? visibleVisits.map((v) => (
                                                        <div key={v.id} className="group relative rounded-xl border border-slate-100 bg-white p-3 hover:border-blue-200 hover:shadow-sm transition-all">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className={cx("font-mono text-[10px] text-slate-500 bg-transparent border border-slate-200")}>{v.time}</Badge>
                                                                    <span className="text-sm font-bold text-slate-900">{v.customer}</span>
                                                                </div>
                                                                <Badge className={cx("text-[10px] uppercase font-bold", v.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : v.status === 'ONGOING' ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "bg-slate-100 text-slate-700")}>{v.status}</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-500">
                                                                <div>Lead: <span className="font-semibold text-slate-700"><LeadLink id={v.leadId} /></span></div>
                                                                <div>Car: <span className="text-slate-700">{v.car}</span></div>
                                                                <div className="col-span-2 flex items-center gap-1">
                                                                    RM: <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">{v.rm ? v.rm[0] : "?"}</div> <span className="text-slate-700">{v.rm || "Unassigned"}</span>
                                                                </div>
                                                            </div>
                                                            {v.feedbackRating && (
                                                                <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-2">
                                                                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cx("h-3 w-3", i < v.feedbackRating! ? (v.feedbackRating! >= 4 ? "fill-emerald-400 text-emerald-400" : "fill-amber-400 text-amber-400") : "text-slate-200")} />)}</div>
                                                                    {v.feedbackText && <span className="text-xs italic text-slate-500 truncate max-w-[200px]">"{v.feedbackText}"</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )) : (
                                                        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                                            <p className="text-sm">No visits found.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Feedback & Insights (5 cols) */}
                                            <div className="md:col-span-5 bg-slate-50/30 flex flex-col">
                                                <div className="p-4 border-b border-slate-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Feedback Pulse</span>
                                                        <div className="flex bg-white rounded-lg border p-0.5">
                                                            <button onClick={() => setFeedbackView("HUB")} className={cx("px-2 py-0.5 text-[10px] font-bold rounded", feedbackView === 'HUB' ? "bg-slate-800 text-white" : "text-slate-500")}>HUB</button>
                                                            <button onClick={() => setFeedbackView("RM")} className={cx("px-2 py-0.5 text-[10px] font-bold rounded", feedbackView === 'RM' ? "bg-slate-800 text-white" : "text-slate-500")}>RM</button>
                                                        </div>
                                                    </div>

                                                    {/* Date Toggles */}
                                                    <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                                                        {[{ key: "1D", label: "Today" }, { key: "2D", label: "2 Days" }, { key: "7D", label: "Week" }].map((opt) => (
                                                            <button key={opt.key} onClick={() => setRangeKey(opt.key as any)} className={cx("flex-1 rounded-md border py-1.5 text-[10px] font-bold transition-all", rangeKey === opt.key ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300")}>{opt.label}</button>
                                                        ))}
                                                        <div className="relative">
                                                            <input type="date" value={customStartISO} onChange={(e) => { setCustomStartISO(e.target.value); setRangeKey("CUSTOM"); }} className="h-full rounded-md border border-slate-200 px-2 text-[10px] w-[24px] overflow-hidden focus:w-[100px] transition-all bg-white" />
                                                            <CalendarDays className="absolute top-1.5 left-1.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                                        </div>
                                                    </div>

                                                    {/* Rating Counts Grid */}
                                                    {feedbackView === "HUB" && (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[5, 4, 3, 2, 1, "NF"].map((r) => (
                                                                <button key={r} onClick={() => setFocusRating(r as FocusRating)} className={cx("flex flex-col items-center justify-center p-2 rounded-xl border transition-all", focusRating === r ? "bg-white border-slate-900 shadow-md transform scale-105" : "bg-white border-slate-100 hover:border-slate-200")}>
                                                                    <span className={cx("text-base font-bold", r === 'NF' ? "text-slate-400" : (typeof r === 'number' && r >= 4) ? "text-emerald-600" : "text-rose-600")}>{r}{typeof r === 'number' && '★'}</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium">{ratingCounts[String(r)] ?? 0}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Scrollable Feedback Content */}
                                                <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
                                                    {feedbackView === "HUB" ? (
                                                        <div className="space-y-3">
                                                            {visibleFeedback.map((v) => (
                                                                <div key={v.id} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-slate-700">{v.customer}</span>
                                                                            <span className="text-[10px]"><LeadLink id={v.leadId} /></span>
                                                                        </div>
                                                                        <span className={cx("font-bold px-1 rounded", (v.feedbackRating || 0) >= 4 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50")}>{v.feedbackRating}★</span>
                                                                    </div>
                                                                    <p className="text-slate-500 mt-1">{v.feedbackText || <span className="italic opacity-50">No comment</span>}</p>
                                                                </div>
                                                            ))}
                                                            {visibleFeedback.length === 0 && <p className="text-center text-xs text-slate-400 mt-4">No reviews found.</p>}
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                                                <tr>
                                                                    <th className="p-3 text-left font-bold uppercase tracking-wider w-[120px]">RM Name</th>
                                                                    <th className="p-3 text-center text-rose-600 font-bold">&lt; 3</th>
                                                                    <th className="p-3 text-center text-emerald-600 font-bold">≥ 3</th>
                                                                    <th className="p-3 text-center text-slate-400 font-bold">NF</th>
                                                                    <th className="p-3 text-center font-bold text-slate-900">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {rmAggregated.map((rm) => (
                                                                    <tr key={rm.rm} className="hover:bg-slate-50 transition-colors">
                                                                        <td className="p-3 font-medium text-slate-700">{rm.rm}</td>
                                                                        <td className="p-3 text-center font-bold text-rose-600">{rm.below3}</td>
                                                                        <td className="p-3 text-center font-bold text-emerald-600">{rm.aboveEq3}</td>
                                                                        <td className="p-3 text-center text-slate-400">{rm.nf}</td>
                                                                        <td className="p-3 text-center font-bold text-slate-900">{rm.total}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CollapsibleSection>
                        </section>

                        {/* 2. HTD CONTROL TOWER */}
                        <section>
                            <CollapsibleSection title="2. HTD Logistics" defaultOpen={true}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
                                        {([{ k: "upcoming", l: "Upcoming" }, { k: "ongoing", l: "Ongoing" }, { k: "cancelled", l: "Cancelled" }, { k: "completed", l: "Completed" }] as any[]).map((t) => {
                                            const count = htdWithOverrides.filter(h => h.stage === t.k).length;
                                            return (
                                                <button key={t.k} onClick={() => setHtdFilter(t.k)} className={cx("flex items-center gap-2 px-3 py-1 md:px-4 rounded-md text-xs font-semibold transition-all", htdFilter === t.k ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:bg-slate-50")}>
                                                    {t.l}
                                                    <span className={cx("px-1.5 py-0.5 rounded text-[10px]", htdFilter === t.k ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600")}>{count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Card className="rounded-xl border-slate-200 shadow-sm min-h-[300px]">
                                    <table className="w-full text-xs">
                                        {htdFilter === 'upcoming' && (
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                {htdAttention.length > 0 && (
                                                    <tr>
                                                        <td colSpan={10} className="bg-amber-50 border-b border-amber-100 p-2">
                                                            <div className="flex items-center justify-between text-amber-800 px-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4 animate-pulse" />
                                                                    <span className="font-bold text-xs">NEEDS ATTENTION</span>
                                                                </div>
                                                                <div className="flex gap-4 text-xs font-medium">
                                                                    {htdAttention.map(a => (
                                                                        <span key={a.leadId}>{a.slot} · {a.customerName} · Travel {a.travelMins}m <span className="font-bold ml-1 bg-amber-100 px-1 rounded border border-amber-200">LEAVE BY {fromMins(toMins(a.slot) - a.travelMins!)}</span></span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Lead ID</th>
                                                    <th className="px-4 py-3 text-left">Customer</th>
                                                    <th className="px-4 py-3 text-left">RM</th>
                                                    <th className="px-4 py-3 text-left">RM Status</th>
                                                    <th className="px-4 py-3 text-left">Slot</th>
                                                    <th className="px-4 py-3 text-left">Travel</th>
                                                    <th className="px-4 py-3 text-left">Call</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                        )}
                                        {htdFilter === 'ongoing' && (
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Lead ID</th>
                                                    <th className="px-4 py-3 text-left">Customer</th>
                                                    <th className="px-4 py-3 text-left">RM</th>
                                                    <th className="px-4 py-3 text-left">Slot</th>
                                                    <th className="px-4 py-3 text-left">Call</th>
                                                    <th className="px-4 py-3 text-left">Est Travel</th>
                                                    <th className="px-4 py-3 text-left">Checkout</th>
                                                    <th className="px-4 py-3 text-left">Check-in</th>
                                                    <th className="px-4 py-3 text-left">Visit</th>
                                                    <th className="px-4 py-3 text-left">Idle+Late?</th>
                                                    <th className="px-4 py-3 text-left">ETA Hub</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                        )}
                                        {htdFilter === 'cancelled' && (
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Lead ID</th>
                                                    <th className="px-4 py-3 text-left">Customer</th>
                                                    <th className="px-4 py-3 text-left">RM</th>
                                                    <th className="px-4 py-3 text-left">Slot</th>
                                                    <th className="px-4 py-3 text-left">Call</th>
                                                    <th className="px-4 py-3 text-left">Follow up?</th>
                                                    <th className="px-4 py-3 text-left">Reason</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                        )}
                                        {htdFilter === 'completed' && (
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Lead ID</th>
                                                    <th className="px-4 py-3 text-left">Customer</th>
                                                    <th className="px-4 py-3 text-left">RM</th>
                                                    <th className="px-4 py-3 text-left">Slot</th>
                                                    <th className="px-4 py-3 text-left">Call</th>
                                                    <th className="px-4 py-3 text-left">Est Total</th>
                                                    <th className="px-4 py-3 text-left">Actual</th>
                                                    <th className="px-4 py-3 text-left">Token</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                        )}
                                        <tbody className="divide-y divide-slate-100">
                                            {htdFiltered.map((r) => (
                                                <tr key={r.leadId} className="hover:bg-slate-50 group">
                                                    {/* COMMON: Lead, Customer, RM (Can refactor, but keeping logic distinct per mode for clarity) */}

                                                    {htdFilter === 'upcoming' && <>
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10px]"><LeadLink id={r.leadId} /></td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.customerName}</td>
                                                        <td className="px-4 py-3"><div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full inline-block text-[10px] font-bold">{r.rmName}</div></td>
                                                        <td className="px-4 py-3 text-slate-600 font-medium">{r.rmStatus}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.slot}</td>
                                                        <td className="px-4 py-3 text-slate-500">{r.travelMins}m</td>
                                                        <td className="px-4 py-3"><Pill tone={r.call === 'yes' ? 'ok' : r.call === 'no' ? 'bad' : 'muted'}>{r.call?.toUpperCase()}</Pill></td>
                                                    </>}

                                                    {htdFilter === 'ongoing' && <>
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10px]"><LeadLink id={r.leadId} /></td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.customerName}</td>
                                                        <td className="px-4 py-3"><div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full inline-block text-[10px] font-bold">{r.rmName}</div></td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.slot}</td>
                                                        <td className="px-4 py-3"><Pill tone={r.call === 'yes' ? 'ok' : r.call === 'late' ? 'warn' : 'muted'}>{r.call?.toUpperCase()}</Pill></td>
                                                        <td className="px-4 py-3 text-slate-500">{r.estTravelMins}m</td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-900">{r.checkoutTime}</div>
                                                            <div className="text-[9px] text-slate-400">to customer: {r.reachCustomerMins}m</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-900">{r.checkinTime || '—'}</div>
                                                            <div className="text-[9px] text-slate-400">to hub: {r.returnToHubMins || '—'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-slate-600">{r.visitDurationMins}m</td>
                                                        <td className="px-4 py-3"><Pill tone={r.idleButLateCheckout ? 'warn' : 'muted'}>{r.idleButLateCheckout ? 'YES' : 'NO'}</Pill></td>
                                                        <td className="px-4 py-3 font-bold text-slate-700 bg-slate-50 rounded px-2 text-center border border-slate-200 w-min">{r.etaBackToHub || '—'}</td>
                                                    </>}

                                                    {htdFilter === 'cancelled' && <>
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10px]"><LeadLink id={r.leadId} /></td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.customerName}</td>
                                                        <td className="px-4 py-3"><div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full inline-block text-[10px] font-bold">{r.rmName}</div></td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.slot}</td>
                                                        <td className="px-4 py-3"><Pill tone={r.call === 'yes' ? 'ok' : r.call === 'no' ? 'bad' : 'muted'}>{r.call?.toUpperCase()}</Pill></td>
                                                        <td className="px-4 py-3"><Pill tone={r.didFollowUp ? 'ok' : r.didFollowUp === false ? 'bad' : 'muted'}>{r.didFollowUp ? 'YES' : r.didFollowUp === false ? 'NO' : 'NA'}</Pill></td>
                                                        <td className="px-4 py-3 text-slate-600 italic max-w-[200px] truncate" title={r.cancelReason}>{r.cancelReason || '—'}</td>
                                                    </>}

                                                    {htdFilter === 'completed' && <>
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[10px]"><LeadLink id={r.leadId} /></td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.customerName}</td>
                                                        <td className="px-4 py-3"><div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full inline-block text-[10px] font-bold">{r.rmName}</div></td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.slot}</td>
                                                        <td className="px-4 py-3"><Pill tone={r.call === 'yes' ? 'ok' : r.call === 'late' ? 'warn' : 'muted'}>{r.call?.toUpperCase()}</Pill></td>
                                                        <td className="px-4 py-3 text-slate-500">{r.estTotalMins}m</td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{r.actualMins}m</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Pill tone={r.token === 'yes' ? 'ok' : 'bad'}>{r.token?.toUpperCase()}</Pill>
                                                                {r.feedbackRating && r.feedbackRating <= 3 && <span className="text-[9px] text-slate-400">(rating {r.feedbackRating})</span>}
                                                            </div>
                                                        </td>
                                                    </>}

                                                    <td className="px-4 py-3 text-right"><button onClick={() => setSelectedHTD(r)} className="text-slate-400 hover:text-blue-600 font-semibold text-[10px] uppercase tracking-wide border border-slate-200 px-3 py-1 rounded bg-white hover:bg-slate-50">View</button></td>
                                                </tr>
                                            ))}
                                            {htdFiltered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-400 italic">No {htdFilter} HTDs found.</td></tr>}
                                        </tbody>
                                    </table>
                                </Card>
                            </CollapsibleSection>
                        </section>

                        {/* 3. RM LIVE PRODUCTIVITY */}
                        <section>
                            <CollapsibleSection title="3. RM Live Productivity" defaultOpen={true}>
                                <div className="flex items-center justify-between mb-4">
                                    <button onClick={openHub} className="bg-white border border-slate-200 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                        ⧉ Full Hub Aggregate
                                    </button>
                                </div>

                                <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-4 w-[150px]">RM</th>
                                                    <th className="px-4 py-4">Now</th>
                                                    <th className="px-4 py-4">Runtime</th>
                                                    <th className="px-4 py-4">Today</th>
                                                    <th className="px-4 py-4">Next HTD (&lt;75m)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {rmComputed.map((rm) => (
                                                    <tr key={rm.id} onClick={() => setOpenRM(rm)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="font-bold text-slate-900 border-b border-transparent group-hover:border-slate-900 inline-block">{rm.name}</div>
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {rm.now === 'IDLE' ? (
                                                                <div className="font-bold text-slate-500">IDLE</div>
                                                            ) : (
                                                                <div>
                                                                    <div className="font-bold text-slate-900">{rm.now}</div>
                                                                    <div className="text-slate-500">{rm.customer}</div>
                                                                    <div className="text-[10px]"><LeadLink id={rm.currentLeadId || ''} /></div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {rm.now !== 'IDLE' && (
                                                                <div>
                                                                    <div className="font-bold text-slate-900">{fmtRuntime(rm.runtime)}</div>
                                                                    <div className="text-[10px] text-slate-400">since {fmtTime(rm.startedAt)}</div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                                                                <span className="text-amber-700">HV {rm.hvCount}</span>
                                                                <span className="text-blue-700">HTD {rm.htdCount}</span>
                                                                <span className={cx(rm.utilRate < 40 ? "text-rose-600" : "text-emerald-600", "font-bold")}>Util {rm.utilRate}%</span>
                                                                <span className="text-slate-400">FRC {fmtTime(rm.frc)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {rm.nextHTD ? (
                                                                <div>
                                                                    <div className="font-bold text-slate-900">{rm.nextHTD.at} · HTD</div>
                                                                    <div className="text-[10px]"><LeadLink id={rm.nextHTD.leadId} /></div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </CollapsibleSection>
                        </section>
                    </div>



                    {/* <<< RIGHT COLUMN: ALERTS & INSIGHTS (3 SPAN) >>> */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* WIDGET 1: PRIORITY ACTIONS (Renamed from Alerts) */}
                        <CollapsibleSection title="Priority Actions" defaultOpen={true}>
                            <div className="space-y-3">
                                {alerts.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
                                        <div className="mx-auto h-8 w-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">✓</div>
                                        <p className="text-emerald-800 font-bold text-xs">All Systems Go</p>
                                        <p className="text-emerald-600/70 text-[10px]">No critical blockers.</p>
                                    </div>
                                ) : (
                                    alerts.map(a => (
                                        <div key={a.id} className={cx("relative rounded-xl border p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md bg-white cursor-pointer group", a.type === 'critical' ? "border-rose-100 shadow-rose-50/50" : "border-amber-100 shadow-amber-50/50")}>
                                            <div className={cx("absolute top-3 left-3 h-2 w-2 rounded-full ring-2 ring-white", a.type === 'critical' ? 'bg-rose-500' : 'bg-amber-500')} />
                                            <div className="pl-4">
                                                <div className="flex justify-between items-start">
                                                    <p className={cx("text-[11px] font-bold leading-snug mb-1 pr-2", a.type === 'critical' ? "text-rose-900" : "text-amber-900")}>{a.msg}</p>
                                                    <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">GO →</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Clock className="h-3 w-3" />
                                                    <span className="text-[10px] font-medium">{a.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* WIDGET 2: RESOURCE MONITOR (New - Replaces Live Health) */}
                        <CollapsibleSection title="Resource Monitor" defaultOpen={true}>
                            <div className="space-y-2">
                                {/* Summary Header */}
                                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                                    <span className="font-semibold text-slate-600">Active RMs</span>
                                    <div className="flex gap-2">
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">{rmComputed.filter(r => r.now === 'IDLE').length} Free</span>
                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{rmComputed.filter(r => r.now !== 'IDLE').length} Busy</span>
                                    </div>
                                </div>

                                {/* RM List for Dispatch Planning */}
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {rmComputed.slice().sort((a, _b) => (a.now === 'IDLE' ? -1 : 1)).map(rm => (
                                        <div onClick={() => setOpenRM(rm as any)} key={rm.id} className={cx("p-2 rounded-lg border flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors", rm.now === 'IDLE' ? "bg-white border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100 opacity-80")}>
                                            <div className="flex items-center gap-2">
                                                <div className={cx("h-2 w-2 rounded-full", rm.now === 'IDLE' ? "bg-emerald-500" : "bg-slate-300")} />
                                                <div>
                                                    <div className="text-[11px] font-bold text-slate-900">{rm.name}</div>
                                                    <div className="text-[9px] text-slate-500">{rm.now === 'IDLE' ? 'Ready for dispatch' : `Busy: ${rm.now}`}</div>
                                                </div>
                                            </div>
                                            {rm.now !== 'IDLE' && (
                                                <div className="text-[9px] font-mono text-slate-400 bg-white px-1 rounded border border-slate-100">{fmtRuntime(rm.runtime)}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* WIDGET 3: DAILY TARGETS (Replaces Up Next) */}
                        <CollapsibleSection title="Daily Targets" defaultOpen={true}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 p-3 rounded-xl shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Star className="h-12 w-12 text-white" /></div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tokens</div>
                                    <div className="text-2xl font-bold text-white mb-2">{rmComputed.reduce((a, r) => a + r.tokensToday, 0)} <span className="text-sm font-medium text-slate-500">/ 8</span></div>
                                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400" style={{ width: '40%' }} />
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-2 text-right">3 Pending</div>
                                </div>

                                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm relative overflow-hidden">
                                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Deliveries</div>
                                    <div className="text-2xl font-bold text-slate-900 mb-2">{rmComputed.reduce((a, r) => a + r.deliveriesToday, 0)} <span className="text-sm font-medium text-slate-400">/ 5</span></div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: '20%' }} />
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-2 text-right">1 Scheduled</div>
                                </div>
                            </div>

                            {/* Unassigned / Needs Action Mini-List */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Needs Allocation</h5>
                                <div className="space-y-2">
                                    {htdWithOverrides.filter(h => h.stage === 'upcoming' && h.rmName === 'Unassigned').length === 0 ?
                                        <div className="text-[10px] text-slate-400 italic text-center py-2">No unassigned tasks.</div> :
                                        htdWithOverrides.filter(h => h.stage === 'upcoming' && h.rmName === 'Unassigned').map(h => (
                                            <div key={h.leadId} className="flex justify-between items-center bg-rose-50 border border-rose-100 p-2 rounded-lg">
                                                <span className="text-[10px] font-bold text-rose-700">{h.customerName}</span>
                                                <button className="text-[9px] bg-white border border-rose-200 text-rose-600 px-2 py-0.5 rounded font-bold hover:bg-rose-100">ASSIGN</button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>

                </div>

                <Dialog open={!!selectedHTD} onOpenChange={(v) => !v && setSelectedHTD(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>{selectedHTD?.customerName}</DialogTitle></DialogHeader>
                        {selectedHTD && (
                            <div className="space-y-4 text-sm mt-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2 bg-slate-50 rounded border">Lead: <span className="font-semibold">{selectedHTD.leadId}</span></div>
                                    <div className="p-2 bg-slate-50 rounded border">Slot: <span className="font-semibold">{selectedHTD.slot}</span></div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold">Notes</label>
                                    <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 min-h-[60px]">{selectedHTD.notes || 'No notes.'}</p>
                                </div>
                                {selectedHTD.stage === 'cancelled' && (
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Reason</label>
                                        <textarea
                                            className="w-full border rounded p-2 text-xs"
                                            value={selectedHTD.cancelReason || ''}
                                            onChange={(e) => setHtdOverrides((p: any) => ({ ...p, [selectedHTD.leadId]: { ...(p[selectedHTD.leadId] || {}), cancelReason: e.target.value } }))}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={!!openRM} onOpenChange={(v) => !v && setOpenRM(null)}>
                    <DialogContent className="max-w-2xl bg-slate-50 max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{openRM?.name} — RM Snapshot</DialogTitle></DialogHeader>
                        {openRM && (
                            <div className="space-y-6 text-sm mt-4">
                                <CollapsibleSection title="Current Status + Performance Summary" defaultOpen={true}>
                                    <div className="grid grid-cols-2 gap-8 mb-6">
                                        <div>
                                            <div className="text-[10px] text-rose-500 font-bold uppercase mb-1">Current Activity</div>
                                            <div className="text-lg font-bold text-slate-900 leading-tight">{openRM.now === 'IDLE' ? 'IDLE' : `${openRM.now} · ${openRM.customer}`}</div>
                                            {openRM.currentLeadId && <div className="text-xs text-blue-600"><LeadLink id={openRM.currentLeadId || ''} /></div>}

                                            <div className="mt-4">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">RM Current Location</div>
                                                <button className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                                                    View Live Location
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Live Location Status</div>
                                            <div className="text-lg font-bold text-slate-900">Tracking Enabled</div>

                                            <div className="mt-4 border-2 border-dashed border-slate-200 rounded-lg h-[60px] flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest bg-slate-50">
                                                Map Placeholder
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Metric</th>
                                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Today</th>
                                                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-400">MTD</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                <tr><td className="px-4 py-3 font-medium text-slate-600">Total Visits</td><td className="px-4 py-3 font-bold text-slate-900">{openRM.visitsToday}</td><td className="px-4 py-3 text-slate-400">{openRM.visitsMTD}</td></tr>
                                                <tr><td className="px-4 py-3 font-medium text-slate-600">Tokens</td><td className="px-4 py-3 font-bold text-slate-900">{openRM.tokensToday}</td><td className="px-4 py-3 text-slate-400">{openRM.tokensMTD}</td></tr>
                                                <tr><td className="px-4 py-3 font-medium text-slate-600">Deliveries</td><td className="px-4 py-3 font-bold text-slate-900">{openRM.deliveriesToday}</td><td className="px-4 py-3 text-slate-400">{openRM.deliveriesMTD}</td></tr>
                                                <tr><td className="px-4 py-3 font-medium text-slate-600">Feedback Filled</td><td className="px-4 py-3 font-bold text-slate-900">{openRM.feedbackFilledToday} / {openRM.visitsToday} <span className="text-blue-500 ml-1">({openRM.visitsToday - openRM.feedbackFilledToday} missing)</span></td><td className="px-4 py-3 text-slate-400">{openRM.feedbackFilledMTD} / {openRM.visitsMTD}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title="Today's Timeline" defaultOpen={true}>
                                    {openRM.schedule.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-2">No activity recorded for today.</p> : (
                                        <div className="relative border-l-2 border-slate-100 ml-2 pl-4 py-2 space-y-4">
                                            {openRM.schedule.map((s, i) => (
                                                <div key={i} className="relative">
                                                    <div className={cx("absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-white", s.state === 'done' ? "bg-slate-300" : s.state === 'ongoing' ? "bg-blue-500 animate-pulse" : "bg-white border-slate-300")} />
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs font-bold text-slate-900">{s.at}</span>
                                                                <span className={cx("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", s.state === 'done' ? "bg-slate-100 text-slate-500" : s.state === 'ongoing' ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>{s.state}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge className={cx("text-[9px] h-5 px-1.5", s.type === 'HTD' ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-900 hover:bg-slate-200")}>{s.type}</Badge>
                                                                <span className="text-xs text-slate-600"><LeadLink id={s.leadId} /></span>
                                                            </div>
                                                            {s.state === 'done' && (
                                                                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span>{s.durationMin}m</span>
                                                                    </div>
                                                                    {s.token && (
                                                                        <div className={cx("font-bold px-1.5 rounded", s.token === 'yes' ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500")}>
                                                                            Token: {s.token.toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    {s.feedbackRating && (
                                                                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                                                                            {s.feedbackRating} <Star className="h-3 w-3 fill-amber-500" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CollapsibleSection>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}
