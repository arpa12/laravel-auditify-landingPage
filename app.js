/**
 * Auditify Landing Page Logic
 * Author: Arpa Nihan
 * Handles interactive simulations, configuration builder sync, log updates, mock graphs, and route searches.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Dark/Light Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.getElementById('theme-sun-icon');
    const moonIcon = document.getElementById('theme-moon-icon');
    
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            if (isLight) {
                localStorage.setItem('theme', 'light');
                if (sunIcon && moonIcon) {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                }
            } else {
                localStorage.setItem('theme', 'dark');
                if (sunIcon && moonIcon) {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            }
        });
    }

    // 1. Sticky Header
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            if (header) header.classList.add('scrolled');
        } else {
            if (header) header.classList.remove('scrolled');
        }
    });

    // 2. Click to Copy Snippets
    setupCopyButtons();

    // 3. Render Trend Chart on Mock Dashboard
    renderMockChart();

    // 4. Decoupled Log Modules Switching View
    setupModuleTabSelector();

    // 5. Configuration Configurator Code Sync
    setupConfigSync();

    // 6. Log Simulator State & Logic
    setupLogSimulator();

    // 7. Route & Command Table Search Filter
    setupRouteSearch();

    // 8. Frontend Event API Tabs Sync
    setupFrontendApiTabs();

    // 9. Manual Logging Facade Tabs Sync
    setupManualLoggingTabs();
});

/**
 * Setup clipboard click handling
 */
