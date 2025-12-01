# Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This enables automated versioning and changelog generation.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of the following:

* **feat**: A new feature (triggers MINOR version bump)
* **fix**: A bug fix (triggers PATCH version bump)
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests or correcting existing tests
* **build**: Changes that affect the build system or external dependencies
* **ci**: Changes to CI configuration files and scripts
* **chore**: Other changes that don't modify src or test files
* **revert**: Reverts a previous commit

### Breaking Changes

**BREAKING CHANGE**: in the commit body or footer triggers a MAJOR version bump.

Example:
```
feat(api)!: remove deprecated endpoint

BREAKING CHANGE: The /api/v1/old endpoint has been removed. Use /api/v2/new instead.
```

## Examples

### Feature
```
feat(image-gen): add batch tracking for image generation

Implements unique batch slugs for each image generation request
to enable better context tracking and user workflow.
```

### Bug Fix
```
fix(templates): ensure context.current_presentation is set

Fixes AttributeError when creating presentations from templates
by setting context.current_presentation in all creation steps.
```

### Breaking Change
```
feat(cli)!: change presentation root environment variable

BREAKING CHANGE: VIBE_PRESENTATION_ROOT is now required instead of optional.
Update your environment configuration accordingly.
```

## Why We Use This

1. **Automated Versioning**: Semantic Release automatically determines version numbers based on commit types
2. **Automated Changelogs**: CHANGELOG.md is automatically generated from commit messages
3. **Clear History**: Standardized format makes it easy to understand what changed and why
4. **Better Collaboration**: Team members know exactly what to expect from commit messages

## Resources

* [Conventional Commits Specification](https://www.conventionalcommits.org/)
* [Semantic Versioning](https://semver.org/)
* [Python Semantic Release](https://python-semantic-release.readthedocs.io/)
