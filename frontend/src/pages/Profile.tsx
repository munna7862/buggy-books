import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// Resolve base origin to resolve static upload paths
const SERVER_URL = BASE_API_URL.replace('/api', '');

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a0aec0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

export default function Profile() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_API_URL}/profile`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then((data) => {
        setUsername(data.username);
        setFullName(data.fullName);
        setAvatarUrl(data.avatarUrl);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Unable to fetch profile details');
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus('');
      setUploadError('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('Uploading...');
    setUploadError('');

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const res = await fetch(`${BASE_API_URL}/profile/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData // Multer boundary gets set automatically by leaving Content-Type header blank
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus('Upload successful!');
      setAvatarUrl(data.avatarUrl);
      toast.success('Avatar updated successfully!');
      setSelectedFile(null);
      // Reset input element
      const fileInput = document.getElementById('profile-avatar-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error(err);
      setUploadStatus('');
      setUploadError(err.message || 'Upload failed');
      toast.error(err.message || 'Profile picture upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resolvedAvatarSrc = avatarUrl 
    ? (avatarUrl.startsWith('http') ? avatarUrl : `${SERVER_URL}${avatarUrl}`)
    : DEFAULT_AVATAR;

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        <h2>User Profile</h2>
        
        <div className="profile-avatar-wrapper">
          <img
            id="profile-avatar-preview"
            src={resolvedAvatarSrc}
            alt="Profile Avatar"
            className="profile-avatar-image"
          />
        </div>

        <div className="profile-info-section">
          <p><strong>Name:</strong> {fullName}</p>
          <p><strong>Username:</strong> {username}</p>
        </div>

        <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

        <form onSubmit={handleUploadSubmit} className="profile-upload-form">
          <h3>Upload Avatar</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
            JPEG, JPG, or PNG formats, under 2MB limit.
          </p>

          <div className="input-group-rnd-9182">
            <input
              type="file"
              name="avatar"
              id="profile-avatar-input"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="input-field-file"
              required
            />
          </div>

          <button
            type="submit"
            id="profile-upload-btn"
            className="submit-action-btn primary-x2"
            disabled={uploading || !selectedFile}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {uploading ? 'Uploading Picture...' : 'Upload Image'}
          </button>

          {uploadStatus && (
            <p id="upload-status" className="upload-status-success">
              {uploadStatus}
            </p>
          )}

          {uploadError && (
            <p id="upload-error" className="upload-status-error">
              {uploadError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
