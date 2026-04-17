import { useGetScansSummary, useGetRecentScans } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Scan, AlertTriangle, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: summary, isLoading: isSummaryLoading } = useGetScansSummary();
  const { data: recentScans, isLoading: isRecentLoading } = useGetRecentScans();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <section className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url(/hero-rice-field.png)" }} />
        <div className="relative p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Precision Agriculture for ASEAN</h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
              AI-powered crop disease detection, fertilizer recommendations, and regional monitoring for governments and smallholder farmers.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link href="/scan">
                <Button size="lg" variant="secondary" className="font-semibold cursor-pointer text-primary">
                  <Scan className="mr-2 w-5 h-5" />
                  Scan Crop
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 cursor-pointer">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
            <Scan className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.totalScans.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across ASEAN regions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Analyzed Today</CardTitle>
            <ShieldCheck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.analyzedToday.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Processed by AI</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diseases Detected</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.diseasesDetected.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Unique threats identified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Countries Active</CardTitle>
            <Leaf className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.countriesCovered}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Monitoring active</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="cursor-pointer text-primary">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <Card>
          <div className="divide-y">
            {isRecentLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : recentScans?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No recent scans available.</div>
            ) : (
              recentScans?.slice(0, 5).map((scan) => (
                <Link key={scan.id} href={`/scan/${scan.id}`} className="block">
                  <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <div className="font-medium capitalize">{scan.cropType.replace("_", " ")}</div>
                      <div className="text-sm text-muted-foreground">
                        {scan.country} • {format(new Date(scan.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    <div>
                      {scan.status === 'analyzed' ? (
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          scan.severity === 'severe' ? 'bg-destructive/10 text-destructive' :
                          scan.severity === 'moderate' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-green-500/10 text-green-600'
                        }`}>
                          {scan.detectedDisease ? scan.detectedDisease : "Healthy"}
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>
    </motion.div>
  );
}
