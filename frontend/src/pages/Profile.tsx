import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const SERVER_URL = BASE_API_URL.replace('/api', '');
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a0aec0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

export default function Profile() {
  const {
    username,
    fullName,
    avatarUrl,
    uploading,
    uploadError,
    uploadStatus,
    setUploadStatus,
    setUploadError,
    uploadAvatar
  } = useProfile();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    try {
      await uploadAvatar(selectedFile);
      setSelectedFile(null);
      // Reset input element
      const fileInput = document.getElementById('profile-avatar-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      // toast and uploadError are handled by the hook
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
