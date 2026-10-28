import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { YOUTH, isYouthCategory, type Member } from "../types/member";
import {
    getAllMembers,
    archiveMember as archiveMemberService,
    updateMember,
} from "../services/members/memberService/membersService";

export function initials(
    m: Pick<Member, "firstName" | "lastName">
): string {
    return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

export type PledgerFilter = "all" | "yes" | "no";

/** Category filter: "all", UNCATEGORIZED, YOUTH, or a category name (e.g. "Women"). */
export const ALL_CATEGORIES = "all";
export const UNCATEGORIZED = "__uncategorized__";

export interface UseMembersOptions {
    pledgersOnly?: boolean;
}

export interface UseMembersResult {
    loading: boolean;
    members: Member[];
    /** Every member matching the current search/filter (not just this page). */
    filteredMembers: Member[];
    activeCount: number;
    filteredCount: number;
    search: string;
    filter: string;
    /** Categories in use among listed members, alphabetical. */
    categories: string[];
    hasUncategorized: boolean;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    start: number;
    toast: string | null;

    onSearchChange: (value: string) => void;
    onFilterChange: (value: string) => void;
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

    const [filter, setFilter] = useState<string>(ALL_CATEGORIES);

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

            // Exclude archived members and visitors (visitors only appear in Attendance)
            if (m.isArchived || m.isVisitor) return false;

            // Pledgers page restriction
            if (pledgersOnly && !m.isPledger) return false;

            // Category filter
            const category = (m.category ?? "").trim();
            if (filter === UNCATEGORIZED && category) return false;
            if (filter === YOUTH && !isYouthCategory(category)) return false;
            if (filter !== ALL_CATEGORIES && filter !== UNCATEGORIZED && filter !== YOUTH && category !== filter) return false;

            // Search
            // Match "First MI Last" as well as the displayed "Last, First MI".
            const fullName =
                `${m.firstName} ${m.middleInitial} ${m.lastName}`.toLowerCase();
            const lastFirst =
                `${m.lastName}, ${m.firstName} ${m.middleInitial}`.toLowerCase();
            const q = search.toLowerCase().trim();

            if (
                q &&
                !fullName.includes(q) &&
                !lastFirst.includes(q) &&
                !lastFirst.replace(",", "").includes(q)
            ) {
                return false;
            }

            return true;
        })
        // Alphabetical by last name, then first name.
        .sort((a, b) =>
            (a.lastName ?? "").localeCompare(b.lastName ?? "", undefined, { sensitivity: "base" }) ||
            (a.firstName ?? "").localeCompare(b.firstName ?? "", undefined, { sensitivity: "base" })
        );
    }, [members, search, filter, pledgersOnly]);

    // Dropdown options come from the data, so only categories someone actually
    // has are offered (archived members and visitors don't count).
    const { categories, hasUncategorized } = useMemo(() => {
        const listed = members.filter((m) => !m.isArchived && !m.isVisitor);
        const set = new Set(listed.map((m) => (m.category ?? "").trim()).filter(Boolean));
        return {
            categories: Array.from(set).sort((a, b) => a.localeCompare(b)),
            hasUncategorized: listed.some((m) => !(m.category ?? "").trim()),
        };
    }, [members]);

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
        (value: string) => {
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
        filteredMembers: filtered,
        activeCount,
        filteredCount: filtered.length,
        search,
        filter,
        categories,
        hasUncategorized,
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