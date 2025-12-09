"""
Pytest configuration for DeckBot.

This project uses 'behave' for BDD tests, not pytest.
If you're trying to run tests, use: behave

This file exists to prevent pytest from scanning bundled dependencies
in the electron/ directory and to provide helpful error messages.
"""

import pytest
import sys


def pytest_collection_modifyitems(config, items):
    """
    Intercept pytest collection and provide helpful error message.
    This project uses behave for BDD tests, not pytest.
    """
    if not items:
        # No tests found - provide helpful message
        print("\n" + "=" * 70)
        print("⚠️  This project uses 'behave' for BDD tests, not pytest.")
        print("=" * 70)
        print("\nTo run tests, use:")
        print("  behave")
        print("\nFor integration tests (requires API key):")
        print("  ./run_integration_tests.sh")
        print("\nSee AGENTS.md for testing guidelines.")
        print("=" * 70 + "\n")
        pytest.exit("No pytest tests found. This project uses 'behave' for BDD tests.", returncode=0)


def pytest_configure(config):
    """
    Configure pytest to skip collection from electron/ directory.
    """
    # This is already handled by pyproject.toml, but we can add additional
    # configuration here if needed
    pass

