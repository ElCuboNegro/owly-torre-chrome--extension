/**
 * Popup component - Quick stats and controls
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../shared/api/client';
import type { AnalyticsOverview } from '../shared/types/api';

export function Popup() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [serverHealthy, setServerHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Check server health
      try {
        await apiClient.checkHealth();
        setServerHealthy(true);
      } catch {
        setServerHealthy(false);
      }

      // Get queue stats from background
      const response = await chrome.runtime.sendMessage({
        type: 'GET_QUEUE_STATS',
      });
      setQueueStats(response);

      // Get analytics overview
      if (serverHealthy) {
        const data = await apiClient.getOverview(7);
        setOverview(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openDashboard() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html'),
    });
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Owly Analytics</h1>
        <div style={styles.status}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: serverHealthy ? '#4ade80' : '#ef4444',
            }}
          />
          <span style={styles.statusText}>
            {serverHealthy ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {queueStats && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Pending Sync</h2>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Total items:</span>
            <span style={styles.statValue}>{queueStats.total}</span>
          </div>
          <div style={styles.statSmall}>
            <span>Page views: {queueStats.pageViews}</span>
            <span>Interactions: {queueStats.interactions}</span>
            <span>Typed: {queueStats.typedContent}</span>
          </div>
        </div>
      )}

      {overview && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Last 7 Days</h2>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Time spent:</span>
            <span style={styles.statValue}>
              {overview.summary.totalTimeHours}h
            </span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Pages viewed:</span>
            <span style={styles.statValue}>{overview.summary.pageViews}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Interactions:</span>
            <span style={styles.statValue}>{overview.summary.interactions}</span>
          </div>
        </div>
      )}

      <button style={styles.button} onClick={openDashboard}>
        Open Dashboard
      </button>

      {!serverHealthy && (
        <div style={styles.warning}>
          ⚠️ Backend server not running. Start it with: cd backend && python -m
          app.main
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '320px',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    color: '#1f2937',
  },
  header: {
    marginBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '12px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563',
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  statLabel: {
    color: '#6b7280',
  },
  statValue: {
    fontWeight: '600',
  },
  statSmall: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  warning: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '4px',
    fontSize: '12px',
    lineHeight: '1.4',
  },
};