function setupCopyButtons() {
    const buttons = document.querySelectorAll('.copy-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;

            let textToCopy = targetElement.innerText || targetElement.textContent;
            
            // Clean up prompt characters from terminal snippet copy if any
            if (btn.classList.contains('terminal-copy')) {
                textToCopy = textToCopy.replace(/^\$\s*/gm, '');
            }

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    Copied!
                `;
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    });
}

/**
 * Render dynamic custom graph on canvas
 */
function renderMockChart() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set appropriate dimensions for high resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Sample dataset (7-day counts)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const actionLogs = [45, 62, 55, 95, 70, 30, 42];
    const activityLogs = [120, 150, 140, 210, 180, 95, 110];

    const padding = { top: 15, right: 10, bottom: 20, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get scales
    const maxVal = 250;
    const getX = (index) => padding.left + (index / (days.length - 1)) * chartWidth;
    const getY = (val) => padding.top + chartHeight - (val / maxVal) * chartHeight;

    // Draw Grid Lines (Y axis)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const yVal = (i / 4) * maxVal;
        const y = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Draw scale values
        ctx.fillStyle = '#64748b';
        ctx.font = '9px system-ui';
        ctx.fillText(Math.round(yVal), 5, y + 3);
    }

    // Draw X labels
    days.forEach((day, index) => {
        const x = getX(index);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(day, x, height - 5);
    });

    // Draw Actions Line (Red)
    drawChartLine(ctx, actionLogs, getX, getY, '#FF2D20', 'rgba(255, 45, 32, 0.1)');
    // Draw Activities Line (Teal)
    drawChartLine(ctx, activityLogs, getX, getY, '#00F2FE', 'rgba(0, 242, 254, 0.08)');
}

function drawChartLine(ctx, data, getX, getY, strokeColor, fillColor) {
    // Fill background area
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(0));
    data.forEach((val, index) => {
        ctx.lineTo(getX(index), getY(val));
    });
    ctx.lineTo(getX(data.length - 1), getY(0) + (getY(0) - getY(data[data.length - 1]))); // back to bottom
    ctx.lineTo(getX(0), getY(0) + (getY(0) - getY(data[0])));
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Draw Stroke Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    data.forEach((val, index) => {
        // Curve to make it look smooth
        if (index > 0) {
            const cpX1 = getX(index - 1) + (getX(index) - getX(index - 1)) / 2;
            const cpY1 = getY(data[index - 1]);
            const cpX2 = cpX1;
            const cpY2 = getY(val);
            ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, getX(index), getY(val));
        } else {
            ctx.lineTo(getX(index), getY(val));
        }
    });
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw points
    data.forEach((val, index) => {
        ctx.beginPath();
        ctx.arc(getX(index), getY(val), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        ctx.strokeStyle = '#0b1120';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
}

/**
 * Handle Tab switches for Decoupled Log Modules
 */
function setupModuleTabSelector() {
    const tabs = document.querySelectorAll('.module-tab-btn');
    const displayCard = document.getElementById('module-showcase-card');

    const moduleData = {
        action: {
            title: 'Action Logs (ActionLog)',
            table: 'audit_action_logs',
            desc: 'Records detailed changes whenever your Eloquent models are created, updated, or deleted. Ideal for strict compliance tracking, operational auditing, and rolling back unexpected alterations.',
            attributes: ['action_type', 'model_type', 'model_id', 'old_values', 'new_values', 'user_id', 'ip_address', 'user_agent', 'url'],
            code: `<?php

namespace Auditify\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class ActionLog extends Model
{
    protected $table = 'audit_action_logs';

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
    ];
}`
        },
        activity: {
            title: 'Activity Logs (ActivityLog)',
            table: 'audit_activity_logs',
            desc: 'Tracks user navigation routes, session events, page visits, authentication states (logins, logouts), and client-side interactions. Perfect for tracking user pathways and understanding user flow.',
            attributes: ['event_name', 'description', 'user_id', 'ip_address', 'user_agent', 'url', 'referer_url'],
            code: `<?php

namespace Auditify\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class ActivityLog extends Model
{
    protected $table = 'audit_activity_logs';
}`
        },
        security: {
            title: 'Security Logs (SecurityLog)',
            table: 'audit_security_logs',
            desc: 'Captures malicious inputs blocked by the XSS firewall, failed authentications, or security rule violations flagged by the Real-Time Threat Engine. Stores security threat classifications for analysis.',
            attributes: ['title', 'severity', 'description', 'user_id', 'ip_address', 'user_agent', 'url', 'is_read'],
            code: `<?php

namespace Auditify\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class SecurityLog extends Model
{
    protected $table = 'audit_security_logs';

    protected $casts = [
        'is_read' => 'boolean',
    ];
}`
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const key = tab.getAttribute('data-module');
            const data = moduleData[key];

            // Render details card dynamically with premium details
            displayCard.innerHTML = `
                <div class="module-meta">
                    <span class="badge badge-secondary">Table: ${data.table}</span>
                    <h3 style="margin-top: 1rem;"><span style="color: var(--brand-secondary);">■</span> ${data.title}</h3>
                    <p>${data.desc}</p>
                    <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-primary); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Captured Attributes:</h4>
                    <div class="module-attributes-list">
                        ${data.attributes.map(attr => `<span class="attr-tag">${attr}</span>`).join('')}
                    </div>
                </div>
                <div class="terminal-window">
                    <div class="terminal-header">
                        <div class="terminal-dots">
                            <span class="terminal-dot red"></span>
                            <span class="terminal-dot yellow"></span>
                            <span class="terminal-dot green"></span>
                        </div>
                        <span class="terminal-title">Auditify\\Models\\${key.charAt(0).toUpperCase() + key.slice(1)}Log.php</span>
                    </div>
                    <div class="terminal-body" style="padding: 1rem 1.25rem;">
                        <pre style="margin: 0; color: #a6accd;"><code class="php-code">${highlightPHPCode(data.code)}</code></pre>
                    </div>
                </div>
            `;
        });
    });
}

/**
 * Super lightweight PHP syntax highlighter for interactive code snippets
 */
function highlightPHPCode(code) {
    return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/(\&lt;\?php)/g, '<span class="code-keyword">$1</span>')
        .replace(/\b(namespace|use|class|extends|protected|public|function|return)\b/g, '<span class="code-keyword">$1</span>')
        .replace(/(\'.*?\')/g, '<span class="code-string">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/g, '<span class="code-comment">$1</span>')
        .replace(/(\b[a-zA-Z_]\w*\b)(?=\s*::|\s*\\)/g, '<span class="code-class">$1</span>')
        .replace(/(\$[a-zA-Z_]\w*\b)/g, '<span class="code-variable">$1</span>')
        .replace(/(\b\w+)(?=\()/g, '<span class="code-func">$1</span>')
        .replace(/\b(true|false)\b/g, '<span class="code-boolean">$1</span>')
        .replace(/(\b\d+\b)/g, '<span class="code-number">$1</span>');
}

/**
 * Handle Configuration Panel Toggles & Code Update Sync
 */
function setupConfigSync() {
    const inputs = {
        routePrefix: document.getElementById('cfg-route-prefix'),
        theme: document.getElementById('cfg-theme'),
        trackIp: document.getElementById('cfg-track-ip'),
        trackUa: document.getElementById('cfg-track-ua'),
        trackAuth: document.getElementById('cfg-track-auth'),
        xssEnabled: document.getElementById('cfg-xss-enabled'),
        xssBlock: document.getElementById('cfg-xss-block'),
        keepDays: document.getElementById('cfg-keep-days')
    };

    const codeSnippet = document.getElementById('config-code-preview');
    const editorTabs = document.querySelectorAll('.editor-tab');

    // Function to generate content based on active file tab
    let activeTabFile = 'config';

    const updateConfigCode = () => {
        if (activeTabFile === 'config') {
            const prefix = inputs.routePrefix.value || 'auditify';
            const theme = inputs.theme.value || 'dark';
            const ip = inputs.trackIp.checked ? 'true' : 'false';
            const ua = inputs.trackUa.checked ? 'true' : 'false';
            const auth = inputs.trackAuth.checked ? 'true' : 'false';
            const xss = inputs.xssEnabled.checked ? 'true' : 'false';
            const xssBlk = inputs.xssBlock.checked ? 'true' : 'false';
            const days = inputs.keepDays.value || '90';

            const configCode = `<?php

