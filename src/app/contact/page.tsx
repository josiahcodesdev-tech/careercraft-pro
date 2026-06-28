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

const faqs = [
  {
    q: "How long does a CV take?",
    a: "Most CVs are delivered within 48 hours. Rush delivery is available on request.",
  },
  {
    q: "Is the consultation really free?",
    a: "Yes — a 30-minute initial consultation is completely free, with no obligation.",
  },
  {
    q: "Do you offer revisions?",
    a: "One round of revisions is included with every service. Additional rounds can be arranged.",
  },
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

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
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
      form.phone && `*Phone:* ${form.phone}`,
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
      <section className="bg-card border-b border-border py-16 px-8">
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
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  className="bg-background"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
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

            {/* FAQ */}
            <div className="bg-card border border-border rounded-2xl p-7">
              <h4 className="font-heading text-base font-extrabold mb-4">
                Quick answers
              </h4>
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="py-2.5 border-b border-border last:border-b-0"
                >
                  <div className="text-sm font-semibold mb-1">{faq.q}</div>
                  <div className="text-[13px] text-text-secondary leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
