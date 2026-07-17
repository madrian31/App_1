import type { IMenuService, MenuItem, UserAccess } from './interface/IMenuService';

// Users with this role always see every menu item, regardless of department.
const ADMIN_ROLE = 'admin';

export class MenuService implements IMenuService {
    private menuItems: MenuItem[] = [
        { sortOrder: 1, name: 'Home', iconClass: 'fa-solid fa-house', path: '/home' },

        { sortOrder: 2, name: 'Calendar', iconClass: 'fa-solid fa-calendar', path: '/calendar' },

        {
            sortOrder: 10, name: 'Members', iconClass: 'fa-solid fa-users', path: '',
            subMenuItems: [
                { sortOrder: 11, name: 'All Members', iconClass: 'fa-solid fa-list', path: '/AllMembers' },
                { sortOrder: 12, name: 'Pledgers', iconClass: 'fa-solid fa-hand-holding-heart', path: '/PledgesMembers' },
                { sortOrder: 19, name: 'Archives', iconClass: 'fa-solid fa-box', path: '/ArchivesMembers' }
            ] 
        },

        { sortOrder: 20, name: 'Roles', iconClass: 'fa-solid fa-user-shield', path: '/Roles' },

        {
            sortOrder: 30, name: 'Pledges', iconClass: 'fa-solid fa-hand-holding-heart', path: '/pledges',
            subMenuItems: [
                { sortOrder: 31, name: 'All Pledges', iconClass: 'fa-solid fa-list', path: '/pledges' },
                { sortOrder: 32, name: 'Report', iconClass: 'fa-solid fa-chart-bar', path: '/pledges/report' },
                { sortOrder: 33, name: 'Ledger', iconClass: 'fa-solid fa-book', path: '/ledger' }
            ]
        },

        {
            sortOrder: 40, name: 'Visitation', iconClass: 'fa-solid fa-house', path: '',
            subMenuItems: [
                { sortOrder: 41, name: 'All Visitations', iconClass: 'fa-solid fa-list', path: '/Visitation/Visitation' },
                { sortOrder: 42, name: 'Visitation Report', iconClass: 'fa-solid fa-chart-bar', path: '/Visitation/VisitationReport' }
            ]
        },

       {
            sortOrder: 50, name: 'Sunday School', iconClass: 'fa-solid fa-chalkboard-user', path: '',
            subMenuItems: [
                { sortOrder: 51, name: 'Attendance', iconClass: 'fa-solid fa-calendar-check', path: '/SundaySchool/SundaySchoolAttendance' },
                { sortOrder: 52, name: 'Line Up', iconClass: 'fa-solid fa-users-line', path: '/SundaySchool/SundaySchoolLineUp' },
                { sortOrder: 53, name: 'Savings', iconClass: 'fa-solid fa-piggy-bank', path: '/SundaySchool/SundaySchool' },
                { sortOrder: 54, name: 'Ledger', iconClass: 'fa-solid fa-book', path: '/SundaySchool//SundaySchoolLedger' },
                { sortOrder: 55, name: 'Report', iconClass: 'fa-solid fa-chart-bar', path: '/SundaySchool/report' },
            ]
        },

        // { sortOrder: 60, name: 'Profile', iconClass: 'fa-solid fa-user', path: '/profile' },
        { sortOrder: 70, name: 'Settings', iconClass: 'fa-solid fa-gear', path: '/settings' }
    ];

    getMenuItems(userAccess?: UserAccess): MenuItem[] {
        // No access info yet (still loading the user's profile) — show only
        // items that have no restriction at all, to avoid a flash of items
        // the user isn't actually allowed to see.
        const access = userAccess ?? { role: '', departments: [], departmentNames: [] };
        return this.filterItems(this.menuItems, access);
    }

    private hasAccess(item: MenuItem, access: UserAccess): boolean {
        if (access.role?.toLowerCase() === ADMIN_ROLE) return true;

        const hasRoleRule = !!item.allowedRoles;
        const hasDeptRule = !!item.allowedDepartments;

        const roleMatch = hasRoleRule
            && item.allowedRoles!.some(r => r.toLowerCase() === access.role?.toLowerCase());
        const deptMatch = hasDeptRule
            && access.departmentNames.some(name => item.allowedDepartments!.includes(name));

        // No restrictions at all -> visible to everyone.
        if (!hasRoleRule && !hasDeptRule) return true;

        // Both rules set on the same item -> satisfying EITHER one is enough
        // (e.g. Moderators should see "Members" even without a Membership
        // department, and Membership-department users should see it even
        // without the Moderator role).
        if (hasRoleRule && hasDeptRule) return roleMatch || deptMatch;

        // Only one rule set -> that rule alone decides.
        return hasRoleRule ? roleMatch : deptMatch;
    }

    private filterItems(items: MenuItem[], access: UserAccess): MenuItem[] {
        return items
            .filter(item => this.hasAccess(item, access))
            .map(item => {
                if (!item.subMenuItems) return item;
                return { ...item, subMenuItems: this.filterItems(item.subMenuItems, access) };
            })
            // Drop group headers (empty path) that ended up with no visible children
            .filter(item => item.path !== '' || (item.subMenuItems && item.subMenuItems.length > 0));
    }

    private findMenuItem(sortOrder: number, items: MenuItem[] = this.menuItems): MenuItem | undefined {
        for (const item of items) {
            if (item.sortOrder === sortOrder) {
                return item;
            }
            if (item.subMenuItems) {
                const found = this.findMenuItem(sortOrder, item.subMenuItems);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    }

    home(sortOrder: number): MenuItem {
        return this.findMenuItem(sortOrder) ?? this.menuItems[0];
    }

    members(sortOrder: number): MenuItem {
        return this.findMenuItem(sortOrder) ?? this.menuItems[0];
    }

    pledges(sortOrder: number): MenuItem {
        return this.findMenuItem(sortOrder) ?? this.menuItems[0];
    }

    profile(sortOrder: number): MenuItem {
        return this.findMenuItem(sortOrder) ?? this.menuItems[0];
    }

    settings(sortOrder: number): MenuItem {
        return this.findMenuItem(sortOrder) ?? this.menuItems[0];
    }

    sundaySchool(sortOrder: number): MenuItem {
        return this.findMenuItem(sortOrder) ?? this.menuItems[0];
    }

    visitation(sortOrder: number): MenuItem {
        return this.findMenuItem(sortOrder) ?? this.menuItems[0];
    }
}