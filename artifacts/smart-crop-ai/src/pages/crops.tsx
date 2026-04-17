import { useListCrops } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Leaf, Map, Bug } from "lucide-react";

export default function Crops() {
  const { data: crops, isLoading } = useListCrops();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary/50 p-8 md:p-12 mb-8">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ASEAN Crop Library</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Reference database for supported agricultural products, common regional diseases, and localized data.
          </p>
        </div>
        <Leaf className="absolute -right-8 -bottom-8 w-64 h-64 text-primary/10 rotate-12" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {crops?.map((crop) => (
            <motion.div key={crop.id} variants={item}>
              <Card className="h-full hover:border-primary/30 transition-colors overflow-hidden flex flex-col">
                <div className="h-40 bg-muted relative">
                  {crop.imageUrl ? (
                    <img src={crop.imageUrl} alt={crop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20">
                      <Leaf className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {crop.type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{crop.name}</CardTitle>
                      {crop.localName && (
                        <CardDescription className="text-primary font-medium mt-1">
                          Local: {crop.localName}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {crop.description}
                  </p>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Map className="w-4 h-4 text-muted-foreground" /> Supported Regions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {crop.countries.map(c => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Bug className="w-4 h-4 text-muted-foreground" /> Common Diseases
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {crop.commonDiseases.map(d => (
                          <Badge key={d} variant="secondary" className="text-xs capitalize">{d.replace("_", " ")}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
