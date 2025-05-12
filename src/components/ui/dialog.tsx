import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Add a counter to track dialog instances
let dialogCounter = 0;

// Enhanced Dialog component with detailed debug logging
const Dialog = ({ ...props }) => {
  const id = React.useRef(`dialog-${++dialogCounter}`).current;
  
  React.useEffect(() => {
    // Get component stack trace to identify what component is creating the dialog
    const stackTrace = new Error().stack || '';
    const stackLines = stackTrace.split('\n').slice(1, 6).join('\n');
    
    console.log(`Dialog ${id} mounted`);
    console.log(`Dialog creator component stack trace: ${stackLines}`);
    
    // Also log any props that might help identify the dialog's purpose
    if (props.open !== undefined) {
      console.log(`Dialog ${id} initial open state:`, props.open);
    }
    
    // Try to identify any children components
    if (props.children) {
      try {
        // Log child component types if possible
        console.log(`Dialog ${id} has children:`, React.Children.map(props.children, 
          child => child?.type?.displayName || child?.type?.name || typeof child));
      } catch (e) {
        console.log(`Dialog ${id} has children but couldn't analyze them`);
      }
    }
    
    return () => {
      console.log(`Dialog ${id} unmounted`);
    };
  }, [id, props]);
  
  return <DialogPrimitive.Root {...props} />;
};

const DialogTrigger = DialogPrimitive.Trigger

// Customized DialogPortal with enhanced tracking
const DialogPortal = ({ ...props }) => {
  const portalId = React.useRef(`portal-${Math.random().toString(36).slice(2, 8)}`).current;
  
  React.useEffect(() => {
    console.log(`DialogPortal ${portalId} mounted`);
    
    // Enhanced debugging to help identify duplicate dialogs
    setTimeout(() => {
      // Count and log all portals in the DOM
      const portals = document.querySelectorAll('[data-radix-portal]');
      console.log(`Total portals in DOM: ${portals.length}`);
      
      // Log each portal with its position and content description
      portals.forEach((portal, i) => {
        const portalRect = portal.getBoundingClientRect();
        const portalContent = portal.textContent?.substring(0, 50) || 'No text content';
        
        console.log(`Portal #${i+1} details:`, {
          position: `${Math.round(portalRect.left)},${Math.round(portalRect.top)}`,
          size: `${Math.round(portalRect.width)}x${Math.round(portalRect.height)}`,
          content: portalContent,
          classes: portal.className,
          childElements: portal.children.length,
          html: portal.innerHTML.substring(0, 100) + '...'
        });
        
        // Try to identify if this is a dialog
        const dialogElements = portal.querySelectorAll('[role="dialog"]');
        if (dialogElements.length > 0) {
          console.log(`Portal #${i+1} contains ${dialogElements.length} dialog(s)`);
          
          // Log each dialog's content
          dialogElements.forEach((dialog, j) => {
            console.log(`Dialog #${j+1} in Portal #${i+1}:`, {
              content: dialog.textContent?.substring(0, 50) || 'No text content',
              ariaLabel: dialog.getAttribute('aria-label'),
              classes: dialog.className
            });
          });
        }
      });
      
      // Check for duplicate dialog content
      const dialogElements = document.querySelectorAll('[role="dialog"]');
      if (dialogElements.length > 1) {
        console.warn(`WARNING: Found ${dialogElements.length} dialogs in the DOM - possible duplicate!`);
        
        // Compare dialog contents to check for duplicates
        const dialogContents = Array.from(dialogElements).map(dialog => dialog.textContent);
        for (let i = 0; i < dialogContents.length; i++) {
          for (let j = i + 1; j < dialogContents.length; j++) {
            const similarity = calculateTextSimilarity(dialogContents[i] || '', dialogContents[j] || '');
            if (similarity > 0.7) { // 70% similarity threshold
              console.warn(`High similarity (${Math.round(similarity * 100)}%) between Dialog #${i+1} and Dialog #${j+1} - likely DUPLICATE!`);
            }
          }
        }
      }
    }, 50);
    
    return () => {
      console.log(`DialogPortal ${portalId} unmounted`);
    };
  }, [portalId]);
  
  return <DialogPrimitive.Portal {...props} />;
};

// Helper function to calculate text similarity
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  if (text1 === text2) return 1;
  
  // Simple Jaccard similarity calculation
  const set1 = new Set(text1.toLowerCase().split(/\s+/));
  const set2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground dialog-close-button">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-0",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
