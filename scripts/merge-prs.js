#!/usr/bin/env node

/**
 * Script to check Vercel build status and merge PRs
 * 
 * Usage:
 *   node scripts/merge-prs.js 8 9
 * 
 * Or set GITHUB_TOKEN environment variable:
 *   GITHUB_TOKEN=your_token node scripts/merge-prs.js 8 9
 */

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'litantai';
const REPO = 'SmartTrack';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.error('Usage: GITHUB_TOKEN=your_token node scripts/merge-prs.js 8 9');
  process.exit(1);
}

const prNumbers = process.argv.slice(2);

if (prNumbers.length === 0) {
  console.error('❌ Please provide PR numbers as arguments');
  console.error('Usage: node scripts/merge-prs.js 8 9');
  process.exit(1);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'SmartTrack-Merge-Script',
        'Accept': 'application/vnd.github.v3+json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkPRStatus(prNumber) {
  console.log('\n' + '='.repeat(50));
  console.log(`Checking PR #${prNumber}`);
  console.log('='.repeat(50));

  try {
    // Get PR details
    const pr = await makeRequest(`/repos/${OWNER}/${REPO}/pulls/${prNumber}`);
    
    console.log(`Title: ${pr.title}`);
    console.log(`State: ${pr.state}`);
    console.log(`Mergeable: ${pr.mergeable}`);
    console.log(`Merge State: ${pr.mergeable_state}`);

    if (pr.state !== 'open') {
      console.log(`❌ PR #${prNumber} is not open`);
      return false;
    }

    if (!pr.mergeable) {
      console.log(`❌ PR #${prNumber} is not mergeable`);
      return false;
    }

    // Get commit status
    const status = await makeRequest(`/repos/${OWNER}/${REPO}/commits/${pr.head.sha}/status`);
    
    console.log(`Overall Status: ${status.state}`);
    
    // Check for Vercel status
    const vercelStatus = status.statuses.find(s => 
      s.context.toLowerCase().includes('vercel')
    );

    if (!vercelStatus) {
      console.log('❌ No Vercel status check found');
      return false;
    }

    console.log(`Vercel Status: ${vercelStatus.state}`);
    console.log(`Vercel Description: ${vercelStatus.description}`);
    console.log(`Vercel URL: ${vercelStatus.target_url}`);

    if (vercelStatus.state !== 'success') {
      console.log(`❌ Vercel build has not succeeded (status: ${vercelStatus.state})`);
      return false;
    }

    if (status.state !== 'success') {
      console.log(`❌ Overall status is not success: ${status.state}`);
      const failedChecks = status.statuses.filter(s => s.state === 'failure' || s.state === 'error');
      if (failedChecks.length > 0) {
        console.log('Failed checks:');
        failedChecks.forEach(check => {
          console.log(`  - ${check.context}: ${check.state}`);
        });
      }
      return false;
    }

    console.log('✅ All checks passed');
    return true;
  } catch (error) {
    console.error(`❌ Error checking PR #${prNumber}:`, error.message);
    return false;
  }
}

async function mergePR(prNumber) {
  console.log(`\nMerging PR #${prNumber}...`);
  
  try {
    const result = await makeRequest(
      `/repos/${OWNER}/${REPO}/pulls/${prNumber}/merge`,
      'PUT',
      {
        commit_title: `Merge pull request #${prNumber}`,
        commit_message: 'Auto-merged after Vercel build success',
        merge_method: 'squash'
      }
    );

    console.log(`✅ Successfully merged PR #${prNumber}`);
    console.log(`Merge SHA: ${result.sha}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to merge PR #${prNumber}:`, error.message);
    return false;
  }
}

async function main() {
  console.log(`Starting merge process for PRs: ${prNumbers.join(', ')}`);
  
  const results = [];
  
  for (const prNumber of prNumbers) {
    const canMerge = await checkPRStatus(prNumber);
    
    if (canMerge) {
      const merged = await mergePR(prNumber);
      results.push({ pr: prNumber, status: merged ? 'merged' : 'failed' });
    } else {
      results.push({ pr: prNumber, status: 'not ready' });
    }
    
    // Wait a bit between PRs to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Summary');
  console.log('='.repeat(50));
  results.forEach(({ pr, status }) => {
    const icon = status === 'merged' ? '✅' : '❌';
    console.log(`${icon} PR #${pr}: ${status}`);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
