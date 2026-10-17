import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { Member } from "../types/member";
import {
    getAllMembers,
    archiveMember as archiveMemberService,
    updateMember,
} from "../services/members/memberService/membersService";
import { getRecentAttendeeIds } from "../services/attendance/memberActivityService";

export function initials(
    m: Pick<Member, "firstName" | "lastName">
): string {
    return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

export type PledgerFilter = "all" | "yes" | "no";

/** "active" = marked present at least once in the last ACTIVE_WINDOW_MONTHS months. */
export type ActivityFilter = "all" | "active" | "inactive";

export const ACTIVE_WINDOW_MONTHS = 3;

export interface UseMembersOptions {
    pledgersOnly?: boolean;
}

export interface UseMembersResult {
    loading: boolean;
    members: Member[];
    activeCount: number;
    filteredCount: number;
    search: string;
    filter: ActivityFilter;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    start: number;
    toast: string | null;

    onSearchChange: (value: string) => void;
    onFilterChange: (value: ActivityFilter) => void;
    onPageSizeChange: (size: number) => void;

    goFirst: () => void;
    goPrev: () => void;
    goNext: () => void;
    goLast: () => void;

    archiveMember: (id: string) => void;
    togglePledger: (id: string) => void;

    refetch: () => void;
}

export default function useMembers(
    options: UseMembersOptions = {}
): UseMembersResult {

    const { pledgersOnly = false } = options;

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [filter, setFilter] = useState<ActivityFilter>("all");
    const [recentAttendeeIds, setRecentAttendeeIds] = useState<Set<string>>(new Set());

    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState<string | null>(null);

    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true);

        try {
            const [data, attendeeIds] = await Promise.all([
                getAllMembers(),
                // Non-fatal: if attendance can't load, the list still shows.
                getRecentAttendeeIds(ACTIVE_WINDOW_MONTHS).catch((err) => {
                    console.error("Failed to load recent attendance:", err);
                    return new Set<string>();
                }),
            ]);
            setMembers(data);
            setRecentAttendeeIds(attendeeIds);
        } catch (err) {
            console.error("Failed to fetch members:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const filtered = useMemo(() => {
        return members.filter((m) => {

            // Exclude archived members and visitors (visitors only appear in Attendance)
            if (m.isArchived || m.isVisitor) return false;

            // Pledgers page restriction
            if (pledgersOnly && !m.isPledger) return false;

            // Activity filter
            if (filter === "active" && !recentAttendeeIds.has(m.id)) return false;
            if (filter === "inactive" && recentAttendeeIds.has(m.id)) return false;

            // Search
            const fullName =
                `${m.firstName} ${m.middleInitial} ${m.lastName}`.toLowerCase();

            if (
                search &&
                !fullName.includes(search.toLowerCase())
            ) {
                return false;
            }

            return true;
        });
    }, [members, search, filter, pledgersOnly, recentAttendeeIds]);

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / pageSize)
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }

        if (currentPage < 1) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const start = (currentPage - 1) * pageSize;

    const paginated = filtered.slice(
        start,
        start + pageSize
    );

    const activeCount = useMemo(
        () =>
            members.filter(
                (m) =>
                    !m.isArchived &&
                    !m.isVisitor &&
                    (!pledgersOnly || m.isPledger)
            ).length,
        [members, pledgersOnly]
    );

    const showToast = useCallback((message: string) => {
        setToast(message);

        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }

        toastTimer.current = setTimeout(() => {
            setToast(null);
        }, 2500);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimer.current) {
                clearTimeout(toastTimer.current);
            }
        };
    }, []);

    const archiveMember = useCallback(
        async (id: string) => {
            const member = members.find((x) => x.id === id);

            if (!member) return;

            try {
                await archiveMemberService(id);

                setMembers((prev) =>
                    prev.map((x) =>
                        x.id === id
                            ? { ...x, isArchived: true }
                            : x
                    )
                );

                showToast(
                    `${member.firstName} ${member.lastName} was archived.`
                );
            } catch (err) {
                console.error(err);
                showToast("Failed to archive member.");
            }
        },
        [members, showToast]
    );

    const togglePledger = useCallback(
        async (id: string) => {
            const member = members.find((x) => x.id === id);

            if (!member) return;

            const next = !member.isPledger;

            try {
                await updateMember(id, { isPledger: next });

                setMembers((prev) =>
                    prev.map((x) =>
                        x.id === id
                            ? { ...x, isPledger: next }
                            : x
                    )
                );

                showToast(
                    next
                        ? `${member.firstName} ${member.lastName} marked as pledger.`
                        : `${member.firstName} ${member.lastName} removed as pledger.`
                );
            } catch (err) {
                console.error(err);
                showToast("Failed to update pledger status.");
            }
        },
        [members, showToast]
    );

    const onSearchChange = useCallback((value: string) => {
        setSearch(value);
        setCurrentPage(1);
    }, []);

    const onFilterChange = useCallback(
        (value: ActivityFilter) => {
            setFilter(value);
            setCurrentPage(1);
        },
        []
    );

    const onPageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    }, []);

    const goFirst = useCallback(
        () => setCurrentPage(1),
        []
    );

    const goPrev = useCallback(
        () =>
            setCurrentPage((p) =>
                Math.max(1, p - 1)
            ),
        []
    );

    const goNext = useCallback(
        () =>
            setCurrentPage((p) =>
                Math.min(totalPages, p + 1)
            ),
        [totalPages]
    );

    const goLast = useCallback(
        () => setCurrentPage(totalPages),
        [totalPages]
    );

    return {
        loading,
        members: paginated,
        activeCount,
        filteredCount: filtered.length,
        search,
        filter,
        pageSize,
        currentPage,
        totalPages,
        start,
        toast,

        onSearchChange,
        onFilterChange,
        onPageSizeChange,

        goFirst,
        goPrev,
        goNext,
        goLast,

        archiveMember,
        togglePledger,

        refetch: fetchMembers,
    };
}