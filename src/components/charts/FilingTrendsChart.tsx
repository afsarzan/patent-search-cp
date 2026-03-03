import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FilingTrendsChartProps {
  timeline: Array<{
    year: number;
    [key: string]: number | string;
  }>;
  searchLabels?: Record<string, string>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export const FilingTrendsChart = ({
  timeline,
  searchLabels = {},
}: FilingTrendsChartProps) => {
  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filing Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Extract search IDs from the first data point
  const searchIds = Object.keys(timeline[0])
    .filter((key) => key !== 'year')
    .map((key) => String(key));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filing Trends Over Time</CardTitle>
        <CardDescription>Patent filing volume by year across searches</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              type="number"
              label={{ value: 'Filing Year', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis label={{ value: 'Patent Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {searchIds.map((searchId, index) => (
              <Line
                key={searchId}
                type="monotone"
                dataKey={searchId}
                stroke={COLORS[index % COLORS.length]}
                name={searchLabels[searchId] || `Search ${index + 1}`}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
