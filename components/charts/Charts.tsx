"use client";

import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const CHART_COLORS = ["#2c7e96", "#b98a2e", "#1e9558", "#d03a3a", "#2b7bd6", "#1a566a"];

interface ChartShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  height?: number;
}

function ChartShell({ title, subtitle, action, children, height = 280 }: ChartShellProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>{children}</div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "var(--shadow-raised)",
  padding: "8px 12px",
  fontSize: 12,
  fontFamily: "var(--font-ui)",
  direction: "rtl" as const,
};

export function RevenueAreaChart({
  data,
  title = "الإيرادات والمصروفات الشهرية",
  subtitle = "آخر 6 أشهر (بالريال السعودي)",
}: {
  data: { month: string; revenue: number; expenses: number }[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2c7e96" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2c7e96" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d03a3a" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#d03a3a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={50} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => (typeof v === "number" ? v.toLocaleString("ar-SA") : v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#2c7e96" fill="url(#revenueFill)" strokeWidth={2.5} />
          <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#d03a3a" fill="url(#expensesFill)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function BarChartCard({
  data,
  title,
  subtitle,
  dataKey,
  nameKey = "name",
  color = "#2c7e96",
}: {
  data: Record<string, string | number>[];
  title: string;
  subtitle?: string;
  dataKey: string;
  nameKey?: string;
  color?: string;
}) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey={nameKey} tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-sunken)" }} />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill={color} maxBarSize={46} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function PieChartCard({
  data,
  title,
  subtitle,
}: {
  data: { name: string; value: number }[];
  title: string;
  subtitle?: string;
}) {
  return (
    <ChartShell title={title} subtitle={subtitle}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function LineTrendChart({
  data,
  title,
  subtitle,
  dataKey,
  color = "#1e9558",
}: {
  data: Record<string, string | number>[];
  title: string;
  subtitle?: string;
  dataKey: string;
  color?: string;
}) {
  return (
    <ChartShell title={title} subtitle={subtitle} height={220}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
