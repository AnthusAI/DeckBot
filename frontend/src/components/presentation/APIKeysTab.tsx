import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react'
import { secretsAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Profile, ProfileUpdate } from '@/types/Secrets'

export function APIKeysTab() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const response = await secretsAPI.listProfiles()
      setProfiles(response.profiles)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (profileId: string) => {
    try {
      await secretsAPI.setActiveProfile(profileId)
      await loadProfiles()
    } catch (err: any) {
      alert(err.message || 'Failed to set active profile')
    }
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This cannot be undone.')) {
      return
    }

    try {
      await secretsAPI.deleteProfile(profileId)
      await loadProfiles()
    } catch (err: any) {
      alert(err.message || 'Failed to delete profile')
    }
  }

  const handleMigrateFromEnv = async () => {
    try {
      const result = await secretsAPI.migrateFromEnv()
      alert(result.message)
      if (result.profile_id) {
        await loadProfiles()
      }
    } catch (err: any) {
      alert(err.message || 'Migration failed')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading profiles...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Key Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Manage your provider API keys and model configurations
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </Button>
      </div>

      {/* No profiles state */}
      {profiles.length === 0 && !showCreateForm && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">No API key profiles configured</p>
          <Button variant="secondary" onClick={handleMigrateFromEnv}>
            Migrate from .env
          </Button>
        </div>
      )}

      {/* Profile list */}
      {profiles.length > 0 && (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isEditing={editingProfile === profile.id}
              onSetActive={() => handleSetActive(profile.id)}
              onEdit={() => setEditingProfile(profile.id)}
              onCancelEdit={() => setEditingProfile(null)}
              onSave={async () => {
                await loadProfiles()
                setEditingProfile(null)
              }}
              onDelete={() => handleDelete(profile.id)}
            />
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <CreateProfileForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={async () => {
            await loadProfiles()
            setShowCreateForm(false)
          }}
        />
      )}
    </div>
  )
}

interface ProfileCardProps {
  profile: Profile
  isEditing: boolean
  onSetActive: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onDelete: () => void
}

function ProfileCard({ profile, isEditing, onSetActive, onEdit, onCancelEdit, onSave, onDelete }: ProfileCardProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    description: profile.description,
    api_key: '',
    primary_model: profile.model_config.primary_model || '',
    secondary_model: profile.model_config.secondary_model || '',
    image_model: profile.model_config.image_model || '',
  })
  const [showChangeKey, setShowChangeKey] = useState(false)

  const handleSave = async () => {
    try {
      const updateData: ProfileUpdate = {
        name: formData.name,
        description: formData.description,
        model_config: {
          primary_model: formData.primary_model,
          secondary_model: formData.secondary_model,
          image_model: formData.image_model,
        },
      }

      // Only include API key if it was changed
      if (formData.api_key) {
        updateData.api_key = formData.api_key
      }

      await secretsAPI.updateProfile(profile.id, updateData)
      onSave()
    } catch (err: any) {
      alert(err.message || 'Failed to update profile')
    }
  }

  if (isEditing) {
    return (
      <div className="border border-border rounded-lg p-4 bg-muted/20">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            {!showChangeKey ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-muted/30 border border-input rounded-md font-mono text-sm">
                  {profile.api_key_masked || '***'}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowChangeKey(true)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Enter new API key..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md font-mono text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowChangeKey(false)
                      setFormData({ ...formData, api_key: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Model</label>
                <input
                  type="text"
                  value={formData.primary_model}
                  onChange={(e) => setFormData({ ...formData, primary_model: e.target.value })}
                  placeholder="gemini-3-pro-preview"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secondary Model</label>
                <input
                  type="text"
                  value={formData.secondary_model}
                  onChange={(e) => setFormData({ ...formData, secondary_model: e.target.value })}
                  placeholder="gemini-2.0-flash-exp"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image Model</label>
              <input
                type="text"
                value={formData.image_model}
                onChange={(e) => setFormData({ ...formData, image_model: e.target.value })}
                placeholder="gemini-3-pro-image-preview"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 transition-colors',
      profile.is_active
        ? 'border-primary bg-primary/5'
        : 'border-border bg-card hover:bg-muted/30'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{profile.name}</h4>
            {profile.is_active && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                <Check className="w-3 h-3" />
                Active
              </span>
            )}
          </div>
          {profile.description && (
            <p className="text-sm text-muted-foreground mb-2">{profile.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Provider: <span className="font-medium">{profile.provider}</span></span>
            <span>Key: <span className="font-mono">{profile.api_key_masked || '***'}</span></span>
            {profile.model_config.primary_model && (
              <span>Primary: <span className="font-medium">{profile.model_config.primary_model}</span></span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-4">
          {!profile.is_active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSetActive}
              title="Set as active"
            >
              Use
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface CreateProfileFormProps {
  onCancel: () => void
  onSuccess: () => void
}

function CreateProfileForm({ onCancel, onSuccess }: CreateProfileFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: 'google_gemini' as const,
    api_key: '',
    primary_model: 'gemini-3-pro-preview',
    secondary_model: 'gemini-2.0-flash-exp',
    image_model: 'gemini-3-pro-image-preview',
  })

  const handleCreate = async () => {
    if (!formData.name || !formData.api_key) {
      alert('Name and API key are required')
      return
    }

    try {
      await secretsAPI.createProfile({
        name: formData.name,
        provider: formData.provider,
        api_key: formData.api_key,
        description: formData.description,
        model_config: {
          primary_model: formData.primary_model,
          secondary_model: formData.secondary_model,
          image_model: formData.image_model,
        },
      })
      onSuccess()
    } catch (err: any) {
      alert(err.message || 'Failed to create profile')
    }
  }

  return (
    <div className="border border-primary rounded-lg p-4 bg-primary/5">
      <h4 className="font-semibold mb-3">Create New Profile</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Gemini"
            className="w-full px-3 py-2 bg-background border border-input rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Personal API key"
            className="w-full px-3 py-2 bg-background border border-input rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
            className="w-full px-3 py-2 bg-background border border-input rounded-md"
          >
            <option value="google_gemini">Google Gemini</option>
            <option value="openai" disabled>OpenAI (Coming Soon)</option>
            <option value="anthropic" disabled>Anthropic (Coming Soon)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">API Key *</label>
          <input
            type="password"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2 bg-background border border-input rounded-md font-mono text-sm"
          />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Primary Model</label>
              <input
                type="text"
                value={formData.primary_model}
                onChange={(e) => setFormData({ ...formData, primary_model: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secondary Model</label>
              <input
                type="text"
                value={formData.secondary_model}
                onChange={(e) => setFormData({ ...formData, secondary_model: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image Model</label>
            <input
              type="text"
              value={formData.image_model}
              onChange={(e) => setFormData({ ...formData, image_model: e.target.value })}
              placeholder="gemini-3-pro-image-preview"
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreate}>
            Create Profile
          </Button>
        </div>
      </div>
    </div>
  )
}
