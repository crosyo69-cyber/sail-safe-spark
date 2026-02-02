import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Core Web Vitals thresholds (Google's recommendations)
const thresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

type MetricName = keyof typeof thresholds;

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function formatValue(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

function logMetric(metric: Metric) {
  const rating = getRating(metric.name as MetricName, metric.value);
  const formattedValue = formatValue(metric.name, metric.value);
  
  const styles = {
    good: 'color: #0cce6b; font-weight: bold',
    'needs-improvement': 'color: #ffa400; font-weight: bold',
    poor: 'color: #ff4e42; font-weight: bold',
  };

  console.log(
    `%c[CWV] ${metric.name}: ${formattedValue} (${rating})`,
    styles[rating]
  );

  // Send to analytics if available
  sendToAnalytics(metric);
}

function sendToAnalytics(metric: Metric) {
  // Send to Google Analytics 4 if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Store metrics locally for debugging
  if (typeof window !== 'undefined') {
    const storedMetrics = JSON.parse(sessionStorage.getItem('cwv-metrics') || '{}');
    storedMetrics[metric.name] = {
      value: metric.value,
      rating: getRating(metric.name as MetricName, metric.value),
      timestamp: Date.now(),
    };
    sessionStorage.setItem('cwv-metrics', JSON.stringify(storedMetrics));
  }
}

export function initWebVitals() {
  // Only run in browser and production
  if (typeof window === 'undefined') return;

  // Log initialization
  console.log('%c[CWV] Core Web Vitals monitoring initialized', 'color: #0891b2; font-weight: bold');

  // Register all Core Web Vitals observers
  onCLS(logMetric);
  onFCP(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
}

// Helper to get current metrics summary
export function getWebVitalsReport(): Record<string, { value: number; rating: string }> | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem('cwv-metrics');
  return stored ? JSON.parse(stored) : null;
}

// Helper to check if all Core Web Vitals pass
export function areWebVitalsPassing(): boolean {
  const report = getWebVitalsReport();
  if (!report) return false;
  
  const coreMetrics = ['LCP', 'CLS', 'INP'];
  return coreMetrics.every(name => report[name]?.rating === 'good');
}
