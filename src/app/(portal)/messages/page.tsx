import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime, getInitials } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Messages" };

export default async function PortalMessagesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const messages = await prisma.message.findMany({
    where: {
      toUserId: session.user.id,
      parentId: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      from: { select: { id: true, name: true, email: true, image: true } },
      replies: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      toUserId: session.user.id,
      status: "UNREAD",
    },
    data: { status: "READ", readAt: new Date() },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Communications from your care team
        </p>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={message.status === "UNREAD" ? "border-primary/50 bg-primary/5" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={message.from.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(message.from.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {message.from.name ?? message.from.email}
                      </p>
                      {message.status === "UNREAD" && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                      {message.replies.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {message.replies.length} repl{message.replies.length !== 1 ? "ies" : "y"}
                        </span>
                      )}
                    </div>
                    {message.subject && (
                      <p className="font-medium text-sm mt-0.5">{message.subject}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {message.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
