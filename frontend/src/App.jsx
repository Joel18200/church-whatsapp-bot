import React, { useState, useEffect } from 'react';
import { Calendar, Link2, Users, Save, Image as ImageIcon, Send, Clock, CheckCircle, UploadCloud } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState({ groups: [], sunday_time: '', zoom_link: '', send_image: true });
  const [message, setMessage] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [posterPreview, setPosterPreview] = useState(`/media/poster.jpg?t=${new Date().getTime()}`);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error(err));

    fetch('/api/message')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('poster', file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      
      setPosterPreview(URL.createObjectURL(file));
      alert('Poster updated successfully!');
    } catch (err) {
      console.error(err);
      alert(`Failed to upload poster: ${err.message}. Is the Node backend running?`);
    }
  };

  const addGroup = (e) => {
    if (e.key === 'Enter' && newGroup.trim()) {
      setConfig({ ...config, groups: [...config.groups, newGroup.trim()] });
      setNewGroup('');
    }
  };

  const removeGroup = (idx) => {
    const newGroups = [...config.groups];
    newGroups.splice(idx, 1);
    setConfig({ ...config, groups: newGroups });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>WhatsApp Automation Engine</h1>
        <div className="status-badge">
          <CheckCircle size={16} />
          System Online
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <h2><Send size={24} /> Message Configuration</h2>
          
          <div className="form-group">
            <label>Malayalam Message Template</label>
            <textarea 
              className="form-control" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message with {{date}} and {{zoom_link}} placeholders..."
            />
          </div>

          <div className="form-group">
            <label>Media Attachment</label>
            <div className="toggle-wrapper">
              <span style={{color: 'var(--text-muted)'}}><ImageIcon size={18} style={{marginRight: '8px', verticalAlign: 'middle'}}/>Attach Sunday Poster</span>
              <div 
                className={`toggle ${config.send_image ? 'active' : ''}`}
                onClick={() => setConfig({...config, send_image: !config.send_image})}
              >
                <div className="toggle-knob"></div>
              </div>
            </div>
            
            {config.send_image && (
              <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
                {posterPreview && (
                  <div style={{marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.5)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)'}}>
                    <img 
                      src={posterPreview} 
                      alt="Sunday Poster Preview" 
                      style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '0.25rem'}} 
                      onError={(e) => e.target.style.display = 'none'} // Hide if backend drops image or 404s
                    />
                  </div>
                )}
                <label 
                  htmlFor="poster-upload" 
                  className="btn" 
                  style={{
                    width: '100%', 
                    cursor: 'pointer', 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    border: '1px dashed var(--primary)', 
                    color: '#c084fc',
                    justifyContent: 'center'
                  }}
                >
                  <UploadCloud size={18} />
                  Upload New Poster
                </label>
                <input 
                  type="file" 
                  id="poster-upload" 
                  accept="image/*" 
                  style={{display: 'none'}} 
                  onChange={handleImageUpload} 
                />
              </div>
            )}
            
          </div>
        </div>

        <div className="card">
          <h2><Clock size={24} /> Schedule & Link</h2>

          <div className="form-group">
            <label><Calendar size={16} style={{marginRight: '6px', verticalAlign: 'middle'}}/>Cron Expression (Sunday Time)</label>
            <input 
              type="text" 
              className="form-control" 
              value={config.sunday_time || ''}
              onChange={(e) => setConfig({...config, sunday_time: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label><Link2 size={16} style={{marginRight: '6px', verticalAlign: 'middle'}}/>Zoom Link Setup</label>
            <input 
              type="text" 
              className="form-control" 
              value={config.zoom_link || ''}
              onChange={(e) => setConfig({...config, zoom_link: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label><Users size={16} style={{marginRight: '6px', verticalAlign: 'middle'}}/>Broadcast Groups</label>
            <div className="tags-input-container">
              {config.groups && config.groups.map((g, idx) => (
                <span key={idx} className="tag">
                  {g}
                  <button onClick={() => removeGroup(idx)}>×</button>
                </span>
              ))}
              <input 
                type="text" 
                placeholder="Press Enter to add group..."
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                onKeyDown={addGroup}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving Changes...' : saveSuccess ? 'Saved Successfully!' : 'Update Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
