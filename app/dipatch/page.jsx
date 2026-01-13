"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Radio,
  Target,
  MapPin,
  Clock,
  Shield,
  Droplets,
  Zap,
  Home,
  Brush,
  Wrench,
  Building2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast"; // in your zip
// If your project uses sonner instead, tell me and I’ll switch it.

const SERVICE_OPTIONS = [
  { value: "emergency-plumbing", label: "Emergency Plumbing", icon: Droplets },
  { value: "water-extraction", label: "Water Extraction", icon: Zap },
  { value: "make-ready", label: "Make-Ready", icon: Home },
  { value: "porter-cleanup", label: "Porter / Cleanup", icon: Brush },
  { value: "commercial-repairs", label: "Commercial Repairs", icon: Wrench },
  { value: "hydro-jet", label: "Hydro-Jet Service", icon: Building2 },
];

export default function DispatchPortalPage() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode"); // "emergency" maybe
  const initialMode = urlMode === "emergency" ? "emergency" : "standard";

  const [mode, setMode] = useState(initialMode);
  const isEmergency = mode === "emergency";

  const { accent, accentDim } = useMemo(() => {
    const accentColor = isEmergency ? "#ff3b3b" : "#00d4ff";
    const accentColorDim = isEmergency
      ? "rgba(255, 59, 59, 0.20)"
      : "rgba(0, 212, 255, 0.20)";
    return { accent: accentColor, accentDim: accentColorDim };
  }, [isEmergency]);

  const [service, setService] = useState(isEmergency ? "emergency-plumbing" : "make-ready");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [property, setProperty] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  const priorityLabel = isEmergency ? "RED CHANNEL" : "BLUE CHANNEL";
  const etaText = isEmergency ? "Target response: < 30 minutes" : "Target response: < 2 hours";

  const submitMission = async () => {
    if (!name || !phone || !property) {
      toast({
        title: "Missing required fields",
        description: "Name, phone, and property address are required.",
      });
      return;
    }

    const payload = {
      id: `M-${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode,
      service,
      company,
      name,
      phone,
      property,
      unit,
      notes,
    };

    // ✅ Temporary: store locally so you can see it working immediately
    const existing = JSON.parse(localStorage.getItem("db_dispatch_missions") || "[]");
    existing.unshift(payload);
    localStorage.setItem("db_dispatch_missions", JSON.stringify(existing));

    toast({
      title: "Mission Activated",
      description: `Request ${payload.id} logged. Next step: route to your dispatcher / Firebase.`,
    });

    // Optional: clear fields
    // setUnit(""); setNotes("");
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: accentDim, border: `1px solid ${accent}50` }}
            >
              <Radio className="w-6 h-6" style={{ color: accent }} />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-wider">Dispatch Console</div>
              <div className="text-sm text-white/50">Property Operations • Mission Request</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className="border"
              style={{ backgroundColor: accentDim, borderColor: `${accent}55`, color: accent }}
            >
              {priorityLabel}
            </Badge>
            <Badge variant="secondary" className="bg-white/10 border border-white/10 text-white/70">
              {etaText}
            </Badge>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="bg-white/5 border border-white/10 rounded-full p-1">
            <TabsTrigger
              value="standard"
              className="rounded-full data-[state=active]:bg-white/10"
            >
              Blue • Standard
            </TabsTrigger>
            <TabsTrigger
              value="emergency"
              className="rounded-full data-[state=active]:bg-white/10"
            >
              Red • Emergency
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            {/* LEFT: FORM */}
            <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-lg font-semibold">Create Mission</div>
                  <div className="text-sm text-white/50">
                    Fill details and deploy the right operator.
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={submitMission}
                    className="rounded-full px-6"
                    style={{
                      backgroundColor: accent,
                      color: "#0a0f1a",
                      boxShadow: `0 0 30px ${accentDim}`,
                    }}
                  >
                    <Target className="mr-2" />
                    Activate Mission
                  </Button>
                </motion.div>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Company / Portfolio (optional)</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ABC Property Mgmt" />
                </div>

                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1a] border-white/10 text-white">
                      {SERVICE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Requester Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>

                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(210) 555-1234" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Property Address *</Label>
                  <Input
                    value={property}
                    onChange={(e) => setProperty(e.target.value)}
                    placeholder="123 Main St, San Antonio, TX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit / Suite (optional)</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit 204 / Suite B" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Problem Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] bg-white/5 border-white/10"
                    placeholder="What happened? Access instructions? Water shutoff location? Gate code? Photo notes?"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 flex-wrap text-xs text-white/40">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Precise location improves ETA.
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Status updates provided.
                </span>
              </div>
            </Card>

            {/* RIGHT: STATUS / PROMISE */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
              <div className="text-lg font-semibold">Command Guarantees</div>
              <div className="text-sm text-white/50 mt-1">What the portal promises to PMs.</div>

              <div className="mt-6 space-y-4">
                {[
                  { icon: Clock, title: "Response Window", desc: isEmergency ? "< 30 minutes target" : "< 2 hours target" },
                  { icon: Shield, title: "Vetted Operators", desc: "Trusted techs + quality control" },
                  { icon: MapPin, title: "Tracking", desc: "Real-time status + updates" },
                  { icon: Radio, title: "Single Channel", desc: "One request thread, one outcome" },
                ].map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: accentDim, border: `1px solid ${accent}30` }}
                    >
                      <b.icon className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <div>
                      <div className="font-medium">{b.title}</div>
                      <div className="text-sm text-white/45">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-2xl border border-white/10 bg-white/5">
                <div className="text-sm font-medium">Next Upgrade</div>
                <div className="text-sm text-white/45 mt-1">
                  Wire submission to Firebase + push to dispatcher dashboard + SMS confirmations.
                </div>
              </div>
            </Card>
          </div>

          <TabsContent value="standard" />
          <TabsContent value="emergency" />
        </Tabs>
      </div>
    </div>
  );
}
