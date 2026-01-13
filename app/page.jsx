"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Target,
  ChevronDown,
  Droplets,
  Zap,
  Home,
  Brush,
  Wrench,
  Building2,
  Shield,
  Clock,
  MapPin,
  FileText,
  Navigation,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const [mode, setMode] = useState("standard"); // 'standard' | 'emergency'
  const [scanLine, setScanLine] = useState(0);

  const isEmergency = mode === "emergency";

  // Base44 vibe: cyan + red
  const { accent, accentDim } = useMemo(() => {
    const accentColor = isEmergency ? "#ff3b3b" : "#00d4ff";
    const accentColorDim = isEmergency
      ? "rgba(255, 59, 59, 0.20)"
      : "rgba(0, 212, 255, 0.20)";
    return { accent: accentColor, accentDim: accentColorDim };
  }, [isEmergency]);

  useEffect(() => {
    const interval = setInterval(() => setScanLine((p) => (p + 1) % 100), 30);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { icon: Droplets, title: "Emergency Plumbing", desc: "Burst pipes, leaks, flooding" },
    { icon: Zap, title: "Water Extraction", desc: "Rapid flood response" },
    { icon: Home, title: "Make-Ready", desc: "Unit turnovers, prep work" },
    { icon: Brush, title: "Porter / Cleanup", desc: "Deep clean, debris removal" },
    { icon: Wrench, title: "Commercial Repairs", desc: "HVAC, electrical, structural" },
    { icon: Building2, title: "Hydro-Jet Service", desc: "Drain clearing, sewer lines" },
  ];

  const benefits = [
    { icon: Clock, title: "SLA-Driven Response", desc: "Guaranteed response windows" },
    { icon: Shield, title: "Vetted Technicians", desc: "Background-checked operators" },
    { icon: MapPin, title: "Real-Time Tracking", desc: "Live operator status + ETA" },
    { icon: FileText, title: "One Thread", desc: "Notes, photos, invoice in one place" },
  ];

  const goDispatch = () => {
    // Route into your portal
    window.location.href = isEmergency ? "/dispatch?mode=emergency" : "/dispatch";
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-hidden">
      {/* Background Grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Scanning Line */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: `linear-gradient(180deg,
            transparent ${scanLine - 2}%,
            ${accentDim} ${scanLine}%,
            transparent ${scanLine + 2}%)`,
        }}
      />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Video Background (optional). Put your mp4 at /public/dispatch.mp4 */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-transparent to-[#0a0f1a]" />
          <video
            className="w-full h-full object-cover opacity-30"
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80"
          >
            <source src="/dispatch.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#0a0f1a]/60" />
        </div>

        {/* TOP NAV */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: accentDim, border: `1px solid ${accent}` }}
                >
                  <Radio className="w-5 h-5" style={{ color: accent }} />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-lg"
                  style={{ border: `1px solid ${accent}` }}
                />
              </div>

              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-wider">DEALBANKERS</div>
                <div className="text-xs tracking-[0.32em] opacity-60">DISPATCH</div>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-2 p-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <button
                onClick={() => setMode("standard")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  !isEmergency ? "" : "text-white/50 hover:text-white/80"
                }`}
                style={!isEmergency ? { backgroundColor: accentDim, color: accent } : undefined}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${!isEmergency ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: !isEmergency ? accent : "rgba(255,255,255,0.25)" }}
                  />
                  Standard
                </span>
              </button>

              <button
                onClick={() => setMode("emergency")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isEmergency ? "" : "text-white/50 hover:text-white/80"
                }`}
                style={isEmergency ? { backgroundColor: accentDim, color: accent } : undefined}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${isEmergency ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: isEmergency ? accent : "rgba(255,255,255,0.25)" }}
                  />
                  Emergency
                </span>
              </button>
            </div>
          </div>
        </motion.nav>

        {/* HERO CONTENT */}
        <div className="relative z-20 text-center max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-xs tracking-[0.45em] mb-6 opacity-60"
            style={{ color: accent }}
          >
            PROPERTY OPERATIONS COMMAND
          </motion.p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-white/10 border border-white/10 text-white/80">
              Mission Control
            </Badge>
            <Badge
              variant="secondary"
              className="border"
              style={{
                backgroundColor: accentDim,
                borderColor: `${accent}50`,
                color: accent,
              }}
            >
              {isEmergency ? "RED CHANNEL" : "BLUE CHANNEL"}
            </Badge>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6"
          >
            When things go wrong,
            <br />
            <span className="font-semibold" style={{ color: accent }}>
              you activate.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-lg md:text-xl text-white/60 mb-14 max-w-2xl mx-auto"
          >
            On-demand expert dispatch for property managers.
            <br />
            Emergency. Make-ready. Rapid cleanup. One command.
          </motion.p>

          {/* BIG ROUND BUTTON */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 110 }}
            className="relative inline-flex items-center justify-center"
          >
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute rounded-full"
                style={{
                  width: 200 + ring * 60,
                  height: 200 + ring * 60,
                  border: `1px solid ${accent}`,
                  opacity: 0.1 + ring * 0.05,
                }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, delay: ring * 0.3 }}
              />
            ))}

            <motion.div
              className="absolute w-48 h-48 rounded-full"
              style={{ backgroundColor: accent }}
              animate={{ scale: [1, 1.5], opacity: [0.28, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.button
              onClick={goDispatch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${accentDim}, transparent 70%)`,
                border: `2px solid ${accent}`,
                boxShadow: `0 0 60px ${accentDim}, inset 0 0 60px ${accentDim}`,
              }}
            >
              <Target className="w-8 h-8" style={{ color: accent }} />
              <span className="text-sm font-semibold tracking-wider" style={{ color: accent }}>
                {isEmergency ? "ACTIVATE" : "DISPATCH"}
              </span>
              <span className="text-xs opacity-60">{isEmergency ? "EMERGENCY" : "TECHNICIAN"}</span>
            </motion.button>
          </motion.div>

          <div className="mt-10 text-sm text-white/45">
            Average response time: {isEmergency ? "< 30 minutes" : "< 2 hours"}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => (window.location.href = "/dispatch")}
              variant="secondary"
              className="rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Create Dispatch Console
            </Button>
            <Button
              onClick={() => (window.location.href = "/dispatch?mode=emergency")}
              variant="outline"
              className="rounded-full"
              style={{ borderColor: `${accent}60`, color: accent }}
            >
              Request First Mission
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="w-6 h-6 opacity-40" />
          </motion.div>
        </motion.div>
      </section>

      {/* QUICK PROOF SECTIONS (services + benefits) */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs tracking-[0.45em] mb-3 opacity-40" style={{ color: accent }}>
              OPERATIONAL CAPABILITIES
            </div>
            <h2 className="text-3xl md:text-5xl font-light">Services</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {services.map((s) => (
              <motion.div
                key={s.title}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <div
                  className="relative p-6 md:p-8 rounded-xl backdrop-blur-xl overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${accentDim}, transparent 70%)` }}
                  />
                  <div className="relative">
                    <s.icon className="w-8 h-8 mb-4" style={{ color: "rgba(255,255,255,0.45)" }} />
                    <div className="text-lg font-medium mb-1">{s.title}</div>
                    <div className="text-sm text-white/45">{s.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
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
        </div>
      </section>

      <footer className="relative py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: accentDim, border: `1px solid ${accent}40` }}
            >
              <Radio className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div className="text-sm tracking-wider opacity-60">DEALBANKERS DISPATCH</div>
          </div>

          <div className="text-sm text-white/40">Rapid Response for Real Assets</div>

          <div className="text-xs text-white/30">© {new Date().getFullYear()} DealBankers</div>
        </div>
      </footer>
    </div>
  );
}
