import { useRoute } from "wouter";
import { 
  useGetScan, getGetScanQueryKey, 
  useListRecommendations, 
  useCreateRecommendation, 
  useGetVoiceGuidance 
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { 
  AlertTriangle, CheckCircle2, Leaf, MapPin, 
  Sprout, Volume2, Loader2, Thermometer, ShieldAlert 
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function ScanDetail() {
  const [, params] = useRoute("/scan/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [voiceLang, setVoiceLang] = useState("en");
  const [playingVoice, setPlayingVoice] = useState(false);

  const { data: scan, isLoading: isScanLoading } = useGetScan(id, {
    query: { enabled: !!id, queryKey: getGetScanQueryKey(id) }
  });

  const { data: recommendations, isLoading: isRecsLoading } = useListRecommendations({ scanId: id }, {
    query: { enabled: !!id }
  });

  const createRecommendation = useCreateRecommendation();
  const getVoiceGuidance = useGetVoiceGuidance();

  const handleGenerateRec = () => {
    if (!scan) return;
    createRecommendation.mutate({
      data: { scanId: id, country: scan.country }
    }, {
      onSuccess: () => {
        toast({ title: "Recommendation generated" });
        queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      },
      onError: () => {
        toast({ title: "Failed to generate recommendation", variant: "destructive" });
      }
    });
  };

  const handlePlayVoice = () => {
    if (!scan || !scan.detectedDisease) return;
    setPlayingVoice(true);
    getVoiceGuidance.mutate({
      data: {
        disease: scan.detectedDisease,
        treatment: scan.treatmentSuggestion || "No treatment specified",
        language: voiceLang,
        cropType: scan.cropType
      }
    }, {
      onSuccess: (data) => {
        toast({
          title: `Voice Guidance (${data.languageName})`,
          description: data.text,
        });
        setPlayingVoice(false);
      },
      onError: () => {
        toast({ title: "Failed to get voice guidance", variant: "destructive" });
        setPlayingVoice(false);
      }
    });
  };

  if (isScanLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-1" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!scan) {
    return <div className="text-center py-12">Scan not found</div>;
  }

  const severityColor = 
    scan.severity === 'severe' ? 'bg-destructive/10 text-destructive border-destructive/20' :
    scan.severity === 'moderate' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
    'bg-green-500/10 text-green-600 border-green-500/20';

  const severityIcon = 
    scan.severity === 'severe' ? <ShieldAlert className="w-4 h-4 mr-1" /> :
    scan.severity === 'moderate' ? <AlertTriangle className="w-4 h-4 mr-1" /> :
    <CheckCircle2 className="w-4 h-4 mr-1" />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm">
            <Leaf className="w-4 h-4" />
            <span className="capitalize">{scan.cropType.replace("_", " ")}</span>
            <span>•</span>
            <MapPin className="w-4 h-4" />
            <span>{scan.region}, {scan.country}</span>
            <span>•</span>
            <span>{format(new Date(scan.createdAt), 'MMM d, yyyy')}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Scan Result</h1>
        </div>
        <div className="flex items-center gap-2">
          {scan.status === "analyzed" && (
            <Badge variant="outline" className={severityColor}>
              {severityIcon}
              <span className="capitalize">{scan.severity} Risk</span>
            </Badge>
          )}
          <Badge variant="secondary" className="capitalize">{scan.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scanned Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border bg-muted aspect-square flex items-center justify-center">
                {scan.imageBase64 || scan.imageUrl ? (
                  <img 
                    src={scan.imageBase64 || scan.imageUrl || ''} 
                    alt="Crop scan" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                )}
              </div>
              {scan.farmerName && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium">Farmer: {scan.farmerName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {scan.status === "analyzed" && scan.detectedDisease && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Voice Guidance</CardTitle>
                <CardDescription>Get audio instructions in local languages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={voiceLang} onValueChange={setVoiceLang}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    <SelectItem value="th">Thai</SelectItem>
                    <SelectItem value="vi">Vietnamese</SelectItem>
                    <SelectItem value="ph">Filipino</SelectItem>
                    <SelectItem value="jv">Javanese</SelectItem>
                    <SelectItem value="su">Sundanese</SelectItem>
                    <SelectItem value="ms">Malay</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="w-full" 
                  variant="secondary" 
                  onClick={handlePlayVoice}
                  disabled={playingVoice}
                >
                  {playingVoice ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  Play Instructions
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">AI Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {scan.status === 'pending' ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p>AI is currently analyzing this image...</p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Detected Issue</h3>
                    <div className="text-2xl font-bold text-foreground">
                      {scan.detectedDisease || "Healthy Crop"}
                    </div>
                  </div>

                  {scan.diseaseConfidence != null && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">AI Confidence</span>
                        <span className="font-medium">{scan.diseaseConfidence}%</span>
                      </div>
                      <Progress value={scan.diseaseConfidence} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Analysis Details
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scan.aiAnalysis || "No detailed analysis available."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-blue-500" />
                        Treatment Suggestion
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scan.treatmentSuggestion || "No specific treatment suggested."}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {scan.status === "analyzed" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Fertilizer Recommendation</CardTitle>
                  <CardDescription>Tailored to the region and detected issue</CardDescription>
                </div>
                {!recommendations?.length && !createRecommendation.isPending && (
                  <Button size="sm" onClick={handleGenerateRec}>Generate</Button>
                )}
              </CardHeader>
              <CardContent>
                {isRecsLoading || createRecommendation.isPending ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map(rec => (
                      <div key={rec.id} className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{rec.fertilizerName}</h4>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="capitalize">{rec.fertilizerType}</Badge>
                              {rec.subsidized && <Badge variant="default" className="bg-green-600">Subsidized</Badge>}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">Dosage: {rec.dosage}</div>
                            <div className="text-muted-foreground">{rec.applicationMethod}</div>
                          </div>
                        </div>
                        <div className="pt-3 border-t text-sm">
                          <p className="font-medium mb-1 flex items-center gap-2">
                            <Sprout className="w-4 h-4 text-primary" /> AI Guidance
                          </p>
                          <p className="text-muted-foreground">{rec.aiGuidance}</p>
                        </div>
                        {rec.localAvailability && (
                          <div className="mt-3 pt-3 border-t text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Available at:</span>
                            <span className="font-medium">{rec.localAvailability}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No fertilizer recommendations generated yet.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