return [
    // Base URL route prefix: https://your-domain.com/${prefix}
    'route_prefix' => '${prefix}',

    // Dashboard visual layout theme: '${theme}'
    'theme' => '${theme}',

    // Middlewares applied to the dashboard routes
    'middleware' => [
        'web',
    ],

    // Log entries shown per page
    'pagination' => 20,

    // Track details
    'track_ip' => ${ip},
    'track_user_agent' => ${ua},
    'track_url' => true,

    // Authorization configuration
    'authorization' => [
        'enabled' => false,
        'gate' => 'view-auditify',
    ],

    // Automatic tracking configurations
    'track_auth_events' => ${auth}, 
    'track_page_visits' => true, 

    // Firewall scanning
    'xss_protection' => [
        'enabled' => ${xss},
        'block' => ${xssBlk},         // Abort requests with HTTP 403 when script is found
        'exclude_routes' => [
            // 'admin/rich-text/*',
        ],
    ],

    // Pruning configuration
    'pruning' => [
        'keep_days' => ${days},       // Default age in days for keeping historical rows
    ],
];`;
            codeSnippet.innerHTML = highlightPHPCode(configCode);
        } else if (activeTabFile === 'model') {
            const modelCode = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Auditify\\Traits\\Auditable;

class Product extends Model
{
    use Auditable; // Auditify tracks changes in this model automatically
}`;
            codeSnippet.innerHTML = highlightPHPCode(modelCode);
        } else if (activeTabFile === 'gate') {
            const gateCode = `<?php

use Auditify\\Facades\\Auditify;

public function boot()
{
    // Restrict dashboard to Super Admins only
    Auditify::auth(function ($request) {
        return $request->user() && $request->user()->hasRole('super-admin');
    });
}`;
            codeSnippet.innerHTML = highlightPHPCode(gateCode);
        } else if (activeTabFile === 'prune') {
            const pruneCode = `<?php

// routes/console.php or app/Console/Kernel.php
use Illuminate\\Support\Facades\\Schedule;

// Automate auditing database table cleaning
Schedule::command('auditify:prune --days=90')->daily();`;
            codeSnippet.innerHTML = highlightPHPCode(pruneCode);
        }
    };

    // Listen to all inputs for configuration
    Object.values(inputs).forEach(input => {
        if (input.type === 'checkbox') {
            input.addEventListener('change', updateConfigCode);
        } else {
            input.addEventListener('input', updateConfigCode);
        }
    });

    // Listen to tab switching
    editorTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            editorTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTabFile = tab.getAttribute('data-file');
            
            // Adjust file title in editor top
            const titleBar = document.getElementById('editor-file-title');
            if (activeTabFile === 'config') titleBar.innerText = 'config/auditify.php';
            else if (activeTabFile === 'model') titleBar.innerText = 'app/Models/Product.php';
            else if (activeTabFile === 'gate') titleBar.innerText = 'app/Providers/AppServiceProvider.php';
            else if (activeTabFile === 'prune') titleBar.innerText = 'routes/console.php';

            updateConfigCode();
        });
    });

    // Initial render
    updateConfigCode();
}

