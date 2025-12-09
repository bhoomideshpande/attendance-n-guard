import React from "react";
import { NavLink } from "@/components/NavLink";
import { Home, Users, FileText, TrendingUp, CalendarCheck } from "lucide-react";

interface NavigationProps {
  userRole?: "admin" | "user";
}

export const Navigation = ({ userRole = "user" }: NavigationProps) => {
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/students", icon: Users, label: "Students" },
    { to: "/attendance", icon: CalendarCheck, label: "Attendance" },
    { to: "/reports", icon: TrendingUp, label: "Reports" },
  ];

  return (
    <nav className="bg-card border-b border-border mt-[88px]">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-b-2 border-transparent"
              activeClassName="text-primary border-primary bg-muted/30"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
