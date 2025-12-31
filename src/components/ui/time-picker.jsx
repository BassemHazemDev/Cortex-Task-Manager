import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export function TimePicker({ time, onSelect, className }) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(time || "")

  React.useEffect(() => {
    // Only update if the parsed input doesn't match the new time (to avoid overwriting user while typing if parsing matches)
    // But since we are formatting 12h, and time is 24h, simple check:
    if (time) {
        setInputValue(formatTimeDisplay(time));
    } else {
        setInputValue("");
    }
  }, [time])

  // Helper to convert 24h to 12h format
  const formatTimeDisplay = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return time24;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  // Helper to convert 12h input to 24h format
  const parseTimeInput = (input) => {
    if (!input) return null;
    const normalized = input.toLowerCase().trim();
    
    // Regex matches: 2, 2:30, 2:30pm, 2pm
    const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!match) return null;
    
    let [_, h, m, period] = match;
    let hours = parseInt(h);
    let minutes = m ? parseInt(m) : 0;
    
    if (period) {
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
    } else if (hours === 12) {
       // Ambiguous case "12:00". Usually 12:00 PM if not specified? 
       // Or 24h "12:00"? 24h logic says 12 is 12:00.
       // We'll treat as 24h if no period, unless explicitly AM/PM logic needed.
       // Actually user says "add am and pm in text writing", so they might type it.
    }
    
    if (hours > 23 || minutes > 59) return null;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Generate 30-minute intervals
  const timeSlots = React.useMemo(() => {
    const slots = []
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const hour = i.toString().padStart(2, '0')
            const minute = j.toString().padStart(2, '0')
            slots.push(`${hour}:${minute}`)
        }
    }
    return slots
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    
    const parsed = parseTimeInput(val);
    if (parsed) {
        // If we successfully parsed a complete time, update the parent
        // Note: this might cause the useEffect to trigger and reformat "2:30" to "2:30 AM" instantly if logic allows.
        // We'll let it happen for now, fast feedback.
        onSelect(parsed);
    }
  }

  const handleBlur = () => {
    if (time) {
        setInputValue(formatTimeDisplay(time));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !time && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time ? formatTimeDisplay(time) : <span>Pick a time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="flex flex-col gap-2">
            <Input 
                placeholder="hh:mm AM/PM" 
                value={inputValue} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="h-8"
            />
            <ScrollArea className="h-72 w-full border-t pt-2">
                <div className="space-y-1">
                    {timeSlots.map((slot) => (
                        <Button
                            key={slot}
                            variant={time === slot ? "default" : "ghost"}
                            className="w-full justify-start h-8 font-normal"
                            onClick={() => {
                                onSelect(slot)
                                setOpen(false)
                            }}
                        >
                            {formatTimeDisplay(slot)}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
