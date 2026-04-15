import React, { useEffect, useRef, useState } from "react";
import { Bell, Users, CreditCard, Crown, Check, CheckCheck } from "lucide-react";
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const typeIcons: Record<string, React.ReactNode> = {
  user: <Users className="w-4 h-4 text-blue-400" />,
  payment: <CreditCard className="w-4 h-4 text-green-400" />,
  plan: <Crown className="w-4 h-4 text-yellow-400" />,
  info: <Bell className="w-4 h-4 text-muted-foreground" />,
};

const typeBadgeColors: Record<string, string> = {
  user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  payment: "bg-green-500/10 text-green-400 border-green-500/20",
  plan: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  info: "bg-muted text-muted-foreground",
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
};

const NotificationBell = () => {
  const { user } = useAuth();
  const { data: notifications } = useNotifications(user?.id);
  const { data: unreadCount } = useUnreadCount(user?.id);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const prevCountRef = useRef(unreadCount);
  const [open, setOpen] = useState(false);

  // Show toast on new notification
  useEffect(() => {
    if (
      prevCountRef.current !== undefined &&
      unreadCount !== undefined &&
      unreadCount > prevCountRef.current
    ) {
      const latest = notifications?.[0];
      if (latest) {
        toast.info(latest.message, { duration: 5000 });
      }
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, notifications]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {!!unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {!!unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {!notifications?.length ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n.id}
                className={`flex gap-3 p-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (!n.is_read) markRead.mutate(n.id);
                }}
              >
                <div className="mt-0.5">{typeIcons[n.type] || typeIcons.info}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeBadgeColors[n.type] || typeBadgeColors.info}`}>
                      {n.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatTime(n.created_at)}</span>
                  </div>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
