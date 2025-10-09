import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Archive, Trash2, BellOff, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { User, Conversation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SwipeableChatItemProps {
  user: User;
  conversation?: Conversation | null;
  hasActiveConversation: boolean;
  isActive: boolean;
  onSelect: () => void;
  onArchive?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  isMobile?: boolean;
}

const SWIPE_THRESHOLD = 80; // Minimum distance to trigger action (reduced for easier activation)
const MAX_SWIPE = 120; // Maximum swipe distance

export default function SwipeableChatItem(props: SwipeableChatItemProps) {
  const { user, conversation, hasActiveConversation, isActive, onSelect, onDelete, onArchive, isMobile } = props;
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // Tutorial/hint UI removed
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();

  const resetSwipe = () => {
    setSwipeDistance(0);
    setIsDragging(false);
    setShowActions(false);
  };

  const handleStart = (clientX: number) => {
    startXRef.current = clientX;
    currentXRef.current = clientX;
    setIsDragging(true);
    setHasInteracted(true);
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startXRef.current;
    const clampedDelta = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
    
    setSwipeDistance(clampedDelta);
    currentXRef.current = clientX;
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const finalDistance = swipeDistance;
    setIsDragging(false);

    // Haptic feedback simulation (if supported)
    if ('vibrate' in navigator) {
      if (Math.abs(finalDistance) >= SWIPE_THRESHOLD) {
        navigator.vibrate(50); // Success vibration
      }
    }

    // Left swipe (delete) - negative distance
    if (finalDistance <= -SWIPE_THRESHOLD && conversation && onDelete) {
      // Show immediate feedback
      toast({
        title: 'Deleting conversation...',
        description: 'The conversation will be permanently removed.',
        duration: 2000,
      });
      
      // Add a brief delay to show the completed state
      setTimeout(() => {
        onDelete(conversation.id);
        resetSwipe();
      }, 150);
      return;
    }

    // Right swipe (archive) - positive distance
    if (finalDistance >= SWIPE_THRESHOLD && conversation && onArchive) {
      // Show immediate feedback
      toast({
        title: 'Archiving conversation...',
        description: 'The conversation will be moved to archived chats.',
        duration: 2000,
      });
      
      // Add a brief delay to show the completed state
      setTimeout(() => {
        onArchive(conversation.id);
        resetSwipe();
      }, 150);
      return;
    }

    // Reset if threshold not met with animation
    setSwipeDistance(0);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Global mouse events
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      handleEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Tutorial hint disabled
  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {};

  const getSwipeActionText = () => {
    if (swipeDistance <= -SWIPE_THRESHOLD) return 'Release to delete';
    if (swipeDistance >= SWIPE_THRESHOLD) return 'Release to archive';
    if (swipeDistance < -50) return 'Keep swiping left...';
    if (swipeDistance > 50) return 'Keep swiping right...';
    return 'Swipe left to delete • Swipe right to archive';
  };

  const getActionColor = () => {
    if (swipeDistance <= -SWIPE_THRESHOLD) return 'bg-destructive';
    if (swipeDistance >= SWIPE_THRESHOLD) return 'bg-blue-500';
    if (swipeDistance < -50) return 'bg-destructive/70';
    if (swipeDistance > 50) return 'bg-blue-500/70';
    return 'bg-gradient-to-r from-destructive/20 via-muted to-blue-500/20';
  };

  const getSwipeProgress = () => {
    return Math.min(Math.abs(swipeDistance) / SWIPE_THRESHOLD, 1);
  };

  return (
    <div 
      className="relative overflow-hidden group" 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Swipe hint overlay removed */}

      {/* Background Actions */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-between px-6 transition-all duration-200",
        getActionColor(),
        Math.abs(swipeDistance) > 20 ? 'opacity-100' : 'opacity-0'
      )}>
        {/* Left side - Delete */}
        <div className={cn(
          "flex flex-col items-center gap-1 text-white transition-all duration-200",
          swipeDistance < -30 ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-75'
        )}>
          <div className={cn(
            "relative flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm transition-all duration-200",
            swipeDistance <= -SWIPE_THRESHOLD ? 'scale-110 bg-white/30' : 'scale-100'
          )}>
            <Trash2 className={cn(
              "transition-all duration-200",
              swipeDistance <= -SWIPE_THRESHOLD ? 'h-6 w-6' : 'h-5 w-5'
            )} />
            {swipeDistance <= -SWIPE_THRESHOLD && (
              <div className="absolute inset-0 border-2 border-white rounded-full animate-pulse" />
            )}
          </div>
          <span className={cn(
            "font-semibold text-sm transition-all duration-200",
            swipeDistance <= -SWIPE_THRESHOLD ? 'text-base' : 'text-sm'
          )}>
            Delete
          </span>
          {/* Progress indicator */}
          <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-200 ease-out"
              style={{ width: `${swipeDistance < 0 ? getSwipeProgress() * 100 : 0}%` }}
            />
          </div>
        </div>
        
        {/* Center action text */}
        <div className="text-center flex-1 mx-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <span className="text-white text-sm font-medium block">
              {getSwipeActionText()}
            </span>
          </div>
        </div>

        {/* Right side - Archive */}
        <div className={cn(
          "flex flex-col items-center gap-1 text-white transition-all duration-200",
          swipeDistance > 30 ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-75'
        )}>
          <div className={cn(
            "relative flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm transition-all duration-200",
            swipeDistance >= SWIPE_THRESHOLD ? 'scale-110 bg-white/30' : 'scale-100'
          )}>
            <Archive className={cn(
              "transition-all duration-200",
              swipeDistance >= SWIPE_THRESHOLD ? 'h-6 w-6' : 'h-5 w-5'
            )} />
            {swipeDistance >= SWIPE_THRESHOLD && (
              <div className="absolute inset-0 border-2 border-white rounded-full animate-pulse" />
            )}
          </div>
          <span className={cn(
            "font-semibold text-sm transition-all duration-200",
            swipeDistance >= SWIPE_THRESHOLD ? 'text-base' : 'text-sm'
          )}>
            Archive
          </span>
          {/* Progress indicator */}
          <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-200 ease-out"
              style={{ width: `${swipeDistance > 0 ? getSwipeProgress() * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat Item */}
      <div
        className={cn(
          "relative bg-background transition-all duration-200 touch-pan-y",
          isDragging ? 'cursor-grabbing shadow-lg' : 'cursor-grab',
          Math.abs(swipeDistance) > 50 && 'shadow-xl',
          swipeDistance <= -SWIPE_THRESHOLD && 'ring-2 ring-destructive shadow-2xl shadow-destructive/20 animate-pulse',
          swipeDistance >= SWIPE_THRESHOLD && 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 animate-pulse'
        )}
        style={{
          transform: `translateX(${swipeDistance}px) scale(${1 - Math.abs(swipeDistance) * 0.0003})`,
          borderRadius: `${Math.abs(swipeDistance) * 0.05}px`,
          background: swipeDistance <= -SWIPE_THRESHOLD ? 'linear-gradient(90deg, rgba(239,68,68,0.1) 0%, rgba(255,255,255,1) 100%)' : 
                      swipeDistance >= SWIPE_THRESHOLD ? 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(59,130,246,0.1) 100%)' : undefined,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (Math.abs(swipeDistance) < 10) {
                onSelect();
              }
            }}
            className={cn(
              'flex w-full items-center transition-colors text-sidebar-foreground border-b border-sidebar-border',
              isActive ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50',
              isMobile ? 'gap-4 p-4 min-h-[56px]' : 'gap-3 p-3 min-h-[44px]'
            )}
          >
            <div className="relative">
              <Avatar className={isMobile ? "h-14 w-14" : "h-12 w-12"}>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {user.status === 'online' && (
                <div className={isMobile ? "absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" : "absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"}></div>
              )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className={cn("truncate", isMobile ? "font-semibold text-base" : "font-semibold")}>{user.name}</p>
              <p className={cn("truncate text-muted-foreground", isMobile ? "text-sm" : "text-xs")}>{hasActiveConversation ? (
                conversation?.lastMessage || 'No messages yet'
              ) : conversation ? (
                `Previously chatted • @${user.username}`
              ) : (
                `Available to chat • @${user.username}`
              )}</p>
            </div>
            <div className={cn("flex flex-col items-end shrink-0", isMobile ? "text-sm gap-2" : "text-xs gap-1")}> 
              {conversation?.timestamp && (
                <p>
                  {formatDistanceToNow(new Date(conversation.timestamp as string), {
                    addSuffix: true,
                  })}
                </p>
              )}
              <div className={cn('flex items-center mt-1', isMobile ? 'gap-2' : 'gap-1')}> 
                {conversation?.muted && <BellOff className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />}
                {conversation?.unreadCount && conversation.unreadCount > 0 ? (
                  <Badge className={isMobile ? "bg-primary text-primary-foreground px-3 py-2 text-sm" : "bg-primary text-primary-foreground px-2 py-1 text-xs"}>
                    {conversation.unreadCount}
                  </Badge>
                ) : null}
                {!hasActiveConversation && conversation && (
                  <div className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-xs")}>Archived</div>
                )}
              </div>
            </div>
          </button>
          
          {/* Dropdown Menu */}
          {hasActiveConversation && conversation && (
            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onArchive?.(conversation.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete?.(conversation.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}