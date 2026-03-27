import React, { useEffect, useState } from 'react';

const EMPTY_PROFILE = {
  first_name: '',
  last_name: '',
  timezone: '',
  department: '',
  title: '',
  current_password: '',
  new_password: '',
};

export default function Profile() {
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('http://localhost:8080/api/profile', { credentials: 'include' });
        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }

        if (!res.ok || !data.user) {
          setForm(EMPTY_PROFILE);
          setMessage(data.message || 'Unable to load profile');
          return;
        }

        setForm({
          ...EMPTY_PROFILE,
          ...data.user,
        });
      } catch (err) {
        console.error(err);
        setForm(EMPTY_PROFILE);
        setMessage('Network error loading profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleChange = e => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }

      if (res.ok) {
        setForm((prev) => ({ ...prev, ...data.user }));
        setMessage('Profile updated successfully');
      } else {
        setMessage(data.message || data.error || `Error updating profile (${res.status}) ${text}`);
      }

      console.log('[Profile] PUT response', res.status, data);
    } catch (err) {
      setMessage('Network error updating profile: ' + err.message);
      console.error('Profile save network error', err);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="page-header-title">
          <h1>My Profile</h1>
        </div>
        <p className="page-subtitle">
          Keep your personal details current and manage your password in one simple profile screen.
        </p>
      </section>

      {message && <p className={`status-message${message.toLowerCase().includes('error') || message.toLowerCase().includes('unable') ? ' error' : ''}`}>{message}</p>}

      <section className="panel">
        <h2>Personal Details</h2>
        <div className="profile-grid spacer-top">
          <div className="field-stack">
            <label htmlFor="first_name">First Name</label>
            <input className="text-input" id="first_name" name="first_name" value={form.first_name || ''} onChange={handleChange} />
          </div>
          <div className="field-stack">
            <label htmlFor="last_name">Last Name</label>
            <input className="text-input" id="last_name" name="last_name" value={form.last_name || ''} onChange={handleChange} />
          </div>
          <div className="field-stack">
            <label htmlFor="timezone">Timezone</label>
            <input className="text-input" id="timezone" name="timezone" value={form.timezone || ''} onChange={handleChange} />
          </div>
          <div className="field-stack">
            <label htmlFor="department">Department</label>
            <input className="text-input" id="department" name="department" value={form.department || ''} onChange={handleChange} />
          </div>
          <div className="field-stack">
            <label htmlFor="title">Title</label>
            <input className="text-input" id="title" name="title" value={form.title || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="spacer-top">
          <button className="button" onClick={handleSave}>Save Profile</button>
        </div>
      </section>

      <section className="panel">
        <h2>Change Password</h2>
        <div className="profile-grid spacer-top">
          <div className="field-stack">
            <label htmlFor="current_password">Current Password</label>
            <input className="text-input" id="current_password" type="password" name="current_password" value={form.current_password || ''} onChange={handleChange} />
          </div>
          <div className="field-stack">
            <label htmlFor="new_password">New Password</label>
            <input className="text-input" id="new_password" type="password" name="new_password" value={form.new_password || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="spacer-top">
          <button
            className="ghost-button"
            onClick={async () => {
              const res = await fetch('http://localhost:8080/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  current_password: form.current_password,
                  new_password: form.new_password,
                }),
              });
              const data = await res.json().catch(() => ({}));
              setMessage(res.ok ? 'Password updated!' : data.message || data.error || 'Error changing password');
            }}
          >
            Update Password
          </button>
        </div>
      </section>
    </div>
  );
}
