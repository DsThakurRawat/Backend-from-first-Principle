# Install: brew install gitleaks
# .git/hooks/pre-commit
gitleaks protect --staged --no-git -v
# Blocks commit if API keys, passwords, tokens detected in staged files
