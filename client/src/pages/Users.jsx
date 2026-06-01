import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  UserCog,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import UserForm from '../components/UserForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Select from '../components/Select.jsx';

import useDebounce from '../hooks/useDebounce.js';
import { useAuth } from '../context/AuthContext.jsx';
import { listUsers, deleteUser } from '../services/userService.js';
import { formatDate } from '../utils/format.js';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'updatedAt', label: 'Recently updated' },
];

const initials = (name = '?') =>
  String(name)
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

export default function Users() {
  const { user: currentUser, updateUser: syncSessionUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const debouncedSearch = useDebounce(search, 350);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      isActive: activeFilter || undefined,
      sortBy,
      sortOrder,
    }),
    [page, limit, debouncedSearch, roleFilter, activeFilter, sortBy, sortOrder]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUsers(queryParams);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load users';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, activeFilter, sortBy, sortOrder, limit]);

  const onSaved = (saved) => {
    fetchData();
    const selfId = currentUser?._id || currentUser?.id;
    if (saved?._id && selfId && String(saved._id) === String(selfId)) {
      syncSessionUser(saved);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser(deleting._id);
      toast.success('User deleted');
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to delete user');
    }
  };

  const toggleSortField = (field) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ field, children }) => {
    const active = sortBy === field;
    return (
      <button
        type="button"
        onClick={() => toggleSortField(field)}
        className={`flex items-center gap-1 text-left hover:text-white ${
          active ? 'text-white' : 'text-slate-500'
        }`}
      >
        {children}
        {active &&
          (sortOrder === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    );
  };

  const filtersActive = !!debouncedSearch || roleFilter !== '' || activeFilter !== '';

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setActiveFilter('');
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage admin and staff accounts — create, edit, and remove team members."
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchData}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add user
            </button>
          </>
        }
      />

      <div className="card mb-4">
        <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-12">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search name or email..."
            className="lg:col-span-4"
          />
          <Select
            wrapperClassName="lg:col-span-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            wrapperClassName="lg:col-span-2"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            wrapperClassName="lg:col-span-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="btn-secondary lg:col-span-2"
          >
            {sortOrder === 'asc' ? (
              <>
                <ArrowUp className="h-4 w-4" /> Asc
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4" /> Desc
              </>
            )}
          </button>
        </div>
        {filtersActive && (
          <div className="flex items-center justify-end border-t border-slate-200 px-4 py-2 dark:border-slate-800">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader label="Loading users..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-sm text-rose-600">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title={filtersActive ? 'No users match your filters' : 'No users yet'}
            description={
              filtersActive
                ? 'Try clearing filters.'
                : 'Add admin or staff accounts for your team.'
            }
            action={
              filtersActive ? (
                <button type="button" className="btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add user
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>
                      <SortHeader field="name">User</SortHeader>
                    </th>
                    <th>
                      <SortHeader field="email">Email</SortHeader>
                    </th>
                    <th>
                      <SortHeader field="role">Role</SortHeader>
                    </th>
                    <th>Status</th>
                    <th>
                      <SortHeader field="createdAt">Joined</SortHeader>
                    </th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => {
                    const selfId = currentUser?._id || currentUser?.id;
                    const isSelf = selfId && String(u._id) === String(selfId);
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                              {initials(u.name)}
                            </span>
                            <span className="font-medium text-white">
                              {u.name}
                              {isSelf && (
                                <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className={`badge capitalize ${
                              u.role === 'admin' ? 'badge-brand' : 'badge-emerald'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.isActive !== false ? (
                            <span className="badge-emerald">Active</span>
                          ) : (
                            <span className="badge bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="text-slate-400">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(u);
                                setFormOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                              aria-label={`Edit ${u.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => setDeleting(u)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                                aria-label={`Delete ${u.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </>
        )}
      </div>

      <UserForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={onSaved}
        user={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete user"
        description={
          deleting
            ? `Permanently remove ${deleting.name} (${deleting.email})? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={onConfirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
