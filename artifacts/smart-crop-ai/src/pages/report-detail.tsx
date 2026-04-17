import { useRoute, Link } from "wouter";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function ReportDetail() {
  const [, params] = useRoute("/reports/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: report, isLoading } = useGetReport(id, {
    query: { enabled: !!id, queryKey: getGetReportQueryKey(id) }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-12">Report not found</div>;
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'high': return 'text-orange-600 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
      default: return 'text-green-600 bg-green-500/10 border-green-500/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <ShieldAlert className="w-5 h-5 mr-2" />;
      case 'high': return <AlertTriangle className="w-5 h-5 mr-2" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 mr-2" />;
      default: return <CheckCircle2 className="w-5 h-5 mr-2" />;
    }
  };

  const infectionRate = report.totalFarmsInspected > 0 
    ? ((report.diseaseCasesFound / report.totalFarmsInspected) * 100).toFixed(1) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{report.reportType.replace("_", " ")}</Badge>
              <span className="text-sm text-muted-foreground flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {format(new Date(report.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{report.title}</h1>
            <p className="text-muted-foreground flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-1 text-primary" /> {report.region}, {report.country}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg border flex items-center font-semibold ${getRiskColor(report.riskLevel)}`}>
            {getRiskIcon(report.riskLevel)}
            <span className="capitalize">{report.riskLevel} Risk</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm font-medium mb-1">Farms Inspected</div>
            <div className="text-3xl font-bold">{report.totalFarmsInspected.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm font-medium mb-1">Cases Found</div>
            <div className="text-3xl font-bold text-primary flex items-baseline gap-2">
              {report.diseaseCasesFound.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">({infectionRate}%)</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm font-medium mb-1">Affected Area</div>
            <div className="text-3xl font-bold">{report.affectedAreaHectares.toLocaleString()} <span className="text-lg text-muted-foreground font-normal">Ha</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-muted/30 p-6 md:p-8 border-b">
          <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
          <p className="text-foreground/90 leading-relaxed text-lg">
            {report.summary}
          </p>
        </div>
        {report.recommendations && (
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Actionable Recommendations
            </h2>
            <div className="prose prose-sm md:prose-base max-w-none text-foreground/80">
              {report.recommendations.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
