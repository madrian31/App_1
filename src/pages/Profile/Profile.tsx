import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import type { Member } from '../../types/member';
import { getMemberById, addMember, updateMember } from '../../services/members/memberService/membersService';
import useLookupLists from '../../hooks/useLookupLists';
import './profile.css';

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function fullName(m: { firstName: string; middleInitial?: string; lastName: string }) {
  const name = `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ''} ${m.lastName}`.trim().replace(/\s+/g, ' ');
  return name;
}

function computeAge(birthday?: string) {
  if (!birthday) return '';
  const dob = new Date(birthday);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : '';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Ensures the member's currently saved value still shows in a <select> even if it
 *  was since removed from the managed list (e.g. deleted in Manage Lists). */
function withCurrentValue(options: string[], current: string): string[] {
  if (!current || options.includes(current)) return options;
  return [...options, current];
}

interface FormState {
  lastName: string;
  firstName: string;
  middleInitial: string;
  gender: string;
  birthday: string;
  dateOfBaptism: string;
  facebookName: string;
  status: string;
  category: string;
  ministryNames: string; // comma-separated, mirrors Member.ministry
  isSmallGroupLeader: boolean;
  us2cgLevel: string;
}

const emptyForm: FormState = {
  lastName: '', firstName: '', middleInitial: '',
  gender: '', birthday: '', dateOfBaptism: '',
  facebookName: '', status: '', category: '',
  ministryNames: '', isSmallGroupLeader: false, us2cgLevel: '',
};

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const isAddMode = id === 'new';

  const [currentUser] = useState('Unknown');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [ministryInput, setMinistryInput] = useState('');
  const [ministryOpen, setMinistryOpen] = useState(false);

  const { lists: lookupLists } = useLookupLists();
  const statusOptions = withCurrentValue(lookupLists.status, form.status);
  const categoryOptions = withCurrentValue(lookupLists.category, form.category);
  const us2cgLevelOptions = withCurrentValue(lookupLists.us2cgLevel, form.us2cgLevel);

  useEffect(() => {
    if (isAddMode) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getMemberById(id as string)
      .then((data) => {
        if (active) setMember(data ?? undefined);
      })
      .catch((err) => {
        console.error('Failed to fetch member:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isAddMode]);

  useEffect(() => {
    if (member) {
      setForm({
        lastName: member.lastName || '',
        firstName: member.firstName || '',
        middleInitial: member.middleInitial || '',
        gender: member.gender || '',
        birthday: member.birthday || '',
        dateOfBaptism: member.dateOfBaptism || '',
        facebookName: member.facebookName || '',
        status: member.status || '',
        category: member.category || '',
        ministryNames: member.ministry || '',
        isSmallGroupLeader: member.isSmallGroupLeader || false,
        us2cgLevel: member.us2cgLevel || '',
      });
    }
  }, [member?.id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { id: fieldId, value } = e.target;
    setForm(prev => ({ ...prev, [fieldId]: value }));
  }

  const ministryList = form.ministryNames
    ? form.ministryNames.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  function ministrySuggestionsFor(query: string): string[] {
    const available = lookupLists.ministry.filter((name) => !ministryList.includes(name));
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((name) => name.toLowerCase().includes(q));
  }

  function addMinistry(name: string) {
    const trimmed = name.trim();
    if (!trimmed || ministryList.includes(trimmed)) return;
    if (!lookupLists.ministry.includes(trimmed)) return; // strict dropdown — must exist in Manage Lists
    setForm(prev => ({ ...prev, ministryNames: [...ministryList, trimmed].join(', ') }));
    setMinistryInput('');
    setMinistryOpen(false);
  }

  function removeMinistry(name: string) {
    setForm(prev => ({ ...prev, ministryNames: ministryList.filter(n => n !== name).join(', ') }));
  }

  async function handleSave() {
    if (!form.lastName.trim() || !form.firstName.trim()) {
      setError('Last Name and First Name are required.');
      return;
    }
    setError('');
    setSaving(true);

    const changes = {
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleInitial: form.middleInitial.trim(),
      gender: form.gender,
      birthday: form.birthday,
      dateOfBaptism: form.dateOfBaptism,
      facebookName: form.facebookName.trim(),
      status: form.status,
      category: form.category,
      ministry: form.ministryNames,
      isSmallGroupLeader: form.isSmallGroupLeader,
      us2cgLevel: form.us2cgLevel,
    };

    try {
      if (isAddMode) {
        await addMember({
          ...changes,
          isPledger: false,
          addedBy: currentUser,
          dateAdded: formatDate(),
          isArchived: false,
        });
      } else {
        if (!id) return;
        await updateMember(id, changes);
      }
      navigate(-1);
    } catch (err: any) {
      console.error('Save error:', err?.message);
      setError(isAddMode ? 'Failed to add member. Try again.' : 'Failed to save changes. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const notFound = !isAddMode && !loading && !member;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', background: '#ededed' }}>
        <div className="profile-page">

          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            Back
          </button>

          {!isAddMode && loading ? (
            <p>Loading profile…</p>
          ) : notFound ? (
            <div className="profile-empty">
              <i className="fa-regular fa-circle-question" aria-hidden="true" />
              <p>Member not found.</p>
            </div>
          ) : (
            <div className="profile-card">

              <div className="profile-header">
                <div className="profile-avatar">
                  {isAddMode
                    ? <i className="fa-solid fa-user-plus" aria-hidden="true" />
                    : initials(form.firstName, form.lastName)}
                </div>
                <div>
                  <h1>
                    {isAddMode
                      ? 'Add Member'
                      : fullName(form)}
                  </h1>
                </div>
              </div>

              {error && (
                <div className="modal-error">
                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                  {error}
                </div>
              )}

              {/* ── Basic Information ── */}
              <p className="section-label">Basic Information</p>
              <div className="row-2">
                <div className="field">
                  <label htmlFor="lastName">Last Name<span className="req">*</span></label>
                  <div className="input-wrap">
                    <input type="text" id="lastName" placeholder="e.g. Smith" value={form.lastName} onChange={handleChange} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="firstName">First Name<span className="req">*</span></label>
                  <div className="input-wrap">
                    <input type="text" id="firstName" placeholder="e.g. John" value={form.firstName} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="row-2">
                <div className="field">
                  <label htmlFor="middleInitial">M.I.</label>
                  <div className="input-wrap">
                    <input type="text" id="middleInitial" placeholder="e.g. T." maxLength={4} value={form.middleInitial} onChange={handleChange} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="gender">Gender</label>
                  <div className="input-wrap">
                    <select id="gender" value={form.gender} onChange={handleChange}>
                      <option value="">Select…</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
              <p className="field-note">
                <span className="req">*</span> Required: Last Name &amp; First Name.
              </p>
              <div className="row-2">
                <div className="field">
                  <label htmlFor="birthday">Birthday</label>
                  <div className="input-wrap">
                    <input type="date" id="birthday" value={form.birthday} onChange={handleChange} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="age">Age</label>
                  <div className="input-wrap" style={{ opacity: 0.7 }}>
                    <input
                      type="text" id="age"
                      value={computeAge(form.birthday)}
                      readOnly
                      placeholder="Auto-computed"
                      style={{ cursor: 'default', backgroundColor: 'var(--input-disabled-bg, #f5f5f5)' }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Church Information ── */}
              <p className="section-label">Church Information</p>
              <div className="row-2">
                <div className="field">
                  <label htmlFor="dateOfBaptism">Date of Baptism (Optional)</label>
                  <div className="input-wrap">
                    <input type="date" id="dateOfBaptism" value={form.dateOfBaptism} onChange={handleChange} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="facebookName">Facebook Name (Optional)</label>
                  <div className="input-wrap">
                    <input type="text" id="facebookName" value={form.facebookName} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="row-2">
                <div className="field">
                  <label htmlFor="status">Status</label>
                  <div className="input-wrap">
                    <select id="status" value={form.status} onChange={handleChange}>
                      <option value="">Select…</option>
                      {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="category">Category</label>
                  <div className="input-wrap">
                    <select id="category" value={form.category} onChange={handleChange}>
                      <option value="">Select…</option>
                      {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="row-2">
                <div className="field">
                  <label htmlFor="us2cgLevel">US2CG Level (Optional)</label>
                  <div className="input-wrap">
                    <select id="us2cgLevel" value={form.us2cgLevel} onChange={handleChange}>
                      <option value="">Select…</option>
                      {us2cgLevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Small Group</label>
                  <div className="input-wrap" style={{ border: 'none' }}>
                    <button
                      type="button"
                      className={`toggle-pledger${form.isSmallGroupLeader ? ' active' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, isSmallGroupLeader: !prev.isSmallGroupLeader }))}
                    >
                      <i className={`fa-solid ${form.isSmallGroupLeader ? 'fa-check' : 'fa-people-group'}`} />
                      {form.isSmallGroupLeader ? 'Small Group Leader' : 'Mark as Leader'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="field autocomplete-field">
                <label htmlFor="ministryInput">Ministry / Department (Optional)</label>
                {ministryList.length > 0 && (
                  <div className="chip-list">
                    {ministryList.map(name => (
                      <span className="chip" key={name}>
                        {name}
                        <button type="button" onClick={() => removeMinistry(name)} aria-label={`Remove ${name}`}>
                          <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="input-wrap">
                  <input
                    type="text" id="ministryInput" autoComplete="off"
                    placeholder="Search or select a ministry…"
                    value={ministryInput}
                    onChange={e => setMinistryInput(e.target.value)}
                    onFocus={() => setMinistryOpen(true)}
                    onBlur={() => setTimeout(() => setMinistryOpen(false), 150)}
                  />
                </div>
                {ministryOpen && (
                  <div className="suggestion-dropdown">
                    {ministrySuggestionsFor(ministryInput).length > 0 ? (
                      ministrySuggestionsFor(ministryInput).map(name => (
                        <div
                          key={name}
                          className="suggestion-item"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => addMinistry(name)}
                        >
                          {name}
                        </div>
                      ))
                    ) : (
                      <div className="suggestion-item" style={{ color: 'var(--text-muted, #9ca3af)', cursor: 'default' }}>
                        No matching ministry. Add it in Settings → Manage Lists.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Meta: Added By ── */}
              <div className="field">
                <label>{isAddMode ? 'Added By' : 'Modified By'}</label>
                <div className="input-wrap" style={{ opacity: 0.7 }}>
                  <input
                    type="text"
                    value={currentUser}
                    readOnly
                    style={{ cursor: 'default', backgroundColor: 'var(--input-disabled-bg, #f5f5f5)' }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => navigate(-1)}>
                  <i className="fa-solid fa-xmark" aria-hidden="true" /> Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : isAddMode ? 'fa-user-plus' : 'fa-floppy-disk'}`} aria-hidden="true" />
                  {saving ? 'Saving…' : isAddMode ? 'Add Member' : 'Save Changes'}
                </button>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}