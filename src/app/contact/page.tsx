"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "254110242289";

const infoCards = [
  {
    icon: Phone,
    title: "Call us",
    content: (
      <a href="tel:+254110242289" className="text-brand font-medium hover:underline">
        +254 110 242 289
      </a>
    ),
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    content: (
      <a href="https://wa.me/254110242289" target="_blank" rel="noopener noreferrer" className="text-brand font-medium hover:underline">
        +254 110 242 289
      </a>
    ),
  },
  {
    icon: Mail,
    title: "Email us",
    content: (
      <a href="mailto:josiahcodes.dev@gmail.com" className="text-brand font-medium hover:underline">
        josiahcodes.dev@gmail.com
      </a>
    ),
  },
  {
    icon: MapPin,
    title: "Location",
    content: (
      <span>
        Based in Nairobi, Kenya
        <br />
        Serving clients globally
      </span>
    ),
  },
];

const hours = [
  { day: "Monday – Friday", time: "8:00 AM – 6:00 PM" },
  { day: "Saturday", time: "9:00 AM – 2:00 PM" },
  { day: "Sunday", time: "Closed" },
];


const serviceOptions = [
  { value: "career-assessment", label: "Career assessment" },
  { value: "cv-writing", label: "CV & resume writing" },
  { value: "interview-coaching", label: "Interview coaching" },
  { value: "personal-branding", label: "Personal branding" },
  { value: "career-transition", label: "Career transition" },
  { value: "cover-letters", label: "Cover letters & proposals" },
  { value: "other", label: "Other / Not sure" },
];

const countryCodes = [
  { code: "+254", country: "KE", label: "Kenya (+254)" },
  { code: "+256", country: "UG", label: "Uganda (+256)" },
  { code: "+255", country: "TZ", label: "Tanzania (+255)" },
  { code: "+251", country: "ET", label: "Ethiopia (+251)" },
  { code: "+250", country: "RW", label: "Rwanda (+250)" },
  { code: "+257", country: "BI", label: "Burundi (+257)" },
  { code: "+211", country: "SS", label: "South Sudan (+211)" },
  { code: "+252", country: "SO", label: "Somalia (+252)" },
  { code: "+253", country: "DJ", label: "Djibouti (+253)" },
  { code: "+291", country: "ER", label: "Eritrea (+291)" },
  { code: "+27", country: "ZA", label: "South Africa (+27)" },
  { code: "+234", country: "NG", label: "Nigeria (+234)" },
  { code: "+233", country: "GH", label: "Ghana (+233)" },
  { code: "+237", country: "CM", label: "Cameroon (+237)" },
  { code: "+243", country: "CD", label: "DR Congo (+243)" },
  { code: "+20", country: "EG", label: "Egypt (+20)" },
  { code: "+212", country: "MA", label: "Morocco (+212)" },
  { code: "+1", country: "US", label: "USA (+1)" },
  { code: "+44", country: "GB", label: "UK (+44)" },
  { code: "+971", country: "AE", label: "UAE (+971)" },
  { code: "+966", country: "SA", label: "Saudi Arabia (+966)" },
  { code: "+91", country: "IN", label: "India (+91)" },
  { code: "+86", country: "CN", label: "China (+86)" },
  { code: "+61", country: "AU", label: "Australia (+61)" },
  { code: "+49", country: "DE", label: "Germany (+49)" },
  { code: "+33", country: "FR", label: "France (+33)" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+254",
    phone: "",
    service: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const serviceName = serviceOptions.find((o) => o.value === form.service)?.label || form.service;
    const text = [
      `*New enquiry from CareerCraft Pro*`,
      ``,
      `*Name:* ${form.firstName} ${form.lastName}`,
      `*Email:* ${form.email}`,
      form.phone && `*Phone:* ${form.countryCode} ${form.phone}`,
      serviceName && `*Service:* ${serviceName}`,
      ``,
      `*Message:*`,
      form.message,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <>
      {/* Page hero */}
      <section className="bg-card border-b border-border py-8 px-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-3">
            Get in touch
          </p>
          <h1 className="font-heading text-[clamp(26px,3.2vw,40px)] font-black tracking-tight leading-tight mb-4">
            Let&apos;s talk about
            <br />
            your career
          </h1>
          <p className="text-text-secondary max-w-[540px] mx-auto leading-relaxed">
            Whether you need a professional CV, interview coaching, or a full
            career strategy — send us a message and we&apos;ll respond within a
            few hours.
          </p>
        </div>
      </section>

      {/* Contact grid */}
      <section className="py-20 px-8">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-10">
            <h2 className="font-heading text-[22px] font-black tracking-tight mb-2">
              Send us a message
            </h2>
            <p className="text-sm text-text-secondary mb-8 leading-relaxed">
              Fill in the form below and we&apos;ll get back to you with a free
              consultation.
            </p>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="text-sm font-semibold mb-1.5 block">
                    First name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="Jane"
                    required
                    className="bg-background"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="text-sm font-semibold mb-1.5 block">
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Kamau"
                    required
                    className="bg-background"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold mb-1.5 block">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  required
                  className="bg-background"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-semibold mb-1.5 block">
                  Phone number (optional)
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.countryCode}
                    onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 w-[130px] flex-shrink-0"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.country} {c.code}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="712 345 678"
                    className="bg-background flex-1"
                    value={form.phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d\s]/g, "");
                      if (val.startsWith("0")) val = val.slice(1);
                      setForm((f) => ({ ...f, phone: val }));
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  Service you&apos;re interested in
                </label>
                <Select value={form.service} onValueChange={(v) => setForm((f) => ({ ...f, service: v ?? "" }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-semibold mb-1.5 block">
                  Tell us about your situation
                </label>
                <Textarea
                  id="message"
                  placeholder="What are you looking for? Any deadlines or specific goals?"
                  required
                  rows={5}
                  className="bg-background resize-y"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand-mid text-white font-semibold mt-1 gap-2">
                <MessageCircle className="w-4 h-4" /> Send via WhatsApp →
              </Button>
            </form>
          </div>

          {/* Info sidebar */}
          <div className="flex flex-col gap-5">
            {infoCards.map((card) => (
              <div
                key={card.title}
                className="bg-card border border-border rounded-2xl p-7 flex gap-3.5 items-start"
              >
                <div className="w-11 h-11 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-[22px] h-[22px] text-brand" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold mb-1">
                    {card.title}
                  </h4>
                  <div className="text-sm text-text-secondary leading-relaxed">
                    {card.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Hours */}
            <div className="bg-brand text-white rounded-2xl p-8">
              <h4 className="font-heading text-lg font-extrabold mb-4">
                Working hours
              </h4>
              {hours.map((row) => (
                <div
                  key={row.day}
                  className="flex justify-between py-1.5 border-b border-white/15 last:border-b-0 text-sm"
                >
                  <span className="opacity-80">{row.day}</span>
                  <span className="font-semibold">{row.time}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
