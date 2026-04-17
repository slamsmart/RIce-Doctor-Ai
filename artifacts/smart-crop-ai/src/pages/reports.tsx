import { useListReports, useCreateReport } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { FileText, Plus, MapPin, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "Region is required"),
  reportType: z.string().min(1, "Report type is required"),
  riskLevel: z.string().min(1, "Risk level is required"),
  summary: z.string().min(10, "Provide a brief summary"),
  totalFarmsInspected: z.coerce.number().min(0),
  diseaseCasesFound: z.coerce.number().min(0),
  affectedAreaHectares: z.coerce.number().min(0),
});

export default function Reports() {
  const { data: reports, isLoading } = useListReports();
  const createReport = useCreateReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", country: "", region: "", reportType: "", riskLevel: "low",
      summary: "", totalFarmsInspected: 0, diseaseCasesFound: 0, affectedAreaHectares: 0
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createReport.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Report created successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        setOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Failed to create report", variant: "destructive" });
      }
    });
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical': return <Badge variant="destructive">Critical Risk</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">High Risk</Badge>;
      case 'medium': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Medium Risk</Badge>;
      default: return <Badge className="bg-green-500 hover:bg-green-600">Low Risk</Badge>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Reports</h1>
          <p className="text-muted-foreground mt-2">Official surveys and outbreak alerts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0"><Plus className="w-4 h-4 mr-2" /> New Report</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Monitoring Report</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Q3 Rice Health Survey" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="ID">Indonesia</SelectItem>
                          <SelectItem value="TH">Thailand</SelectItem>
                          <SelectItem value="VN">Vietnam</SelectItem>
                          <SelectItem value="PH">Philippines</SelectItem>
                          <SelectItem value="MY">Malaysia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl><Input placeholder="Region" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="reportType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="survey">Survey</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="outbreak_alert">Outbreak Alert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="riskLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select risk" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="totalFarmsInspected" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farms Inspected</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="diseaseCasesFound" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cases Found</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="affectedAreaHectares" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affected Area (Ha)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="summary" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Executive Summary</FormLabel>
                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createReport.isPending}>
                  {createReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Report
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : reports?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No reports available yet.
          </div>
        ) : (
          reports?.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`} className="block group">
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getRiskBadge(report.riskLevel)}
                        <Badge variant="outline" className="capitalize">{report.reportType.replace("_", " ")}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {report.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {report.region}, {report.country}</span>
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                        <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {report.totalFarmsInspected} farms inspected</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </motion.div>
  );
}