/**
 * Log Simulator Sandbox Logic
 */
function setupLogSimulator() {
    const dbMonitorBody = document.getElementById('db-monitor-body');
    const simulationTabs = document.querySelectorAll('[data-monitor-tab]');
    const xssOverlay = document.getElementById('xss-block-overlay');
    const closeXssBtn = document.getElementById('close-xss-btn');
    const notification = document.getElementById('critical-security-alert');
    const notificationText = document.getElementById('critical-alert-text');
    const closeNotifyBtn = document.getElementById('close-alert-btn');

    // Counts for Dashboard Stats Header (Real-time updates)
    const metrics = {
        action: document.getElementById('mock-action-count'),
        activity: document.getElementById('mock-activity-count'),
        security: document.getElementById('mock-security-count')
    };

    let counts = {
        action: 1482,
        activity: 8493,
        security: 42
    };

    // Filter type
    let currentMonitorFilter = 'all';

    // Mock logs memory database
    const databaseLogs = [
        {
            type: 'activity',
            time: '2 mins ago',
            badge: 'GET',
            payload: `URL: https://domain.com/dashboard\nUser ID: 12\nIP: 192.168.1.58\nUA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0`
        },
        {
            type: 'action',
            time: '5 mins ago',
            badge: 'UPDATE',
            payload: `Model: App\\Models\\User\nModel ID: 12\nAttributes:\n- old_values: {"theme":"light"}\n- new_values: {"theme":"dark"}\nIP: 192.168.1.58`
        },
        {
            type: 'security',
            time: '12 mins ago',
            badge: 'HIGH',
            payload: `Alert: Sensitive Module Modified\nDescription: User 4 modified App\\Models\\Setting configuration properties.\nIP: 192.168.1.201`
        }
    ];

    // Helper to insert a log entry to memory and update visual display
    const insertLog = (type, badgeText, payloadText) => {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newLog = {
            type: type,
            time: timeNow,
            badge: badgeText,
            payload: payloadText
        };
        databaseLogs.unshift(newLog); // Prepend to history

        // Increment count
        counts[type]++;
        if (metrics[type]) {
            metrics[type].innerText = counts[type].toLocaleString();
        }

        renderMonitorLogs();
    };

    // Render the logs screen based on currentMonitorFilter
    const renderMonitorLogs = () => {
        dbMonitorBody.innerHTML = '';
        
        const filtered = databaseLogs.filter(log => {
            if (currentMonitorFilter === 'all') return true;
            return log.type === currentMonitorFilter;
        });

        if (filtered.length === 0) {
            dbMonitorBody.innerHTML = '<div style="color: var(--text-muted); text-align: center; margin-top: 3rem;">No audit logs in this database module table.</div>';
            return;
        }

        filtered.forEach(log => {
            const el = document.createElement('div');
            el.className = 'log-entry';
            if (log.type === 'security') el.className += ' unread';
            
            const badgeClass = log.badge.toLowerCase();
            
            el.innerHTML = `
                <div class="log-entry-header">
                    <span class="mock-badge ${badgeClass}">${log.badge}</span>
                    <span class="log-time">${log.time}</span>
                </div>
                <div class="log-payload">${escapeHTML(log.payload)}</div>
            `;
            dbMonitorBody.appendChild(el);
        });
    };

    // Helper to escape tags
    const escapeHTML = (str) => {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    // Monitor tabs selection click
    simulationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            simulationTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMonitorFilter = tab.getAttribute('data-monitor-tab');
            renderMonitorLogs();
        });
    });

    // ACTION SIMULATOR 1: Update Profile Action
    const nameInput = document.getElementById('sim-name');
    const updateProfileBtn = document.getElementById('sim-update-btn');

    let cachedName = "John Doe";
    updateProfileBtn.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        if (!newName) return;
        if (newName === cachedName) {
            alert("Please input a different name to simulate a model update audit log.");
            return;
        }

        const payload = `Model: App\\Models\\User\nModel ID: 88 (Authenticated User)\nAction: UPDATE\nAttributes Difference:\n- old_values: {"name": "${cachedName}"}\n- new_values: {"name": "${newName}"}\nURL: https://domain.com/user/profile/update\nIP: 192.168.1.1\nUser Agent: Chrome/124.0.0`;
        
        insertLog('action', 'UPDATE', payload);
        cachedName = newName;

        // Auto shift database view tab to "Action Logs" or "All"
        triggerTabSwitch('action');
    });

    // ACTION SIMULATOR 2: Click to Download Activity
    const downloadBtn = document.getElementById('sim-download-btn');
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const payload = `Event: Frontend Interaction (API)\nName: File Download\nDescription: User downloaded the User_Guide.pdf document\nRoute Endpoint: /auditify/api/events\nIP: 192.168.1.1\nUA: Chrome/124.0.0\nStatus: Associated to Session user_id 88`;
        
        insertLog('activity', 'POST', payload);
        triggerTabSwitch('activity');
    });

    // ACTION SIMULATOR 3: Security Logs / Mass Delete click
    const deleteBtn = document.getElementById('sim-delete-btn');
    const deleteClickCounter = document.getElementById('delete-click-count');
    let deleteClicks = 0;
    let lastDeleteTime = 0;

    deleteBtn.addEventListener('click', () => {
        const timeNow = Date.now();
        
        // Reset counter if more than 5 seconds pass
        if (timeNow - lastDeleteTime > 5000) {
            deleteClicks = 0;
        }

        deleteClicks++;
        lastDeleteTime = timeNow;
        
        if (deleteClicks < 5) {
            deleteClickCounter.innerText = `(${deleteClicks} clicks - click rapid 5 times!)`;
            // Log as simple delete action in action log
            const payload = `Model: App\\Models\\Product\nModel ID: ${100 + deleteClicks}\nAction: DELETE\nAttributes Deleted:\n- old_values: {"sku": "PRD-00${deleteClicks}", "stock": 4}\nIP: 192.168.1.1`;
            insertLog('action', 'DELETE', payload);
        } else {
            // Trigger Critical Security alert threat engine!
            deleteClickCounter.innerText = '';
            deleteClicks = 0;

            const payload = `Alert Triggered: Mass Delete Shield\nSeverity: CRITICAL\nDescription: User deleted 5 records within a single model (App\\Models\\Product) in less than 5 minutes.\nIP: 192.168.1.1\nUser Agent: Chrome/124.0.0`;
            insertLog('security', 'CRITICAL', payload);

            // Pop warning modal alert
            showNotification('CRITICAL SECURITY ALERT', 'Mass Delete Shield Triggered! User 88 deleted 5 records in App\\Models\\Product within 5 seconds. Logged into audit_security_logs.');
            triggerTabSwitch('security');
        }
    });

    // ACTION SIMULATOR 4: Security Logs / XSS injection protection
    const xssInput = document.getElementById('sim-xss-input');
    const xssSubmitBtn = document.getElementById('sim-xss-btn');

    xssSubmitBtn.addEventListener('click', () => {
        const inputVal = xssInput.value.trim();
        if (!inputVal) return;

        // Simple check for standard XSS patterns
        const xssPattern = /<script>|javascript:|onerror=|onload=|<img|<svg/i;

        if (xssPattern.test(inputVal)) {
            // Trigger XSS Block screen!
            xssOverlay.style.display = 'flex';

            // Add Critical log
            const payload = `Alert Triggered: XSS Attack Attempt Blocked\nSeverity: CRITICAL\nDescription: Script tag or HTML injection detected in parameter: "profile_bio" with value: "${inputVal}". Request aborted with 403.\nIP: 192.168.1.1\nUser Agent: Chrome/124.0.0`;
            insertLog('security', 'CRITICAL', payload);
            
            xssInput.value = ''; // clear input
            
            setTimeout(() => {
                triggerTabSwitch('security');
            }, 300);
        } else {
            // Log as simple normal activity or profile edit
            const payload = `Model: App\\Models\\User\nAction: UPDATE\nAttributes:\n- old_values: {"bio": ""}\n- new_values: {"bio": "${inputVal}"}\nIP: 192.168.1.1`;
            insertLog('action', 'UPDATE', payload);
            xssInput.value = ''; // clear input
            triggerTabSwitch('action');
        }
    });

    // Close overlays
    closeXssBtn.addEventListener('click', () => {
        xssOverlay.style.display = 'none';
    });

    closeNotifyBtn.addEventListener('click', () => {
        notification.style.display = 'none';
    });

    // Helper functions
    const showNotification = (title, text) => {
        notificationText.innerHTML = `<strong>${title}:</strong> ${text}`;
        notification.style.display = 'block';
        
        // Hide notification after 8 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 8000);
    };

    const triggerTabSwitch = (type) => {
        const tabToClick = document.querySelector(`[data-monitor-tab="${type}"]`);
        if (tabToClick) tabToClick.click();
    };

    // Initial log renders
    renderMonitorLogs();
}

