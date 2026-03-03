import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AssigneeDistributionChartProps {
  assignees: Array<{
    assigneeName: string;
    [key: string]: number | string;
  }>;
  searchLabels?: Record<string, string>;
  topN?: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export const AssigneeDistributionChart = ({
  assignees,
  searchLabels = {},
  topN = 10,
}: AssigneeDistributionChartProps) => {
  if (!assignees || assignees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Assignees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const topAssignees = assignees.slice(0, topN).map((a) => ({
    ...a,
    // Truncate long names for better display
    assigneeName: a.assigneeName.length > 20 ? a.assigneeName.substring(0, 17) + '...' : a.assigneeName,
  }));

  // Extract search IDs from the first data point
  const searchIds = Object.keys(assignees[0])
    .filter((key) => key !== 'assigneeName')
    .map((key) => String(key));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Assignees</CardTitle>
        <CardDescription>Leading patent assignees by search (top {topN})</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={topAssignees}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="assigneeName" type="category" width={195} />
            <Tooltip />
            <Legend />
            {searchIds.map((searchId, index) => (
              <Bar
                key={searchId}
                dataKey={searchId}
                fill={COLORS[index % COLORS.length]}
                name={searchLabels[searchId] || `Search ${index + 1}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
