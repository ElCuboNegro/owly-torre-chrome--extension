/**
 * Dashboard - Full analytics view
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../shared/api/client';
import type { AnalyticsOverview } from '../shared/types/api';

export function Dashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadData();
  }, [days]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await apiClient.getOverview(days);
      setOverview(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!overview) {
    return (
      <div style={styles.container}>
        <h1>Error loading data</h1>
        <p>Make sure the backend server is running.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Owly Analytics Dashboard</h1>
        <div style={styles.controls}>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={styles.select}
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </header>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Time</div>
          <div style={styles.statValue}>
            {overview.summary.totalTimeHours.toFixed(1)}h
          </div>
          <div style={styles.statSubtext}>
            Avg: {(overview.summary.avgSessionTime / 60).toFixed(0)} min/session
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Pages Viewed</div>
          <div style={styles.statValue}>{overview.summary.pageViews}</div>
          <div style={styles.statSubtext}>
            {Math.round(overview.summary.pageViews / days)} per day
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Interactions</div>
          <div style={styles.statValue}>{overview.summary.interactions}</div>
          <div style={styles.statSubtext}>
            {Math.round(overview.summary.interactions / days)} per day
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Sessions</div>
          <div style={styles.statValue}>{overview.summary.sessions}</div>
          <div style={styles.statSubtext}>
            {Math.round(overview.summary.sessions / days)} per day
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Top Domains</h2>
        <div style={styles.domainList}>
          {overview.topDomains.map((domain, index) => (
            <div key={domain.domain} style={styles.domainItem}>
              <div style={styles.domainRank}>{index + 1}</div>
              <div style={styles.domainName}>{domain.domain}</div>
              <div style={styles.domainTime}>
                {(domain.time / 3600).toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Showing data from {new Date(overview.startDate).toLocaleDateString()}{' '}
          to {new Date(overview.endDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    padding: '24px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  statSubtext: {
    fontSize: '13px',
    color: '#9ca3af',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  domainList: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  domainItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
  },
  domainRank: {
    width: '40px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#9ca3af',
  },
  domainName: {
    flex: 1,
    fontSize: '15px',
    color: '#1f2937',
  },
  domainTime: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#3b82f6',
  },
  footer: {
    marginTop: '48px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '13px',
    color: '#9ca3af',
  },
};
