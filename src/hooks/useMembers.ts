import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { Member } from "../types/member";
import {
    getAllMembers,
    archiveMember as archiveMemberService,
} from "../services/members/memberService/membersService";

export function initials(
    m: Pick<Member, "firstName" | "lastName">
): string {
    return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

export type PledgerFilter = "all" | "yes" | "no";

export interface UseMembersOptions {
    pledgersOnly?: boolean;
}

export interface UseMembersResult {
    loading: boolean;
    members: Member[];
    activeCount: number;
    filteredCount: number;
    search: string;
    filter: PledgerFilter;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    start: number;
    toast: string | null;

    onSearchChange: (value: string) => void;
    onFilterChange: (value: PledgerFilter) => void;
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

    const [filter, setFilter] = useState<PledgerFilter>(
        pledgersOnly ? "yes" : "all"
    );

    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState<string | null>(null);

    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true);

        try {
            const data = await getAllMembers();
            setMembers(data);
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

            // Exclude archived members
            if (m.isArchived) return false;

            // Pledgers page restriction
            if (pledgersOnly) {
                if (!m.isPledger) return false;
            } else {

                // Normal Members page filter
                if (filter === "yes" && !m.isPledger) return false;
                if (filter === "no" && m.isPledger) return false;
            }

            // Search
            const fullName =
                `${m.firstName} ${m.middleName} ${m.lastName}`.toLowerCase();

            if (
                search &&
                !fullName.includes(search.toLowerCase())
            ) {
                return false;
            }

            return true;
        });
    }, [members, search, filter, pledgersOnly]);

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
        (id: string) => {
            const member = members.find((x) => x.id === id);

            if (!member) return;

            const next = !member.isPledger;

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
        },
        [members, showToast]
    );

    const onSearchChange = useCallback((value: string) => {
        setSearch(value);
        setCurrentPage(1);
    }, []);

    const onFilterChange = useCallback(
        (value: PledgerFilter) => {
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