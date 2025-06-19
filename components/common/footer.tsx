"use client";

import Link from "next/link";
import { Crop, Github, Twitter, Linkedin } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Overview", href: "/" },
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
      { name: "FAQ", href: "/#faq" },
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
    social: [
      { name: "Twitter", href: "#", icon: Twitter },
      { name: "GitHub", href: "#", icon: Github },
      { name: "LinkedIn", href: "#", icon: Linkedin },
    ],
  } as const;

  return (
    <footer className="bg-background border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* ── Main grid ────────────────────────────────────────── */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              {/* brand mark with stroke-flow + rotate */}
              <IridescentIcon
                icon={Crop}
                className="icon-iridescent h-8 w-8 transition-transform duration-200 group-hover:rotate-12"
              />
              <span className="font-bold text-2xl text-foreground">MBLM</span>
            </Link>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Re-shape your thinking.
            </p>

            {/* Social icons – plain colours */}
            <div className="flex items-center gap-4">
              {footerLinks.social.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  aria-label={name}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Product / Company / Legal columns */}
          {(["product", "company", "legal"] as const).map((section) => (
            <div key={section} className="space-y-6">
              <h3 className="text-foreground font-semibold text-lg capitalize">
                {section}
              </h3>
              <ul className="space-y-3">
                {footerLinks[section].map(({ name, href }) => (
                  <li key={name}>
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className="py-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} MBLM. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/status"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              System Status
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
