# Contributing to Atlas

Thank you for your interest in contributing to the Atlas template system!

## Quick Start

1. **Fork & Clone**

   ```bash
   git clone https://github.com/your-username/atlas.git
   cd atlas
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Run Quality Checks**
   ```bash
   pnpm check-all
   ```

## Development Workflow

### Template Development

- Edit templates in the `templates/` directory
- Follow existing patterns and conventions
- Test your changes with `pnpm smoke:test`

### Adding Features

1. Create a feature branch from `develop`
2. Make your changes
3. Run `pnpm check-all` to ensure quality
4. Submit a pull request

## Available Scripts

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `pnpm validate`        | Validate template structure and integrity                |
| `pnpm smoke:test`      | Test template extraction and basic functionality         |
| `pnpm build:release`   | Generate release artifacts                               |
| `pnpm check-all`       | Run all quality checks (lint, typecheck, validate, test) |
| `pnpm clean:templates` | Clean template artifacts                                 |

## Code Quality

This project uses automated quality checks:

- **ESLint** - Code linting and style consistency
- **TypeScript** - Type checking and safety
- **Prettier** - Code formatting
- **Git Hooks** - Pre-commit quality gates
- **CI/CD** - Automated validation on pull requests

## Pull Request Guidelines

- Keep changes focused and atomic
- Add tests for new functionality
- Update documentation if needed
- Ensure all checks pass (`pnpm check-all`)
- Follow [conventional commits](https://conventionalcommits.org/) format

## Template Guidelines

When working on templates:

1. **Structure** - Follow established directory patterns
2. **Dependencies** - Use exact versions for consistency
3. **Documentation** - Update template-specific README files
4. **Testing** - Ensure templates can be extracted and run successfully

## Release Process

Releases are automated via semantic-release:

- Commits to `main` trigger automatic releases
- Version bumps based on conventional commit types
- Release artifacts generated and published to GitHub

## Getting Help

- **Documentation**: Check the [docs/](./docs/) directory
- **Issues**: [GitHub Issues](https://github.com/ordinarysh/atlas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ordinarysh/atlas/discussions)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
