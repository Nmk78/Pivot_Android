import * as Slot from "@rn-primitives/slot";
import type { SlottableTextProps, TextRef } from "@rn-primitives/types";
import * as React from "react";
import { Text as RNText } from "react-native";
import { cn } from "@/lib/utils";

const TextClassContext = React.createContext<string | undefined>(undefined);

const Text = React.forwardRef<TextRef, SlottableTextProps>(
  ({ className, asChild = false, style, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;
    
    // Auto-calculate lineHeight based on fontSize if not provided
    const autoLineHeight = React.useMemo(() => {
      if (style && typeof style === 'object' && 'lineHeight' in style) {
        return style; // lineHeight already provided
      }
      
      // Extract fontSize from className or use default
      let fontSize = 16; // default
      if (className?.includes('text-xs')) fontSize = 12;
      else if (className?.includes('text-sm')) fontSize = 14;
      else if (className?.includes('text-base')) fontSize = 16;
      else if (className?.includes('text-lg')) fontSize = 18;
      else if (className?.includes('text-xl')) fontSize = 20;
      else if (className?.includes('text-2xl')) fontSize = 24;
      else if (className?.includes('text-3xl')) fontSize = 30;
      
      return {
        ...(style && typeof style === 'object' ? style : {}),
        lineHeight: Math.ceil(fontSize * 1.4) // 1.4x multiplier for good line height
      };
    }, [style, className]);

    return (
      <Component
        className={cn(
          "text-lg text-foreground web:select-text",
          textClass,
          className
        )}
        style={autoLineHeight}
        ref={ref}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, TextClassContext };
