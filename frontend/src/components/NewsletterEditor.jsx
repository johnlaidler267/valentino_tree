import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './NewsletterEditor.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NewsletterEditor = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [drafts, setDrafts] = useState([]);
  const [sendHistory, setSendHistory] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAdminPassword = () => {
    return localStorage.getItem('adminPassword') || '';
  };

  const fetchDrafts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/newsletter/drafts`, {
        headers: { 'x-admin-password': getAdminPassword() }
      });
      setDrafts(response.data);
    } catch (err) {
      console.error('Error fetching drafts:', err);
    }
  }, []);

  const fetchSendHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/newsletter/sends`, {
        headers: { 'x-admin-password': getAdminPassword() }
      });
      setSendHistory(response.data);
    } catch (err) {
      console.error('Error fetching send history:', err);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
    fetchSendHistory();
  }, [fetchDrafts, fetchSendHistory]);

  const loadDraft = (draft) => {
    setSelectedDraft(draft);
    setSubject(draft.subject);
    setContent(draft.content);
    setActiveTab('editor');
  };

  const saveDraft = async () => {
    if (!subject.trim() || !content.trim()) {
      setError('Subject and content are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedDraft) {
        await axios.put(
          `${API_URL}/newsletter/drafts/${selectedDraft.id}`,
          { subject, content },
          { headers: { 'x-admin-password': getAdminPassword() } }
        );
        setSuccess('Draft updated successfully');
      } else {
        await axios.post(
          `${API_URL}/newsletter/drafts`,
          { subject, content },
          { headers: { 'x-admin-password': getAdminPassword() } }
        );
        setSuccess('Draft saved successfully');
        setSelectedDraft(null);
        setSubject('');
        setContent('');
      }
      fetchDrafts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/newsletter/drafts/${id}`, {
        headers: { 'x-admin-password': getAdminPassword() }
      });
      if (selectedDraft?.id === id) {
        setSelectedDraft(null);
        setSubject('');
        setContent('');
      }
      fetchDrafts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete draft');
    }
  };

  const sendNewsletter = async () => {
    if (!subject.trim() || !content.trim()) {
      setError('Subject and content are required');
      return;
    }

    if (!window.confirm(`Send newsletter "${subject}" to all subscribers?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/newsletter/send`,
        {
          draftId: selectedDraft?.id || null,
          subject,
          content
        },
        { headers: { 'x-admin-password': getAdminPassword() } }
      );
      setSuccess(`Newsletter sent successfully! Sent to ${response.data.sent} subscribers.`);
      fetchSendHistory();
      if (selectedDraft) {
        // Draft was sent, clear selection
        setSelectedDraft(null);
        setSubject('');
        setContent('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send newsletter');
    } finally {
      setLoading(false);
    }
  };

  const newDraft = () => {
    setSelectedDraft(null);
    setSubject('');
    setContent('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="newsletter-editor">
      <div className="newsletter-tabs">
        <button
          className={activeTab === 'editor' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('editor')}
        >
          Editor
        </button>
        <button
          className={activeTab === 'drafts' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('drafts')}
        >
          Drafts ({drafts.length})
        </button>
        <button
          className={activeTab === 'history' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('history')}
        >
          Send History ({sendHistory.length})
        </button>
      </div>

      {activeTab === 'editor' && (
        <div className="editor-panel">
          <div className="editor-header">
            <h3>{selectedDraft ? 'Edit Draft' : 'New Newsletter'}</h3>
            <button className="btn-secondary" onClick={newDraft}>
              New Draft
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="editor-form">
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Newsletter subject line"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content (HTML supported)</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your newsletter content here. HTML is supported."
                className="form-textarea"
                rows={15}
              />
            </div>

            <div className="editor-actions">
              <button
                className="btn-primary"
                onClick={saveDraft}
                disabled={loading}
              >
                {loading ? 'Saving...' : selectedDraft ? 'Update Draft' : 'Save Draft'}
              </button>
              <button
                className="btn-success"
                onClick={sendNewsletter}
                disabled={loading || !subject.trim() || !content.trim()}
              >
                {loading ? 'Sending...' : 'Send to Subscribers'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'drafts' && (
        <div className="drafts-panel">
          <h3>Saved Drafts</h3>
          {drafts.length === 0 ? (
            <p className="empty-state">No drafts saved yet.</p>
          ) : (
            <div className="drafts-list">
              {drafts.map((draft) => (
                <div key={draft.id} className="draft-card">
                  <div className="draft-header">
                    <h4>{draft.subject}</h4>
                    <div className="draft-actions">
                      <button
                        className="btn-small btn-primary"
                        onClick={() => loadDraft(draft)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => deleteDraft(draft.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="draft-meta">
                    Updated: {new Date(draft.updated_at).toLocaleString()}
                  </p>
                  <div className="draft-preview">
                    {draft.content.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-panel">
          <h3>Send History</h3>
          {sendHistory.length === 0 ? (
            <p className="empty-state">No newsletters sent yet.</p>
          ) : (
            <div className="history-list">
              {sendHistory.map((send) => (
                <div key={send.id} className="history-card">
                  <div className="history-header">
                    <h4>{send.subject}</h4>
                    <span className="history-date">
                      {new Date(send.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="history-meta">
                    Sent to {send.recipient_count} subscribers
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsletterEditor;

