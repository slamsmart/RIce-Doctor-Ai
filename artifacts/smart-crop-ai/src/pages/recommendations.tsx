import { useListRecommendations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Search, Sprout, MapPin, TestTube } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function Recommendations() {
  const { data: recommendations, isLoading } = useListRecommendations();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredRecs = recommendations?.filter(rec => {
    const matchesSearch = rec.fertilizerName.toLowerCase().includes(search.toLowerCase()) || 
                          rec.disease.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || rec.fertilizerType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fertilizer Recommendations</h1>
        <p className="text-muted-foreground mt-2">
          AI-generated treatment plans based on regional crop analysis.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by fertilizer or disease..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="chemical">Chemical</SelectItem>
            <SelectItem value="organic">Organic</SelectItem>
            <SelectItem value="biological">Biological</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))
        ) : filteredRecs?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No recommendations found matching your criteria.
          </div>
        ) : (
          filteredRecs?.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{rec.fertilizerName}</CardTitle>
                    <CardDescription className="capitalize">
                      For {rec.disease.replace("_", " ")} in {rec.cropType.replace("_", " ")}
                    </CardDescription>
                  </div>
                  {rec.subsidized && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Subsidized</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize text-primary border-primary/30">
                    <TestTube className="w-3 h-3 mr-1" />
                    {rec.fertilizerType}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    <MapPin className="w-3 h-3 mr-1" />
                    {rec.country}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Dosage</span>
                    <span className="font-medium">{rec.dosage}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Method</span>
                    <span className="font-medium">{rec.applicationMethod}</span>
                  </div>
                </div>

                <div className="text-sm bg-muted/40 p-3 rounded-lg">
                  <span className="font-medium flex items-center gap-1.5 mb-1 text-primary">
                    <Sprout className="w-4 h-4" /> AI Guidance
                  </span>
                  <p className="text-muted-foreground leading-snug line-clamp-3">
                    {rec.aiGuidance}
                  </p>
                </div>

                {rec.localAvailability && (
                  <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    Available at: <span className="font-medium">{rec.localAvailability}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
