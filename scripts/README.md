# PR Auto-Merge Tools

This directory contains tools to check Vercel build status and automatically merge PRs.

## ✅ Current Status

Both PR #8 and PR #9 have **passed** Vercel builds and are ready to merge:

- **PR #8**: ✅ Vercel build SUCCESS - [View deployment](https://vercel.com/yinlianghuis-projects/smart-track/ECUb1HMtUk7poteWiGwjpAptnBf7)
- **PR #9**: ✅ Vercel build SUCCESS - [View deployment](https://vercel.com/yinlianghuis-projects/smart-track/Bx1qYP7Z2dtRtH97NvwD9FJTCwXr)

## Options to Merge

### Option 1: Manual Merge (Simplest)

Since both PRs have passed all checks, you can merge them directly from GitHub:

1. Go to [PR #8](https://github.com/litantai/SmartTrack/pull/8)
2. Click "Merge pull request"
3. Go to [PR #9](https://github.com/litantai/SmartTrack/pull/9)
4. Click "Merge pull request"

### Option 2: Use the Node.js Script

If you have a GitHub Personal Access Token:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token_here

# Merge PR #8, then PR #9
node scripts/merge-prs.js 8 9
```

The script will:
1. Check each PR's Vercel build status
2. Verify the PR is mergeable
3. Merge the PR if all checks pass

### Option 3: Use GitHub Actions Workflow

A workflow has been created at `.github/workflows/auto-merge-on-vercel-success.yml`.

To use it:

1. Go to the [Actions tab](https://github.com/litantai/SmartTrack/actions)
2. Select "Auto-merge PRs on Vercel Success"
3. Click "Run workflow"
4. Enter PR numbers: `8,9`
5. Click "Run workflow"

The workflow will automatically check and merge the PRs in order.

## Files Created

- `.github/workflows/auto-merge-on-vercel-success.yml` - GitHub Actions workflow for automated merging
- `scripts/merge-prs.js` - Node.js script for checking and merging PRs
- `scripts/README.md` - This documentation

## How It Works

Both tools perform the same checks:

1. ✅ Verify PR is open
2. ✅ Verify PR is mergeable
3. ✅ Check Vercel build status is "success"
4. ✅ Check all other status checks pass
5. ✅ Merge the PR using squash merge

## Requirements

- **GitHub Actions**: Automatic, no setup needed (uses `GITHUB_TOKEN`)
- **Node.js Script**: Requires Node.js and a GitHub Personal Access Token with `repo` permissions

## Creating a GitHub Token

If you want to use the Node.js script:

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "SmartTrack PR Merge"
4. Select scopes: `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token and use it with the script

## Note

The current PR (#10) was created by the Copilot agent and includes these automation tools. Since the agent cannot directly merge PRs due to security constraints, you'll need to use one of the options above to merge PRs #8 and #9.
