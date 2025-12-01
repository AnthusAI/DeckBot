"""
Step definitions for semantic release feature tests.
"""
import os
from pathlib import Path
from behave import given, when, then

# Use tomllib from standard library (Python 3.11+) or tomli for older versions
try:
    import tomllib
except ImportError:
    import tomli as tomllib


@given('the project has semantic release configured')
def step_project_has_semantic_release(context):
    """Verify basic project structure exists."""
    context.project_root = Path(__file__).parent.parent.parent
    assert context.project_root.exists()


@when('I import the deckbot package')
def step_import_deckbot(context):
    """Import the deckbot package."""
    import deckbot
    context.deckbot = deckbot


@then('the version should be defined')
def step_version_defined(context):
    """Check that __version__ is defined."""
    assert hasattr(context.deckbot, '__version__')
    assert context.deckbot.__version__ is not None
    context.package_version = context.deckbot.__version__


@then('the version should match the pyproject.toml version')
def step_version_matches_pyproject(context):
    """Verify version matches pyproject.toml."""
    pyproject_path = context.project_root / 'pyproject.toml'
    with open(pyproject_path, 'rb') as f:
        pyproject_data = tomllib.load(f)
    
    pyproject_version = pyproject_data['project']['version']
    assert context.package_version == pyproject_version, \
        f"Package version {context.package_version} != pyproject.toml version {pyproject_version}"


@when('I read the pyproject.toml file')
def step_read_pyproject(context):
    """Read and parse pyproject.toml."""
    pyproject_path = context.project_root / 'pyproject.toml'
    with open(pyproject_path, 'rb') as f:
        context.pyproject_data = tomllib.load(f)


@then('it should contain semantic_release configuration')
def step_has_semantic_release_config(context):
    """Check for semantic_release tool configuration."""
    assert 'tool' in context.pyproject_data
    assert 'semantic_release' in context.pyproject_data['tool']
    context.semantic_release_config = context.pyproject_data['tool']['semantic_release']


@then('it should specify version_toml for pyproject.toml')
def step_has_version_toml(context):
    """Check that version_toml is configured."""
    assert 'version_toml' in context.semantic_release_config
    version_toml = context.semantic_release_config['version_toml']
    assert isinstance(version_toml, list)
    assert any('pyproject.toml' in entry for entry in version_toml)


@then('it should specify version_variables for __init__.py')
def step_has_version_variables(context):
    """Check that version_variables is configured."""
    assert 'version_variables' in context.semantic_release_config
    version_vars = context.semantic_release_config['version_variables']
    assert isinstance(version_vars, list)
    assert any('__init__.py:__version__' in entry for entry in version_vars)


@when('I check the .github/workflows directory')
def step_check_workflows_dir(context):
    """Check for GitHub workflows directory."""
    workflows_dir = context.project_root / '.github' / 'workflows'
    context.workflows_dir = workflows_dir
    assert workflows_dir.exists(), f"Workflows directory not found at {workflows_dir}"


@then('there should be a ci.yml file')
def step_has_ci_workflow(context):
    """Check for CI workflow file."""
    ci_file = context.workflows_dir / 'ci.yml'
    assert ci_file.exists(), f"CI workflow not found at {ci_file}"
    context.ci_workflow = ci_file.read_text()


@then('the workflow should have a test job')
def step_workflow_has_test_job(context):
    """Check that CI workflow has a test job."""
    assert 'jobs:' in context.ci_workflow
    assert 'test:' in context.ci_workflow
    assert 'behave' in context.ci_workflow


@then('the workflow should have a release job')
def step_workflow_has_release_job(context):
    """Check that CI workflow has a release job."""
    assert 'release:' in context.ci_workflow
    assert 'python-semantic-release' in context.ci_workflow


@when('I check the .github directory')
def step_check_github_dir(context):
    """Check for .github directory."""
    github_dir = context.project_root / '.github'
    context.github_dir = github_dir
    assert github_dir.exists(), f".github directory not found at {github_dir}"


@then('there should be a COMMIT_CONVENTION.md file')
def step_has_commit_convention(context):
    """Check for commit convention documentation."""
    commit_convention_file = context.github_dir / 'COMMIT_CONVENTION.md'
    assert commit_convention_file.exists(), \
        f"COMMIT_CONVENTION.md not found at {commit_convention_file}"
    context.commit_convention = commit_convention_file.read_text()


@then('it should describe conventional commits format')
def step_describes_conventional_commits(context):
    """Check that commit convention describes the format."""
    assert 'Conventional Commits' in context.commit_convention
    assert 'feat' in context.commit_convention
    assert 'fix' in context.commit_convention
    assert 'BREAKING CHANGE' in context.commit_convention


@when('I check the project root')
def step_check_project_root(context):
    """Project root is already set in background."""
    pass  # context.project_root already set in background


@then('there should be a CHANGELOG.md file')
def step_has_changelog(context):
    """Check for CHANGELOG.md file."""
    changelog_file = context.project_root / 'CHANGELOG.md'
    assert changelog_file.exists(), f"CHANGELOG.md not found at {changelog_file}"

