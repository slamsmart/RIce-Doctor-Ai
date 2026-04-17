import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateScan } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { UploadCloud, Image as ImageIcon, Loader2 } from "lucide-react";

const formSchema = z.object({
  cropType: z.string().min(1, "Please select a crop type"),
  country: z.string().min(1, "Please select a country"),
  region: z.string().min(1, "Please enter a region"),
  farmerName: z.string().optional(),
});

export default function ScanPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createScan = useCreateScan();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropType: "",
      country: "",
      region: "",
      farmerName: "",
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc).",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!imageBase64) {
      toast({
        title: "Missing image",
        description: "Please upload an image of the crop to proceed.",
        variant: "destructive",
      });
      return;
    }

    createScan.mutate({
      data: {
        ...values,
        imageBase64,
      }
    }, {
      onSuccess: (scan) => {
        toast({
          title: "Scan submitted successfully",
          description: "Analyzing crop image...",
        });
        setLocation(`/scan/${scan.id}`);
      },
      onError: () => {
        toast({
          title: "Submission failed",
          description: "There was an error submitting your scan. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan a Crop</h1>
        <p className="text-muted-foreground mt-2">
          Upload an image of a crop leaf or plant to detect diseases and get treatment recommendations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crop Image</CardTitle>
          <CardDescription>Upload a clear, well-lit photo of the affected area.</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
              ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
              ${imageBase64 ? "bg-muted/30" : ""}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            
            {imageBase64 ? (
              <div className="space-y-4">
                <div className="relative w-full max-w-sm mx-auto h-48 rounded-lg overflow-hidden border">
                  <img src={imageBase64} alt="Crop preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>{fileName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setImageBase64(null);
                  setFileName(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}>
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drag & drop your image here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse from your device</p>
                </div>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Details</CardTitle>
          <CardDescription>Provide context about the crop and location.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select crop" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rice">Rice</SelectItem>
                          <SelectItem value="oil_palm">Oil Palm</SelectItem>
                          <SelectItem value="corn">Corn</SelectItem>
                          <SelectItem value="cassava">Cassava</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
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
                  )}
                />
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Central Java" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="farmerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farmer Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Budi Santoso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createScan.isPending}>
                {createScan.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : "Submit for Analysis"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
