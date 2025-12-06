"""
Secrets management for DeckBot.

Stores provider profiles and API keys in a YAML dotfile (.deckbot.secrets.yaml).
NEVER commit this file to version control.
"""

import os
import yaml
import re
from typing import Any, Optional, Dict, List
from datetime import datetime


class SecretsManager:
    """Manages provider profiles and API keys stored in YAML format."""

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize secrets manager.

        Args:
            config_path: Path to secrets file. Defaults to .deckbot.secrets.yaml in project root.
        """
        if config_path:
            self.config_path = config_path
        else:
            # Default to project root (same directory as PreferencesManager)
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.config_path = os.path.join(project_root, '.deckbot.secrets.yaml')

        self._ensure_config_exists()

    def _ensure_config_exists(self):
        """Create secrets file with empty structure if it doesn't exist."""
        if not os.path.exists(self.config_path):
            defaults = {
                'active_profile': None,
                'profiles': {}
            }
            self._write_config(defaults)

    def _read_config(self) -> dict:
        """Read the secrets file."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
                return config if config else {'active_profile': None, 'profiles': {}}
        except Exception as e:
            print(f"Error reading secrets: {e}")
            return {'active_profile': None, 'profiles': {}}

    def _write_config(self, config: dict):
        """Write the secrets file."""
        try:
            with open(self.config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False, sort_keys=False)
        except Exception as e:
            print(f"Error writing secrets: {e}")

    def _slugify(self, name: str) -> str:
        """Convert a profile name to a slug."""
        slug = name.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '_', slug)
        return slug

    # Profile Management

    def list_profiles(self) -> List[Dict[str, Any]]:
        """
        Get all profiles.

        Returns:
            List of profile dictionaries (excluding API keys for security)
        """
        config = self._read_config()
        profiles = []
        for profile_id, profile in config.get('profiles', {}).items():
            profiles.append({
                'id': profile_id,
                'name': profile.get('name', profile_id),
                'description': profile.get('description', ''),
                'provider': profile.get('provider', 'google_gemini'),
                'created_at': profile.get('created_at', ''),
                'updated_at': profile.get('updated_at', ''),
                'model_config': profile.get('model_config', {}),
                'is_active': profile_id == config.get('active_profile')
            })
        return profiles

    def get_profile(self, profile_id: str, include_secrets: bool = True) -> Optional[Dict[str, Any]]:
        """
        Get a specific profile.

        Args:
            profile_id: Profile identifier (slug)
            include_secrets: Whether to include API keys (default True for backend use)

        Returns:
            Profile dictionary or None if not found
        """
        config = self._read_config()
        profile = config.get('profiles', {}).get(profile_id)

        if not profile:
            return None

        result = {
            'id': profile_id,
            'name': profile.get('name', profile_id),
            'description': profile.get('description', ''),
            'provider': profile.get('provider', 'google_gemini'),
            'created_at': profile.get('created_at', ''),
            'updated_at': profile.get('updated_at', ''),
            'model_config': profile.get('model_config', {}),
        }

        if include_secrets:
            result['api_key'] = profile.get('api_key', '')

        return result

    def create_profile(self, name: str, provider: str, api_key: str,
                      description: str = "", model_config: Optional[Dict] = None) -> str:
        """
        Create a new profile.

        Args:
            name: User-friendly profile name
            provider: Provider type (e.g., 'google_gemini')
            api_key: API key for this provider
            description: Optional description
            model_config: Optional model configuration (primary_model, secondary_model)

        Returns:
            Profile ID (slug)

        Raises:
            ValueError: If profile with this name already exists
        """
        profile_id = self._slugify(name)
        config = self._read_config()

        if profile_id in config.get('profiles', {}):
            raise ValueError(f"Profile '{name}' already exists")

        now = datetime.now().isoformat()
        profile = {
            'name': name,
            'description': description,
            'provider': provider,
            'api_key': api_key,
            'created_at': now,
            'updated_at': now,
            'model_config': model_config or {}
        }

        if 'profiles' not in config:
            config['profiles'] = {}

        config['profiles'][profile_id] = profile

        # If this is the first profile, make it active
        if not config.get('active_profile'):
            config['active_profile'] = profile_id

        self._write_config(config)
        return profile_id

    def update_profile(self, profile_id: str, name: Optional[str] = None,
                      description: Optional[str] = None, api_key: Optional[str] = None,
                      model_config: Optional[Dict] = None) -> bool:
        """
        Update an existing profile.

        Args:
            profile_id: Profile identifier
            name: New name (optional)
            description: New description (optional)
            api_key: New API key (optional)
            model_config: New model configuration (optional)

        Returns:
            True if updated, False if profile not found
        """
        config = self._read_config()

        if profile_id not in config.get('profiles', {}):
            return False

        profile = config['profiles'][profile_id]

        if name is not None:
            profile['name'] = name
        if description is not None:
            profile['description'] = description
        if api_key is not None:
            profile['api_key'] = api_key
        if model_config is not None:
            profile['model_config'] = model_config

        profile['updated_at'] = datetime.now().isoformat()

        self._write_config(config)
        return True

    def delete_profile(self, profile_id: str) -> bool:
        """
        Delete a profile.

        Args:
            profile_id: Profile identifier

        Returns:
            True if deleted, False if not found
        """
        config = self._read_config()

        if profile_id not in config.get('profiles', {}):
            return False

        del config['profiles'][profile_id]

        # If we deleted the active profile, clear it
        if config.get('active_profile') == profile_id:
            # Set to first remaining profile, or None
            remaining = list(config['profiles'].keys())
            config['active_profile'] = remaining[0] if remaining else None

        self._write_config(config)
        return True

    # Active Profile Management

    def get_active_profile(self, include_secrets: bool = True) -> Optional[Dict[str, Any]]:
        """
        Get the currently active profile.

        Returns:
            Active profile dictionary or None
        """
        config = self._read_config()
        active_id = config.get('active_profile')

        if not active_id:
            return None

        return self.get_profile(active_id, include_secrets=include_secrets)

    def set_active_profile(self, profile_id: str) -> bool:
        """
        Set the active profile.

        Args:
            profile_id: Profile identifier

        Returns:
            True if set, False if profile not found
        """
        config = self._read_config()

        if profile_id not in config.get('profiles', {}):
            return False

        config['active_profile'] = profile_id
        self._write_config(config)
        return True

    # Migration & Helper Methods

    def migrate_from_env(self) -> Optional[str]:
        """
        Migrate API key from .env file to a default profile.

        Returns:
            Profile ID if migration successful, None otherwise
        """
        # Check if we already have profiles
        config = self._read_config()
        if config.get('profiles'):
            return None  # Already migrated

        # Check for GOOGLE_API_KEY in environment
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            # Try deprecated GEMINI_API_KEY
            api_key = os.getenv('GEMINI_API_KEY')

        if not api_key:
            return None  # No key to migrate

        # Create default profile
        try:
            profile_id = self.create_profile(
                name="Default",
                provider="google_gemini",
                api_key=api_key,
                description="Migrated from .env file",
                model_config={
                    'primary_model': 'gemini-3-pro-preview',
                    'secondary_model': 'gemini-2.0-flash-exp',
                    'image_model': 'gemini-3-pro-image-preview'
                }
            )
            print(f"✓ Migrated API key from .env to profile '{profile_id}'")
            return profile_id
        except Exception as e:
            print(f"Error migrating from .env: {e}")
            return None

    def get_api_key_for_provider(self, provider: str = "google_gemini") -> Optional[str]:
        """
        Get API key for the active profile (convenience method).

        Args:
            provider: Provider type (for validation)

        Returns:
            API key or None
        """
        profile = self.get_active_profile(include_secrets=True)

        if not profile:
            return None

        if profile['provider'] != provider:
            print(f"Warning: Active profile is {profile['provider']}, not {provider}")
            return None

        return profile.get('api_key')
