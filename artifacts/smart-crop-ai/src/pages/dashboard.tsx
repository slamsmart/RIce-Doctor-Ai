import { 
  useGetScansSummary, 
  useGetScansByCountry, 
  useGetScansByDisease,
  useGetRecentScans
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { format } from "date-fns";
import { ShieldAlert, TrendingUp, Users, ScanLine, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetScansSummary();
  const { data: countryData, isLoading: isCountryLoading } = useGetScansByCountry();
  const { data: diseaseData, isLoading: isDiseaseLoading } = useGetScansByDisease();
  const { data: recentScans, isLoading: isRecentLoading } = useGetRecentScans();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Regional Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time monitoring of crop health and disease prevalence across ASEAN.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
            <ScanLine className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.totalScans.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" /> +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Severe Cases</CardTitle>
            <ShieldAlert className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold text-destructive">{summary?.severeCases.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Requiring immediate intervention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg AI Confidence</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.avgConfidence.toFixed(1)}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Diagnostic accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Farmers Reached</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{Math.floor((summary?.totalScans || 0) * 0.8).toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Estimated unique users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scans by Country</CardTitle>
            <CardDescription>Volume of activity across monitored regions</CardDescription>
          </CardHeader>
          <CardContent>
            {isCountryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="country" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disease Distribution</CardTitle>
            <CardDescription>Most common detected issues</CardDescription>
          </CardHeader>
          <CardContent>
            {isDiseaseLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diseaseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="disease"
                    >
                      {diseaseData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', textTransform: 'capitalize' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/3 flex flex-col justify-center gap-3">
                  {diseaseData?.slice(0, 5).map((entry, index) => (
                    <div key={entry.disease} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate capitalize" title={entry.disease.replace("_", " ")}>
                        {entry.disease.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Critical Alerts</CardTitle>
          <CardDescription>Scans flagged as severe requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isRecentLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : recentScans?.filter(s => s.severity === 'severe').length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No severe cases recently detected.</div>
            ) : (
              recentScans?.filter(s => s.severity === 'severe').slice(0, 5).map(scan => (
                <div key={scan.id} className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{scan.detectedDisease?.replace("_", " ")} in {scan.cropType.replace("_", " ")}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{scan.region}, {scan.country}</span>
                        <span>•</span>
                        <span>{format(new Date(scan.createdAt), 'MMM d HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