/**
 * Route & Command Reference table filter search
 */
function setupRouteSearch() {
    const searchInput = document.getElementById('route-search');
    const tableRows = document.querySelectorAll('#routes-table-body tr');

    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const val = searchInput.value.toLowerCase().trim();

        tableRows.forEach(row => {
            const methodText = row.children[0].innerText.toLowerCase();
            const uriText = row.children[1].innerText.toLowerCase();
            const actionText = row.children[2].innerText.toLowerCase();
            const descText = row.children[3].innerText.toLowerCase();

            if (methodText.includes(val) || uriText.includes(val) || actionText.includes(val) || descText.includes(val)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

/**
 * Handle tab switches and code generation for Frontend Event API Integration
 */
function setupFrontendApiTabs() {
    const tabs = document.querySelectorAll('#api-snippet-tabs .editor-tab');
    const codeSnippet = document.getElementById('api-code-preview');
    const titleBar = document.getElementById('api-file-title');
    
    if (!tabs.length || !codeSnippet || !titleBar) return;

    const apiCodeTemplates = {
        js: {
            title: 'logEvent.js',
            code: `function logEvent(eventName, description) {
    fetch('/auditify/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
            event_name: eventName,
            description: description
        })
    })
    .then(response => response.json())
    .then(data => console.log('Event logged:', data))
    .catch(error => console.error('Error logging event:', error));
}`
        },
        react: {
            title: 'UpgradeButton.jsx',
            code: `import React, { useState } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
const AUDITIFY_API_URL = 'http://localhost:8000/auditify/api/events';

export default function UpgradeButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await axios.post(AUDITIFY_API_URL, {
                event_name: 'Upgrade Plan Clicked',
                description: 'User initiated subscription upgrade to Gold tier.'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            });
            alert('Plan upgraded successfully and logged in Auditify!');
        } catch (error) {
            console.error('Error logging event:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button onClick={handleUpgrade} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Upgrade to Gold Plan 🚀'}
        </button>
    );
}`
        },
        vue: {
            title: 'UpgradeButton.vue',
            code: `<template>
  <div class="pricing-card">
    <button @click="handleUpgrade" :disabled="isLoading">
      {{ isLoading ? 'Processing...' : 'Upgrade to Gold Plan 🚀' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const isLoading = ref(false);
const AUDITIFY_API_URL = 'http://localhost:8000/auditify/api/events';

const handleUpgrade = async () => {
  isLoading.value = true;
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const response = await fetch(AUDITIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      body: JSON.stringify({
        event_name: 'Upgrade Plan Clicked',
        description: 'User initiated subscription upgrade to Gold tier in Vue application.'
      })
    });
    if (response.ok) {
      alert('Plan upgraded successfully and logged in Auditify!');
    }
  } catch (error) {
    console.error('Network error attempting to log event:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>`
        }
    };

    const updateSnippet = (key) => {
        const data = apiCodeTemplates[key];
        titleBar.innerText = data.title;
        codeSnippet.innerHTML = highlightJSCode(data.code);
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const key = tab.getAttribute('data-api-tab');
            updateSnippet(key);
        });
    });

    updateSnippet('js'); // Initial render
}

/**
 * Handle tab switches and code generation for Manual Logging and Helpers
 */
function setupManualLoggingTabs() {
    const tabs = document.querySelectorAll('#manual-snippet-tabs .editor-tab');
    const codeSnippet = document.getElementById('manual-code-preview');
    const titleBar = document.getElementById('manual-file-title');
    
    if (!tabs.length || !codeSnippet || !titleBar) return;

    const manualCodeTemplates = {
        action: {
            title: 'OrderController.php',
            code: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Order;
use Auditify\\Facades\\Auditify;

class OrderController extends Controller
{
    public function cancel($id)
    {
        $order = Order::findOrFail($id);
        $oldStatus = $order->status;

        $order->update(['status' => 'cancelled']);

        // Manually Log database action status transition
        Auditify::logAction(
            action: 'CANCEL_ORDER',
            module: 'Order',
            description: "Order #{$order->id} was cancelled by administrator.",
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => 'cancelled'],
            userId: auth()->id(),
            subject: $order
        );
    }
}`
        },
        activity: {
            title: 'DownloadController.php',
            code: `<?php

namespace App\\Http\\Controllers;

use Auditify\\Facades\\Auditify;

class DownloadController extends Controller
{
    public function downloadGuide()
    {
        // Manually Log specific general user activity for dashboard stats
        Auditify::logActivity(
            activity: 'Exported Reports (PDF)',
            url: request()->fullUrl(),
            userId: auth()->id(),
            properties: ['timeframe' => '30_days']
        );

        return response()->download(storage_path('guides/User_Guide.pdf'));
    }
}`
        },
        security: {
            title: 'SecurityCheck.php',
            code: `<?php

use Auditify\\Facades\\Auditify;

// Log custom threat metrics or suspicious behaviors directly to firewall logs
Auditify::logSecurity(
    title: 'Suspicious Endpoint Access',
    description: 'Blocked access attempt to restricted legacy endpoint',
    severity: 'high', // options: low, medium, high, critical
    payload: request()->all()
);`
        },
        pause: {
            title: 'DatabaseSeeder.php',
            code: `<?php

namespace Database\\Seeders;

use Illuminate\\Database\\Seeder;
use App\\Models\\Article;
use Auditify\\Facades\\Auditify;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Pauses auditing automatically for the duration of the callback function
        // Prevents database write congestion, performance lags, and seeder log spam
        Auditify::withoutAuditing(function () {
            Article::factory()->count(1000)->create();
        });
    }
}`
        }
    };

    const updateSnippet = (key) => {
        const data = manualCodeTemplates[key];
        titleBar.innerText = data.title;
        codeSnippet.innerHTML = highlightPHPCode(data.code);
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const key = tab.getAttribute('data-manual-tab');
            updateSnippet(key);
        });
    });

    updateSnippet('action'); // Initial render
}

/**
 * Super lightweight JS/HTML syntax highlighter for frontend api code snippets
 */
function highlightJSCode(code) {
    return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\b(import|export|default|function|const|let|var|await|async|try|catch|finally|return|from|new|true|false|if|else|throw)\b/g, '<span class="code-keyword">$1</span>')
        .replace(/(\'.*?\'|\".*?\"|`[\s\S]*?`)/g, '<span class="code-string">$1</span>')
        .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
        .replace(/(\b[A-Z]\w*\b)/g, '<span class="code-class">$1</span>')
        .replace(/(\b\w+)(?=\()/g, '<span class="code-func">$1</span>')
        .replace(/(\b\d+\b)/g, '<span class="code-number">$1</span>');
}
