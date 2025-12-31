import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({ date, onSelect, className }) {
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "yyyy-MM-dd"))
    } else {
      setInputValue("")
    }
  }, [date])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    
    // Attempt to parse 'yyyy-MM-dd'
    const parsedDate = parse(val, "yyyy-MM-dd", new Date())
    if (isValid(parsedDate)) {
      onSelect(parsedDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col gap-3">
            <Input 
                placeholder="YYYY-MM-DD" 
                value={inputValue} 
                onChange={handleInputChange}
            />
            <div className="border rounded-md">
                <Calendar
                mode="single"
                selected={date}
                onSelect={(day) => {
                    onSelect(day);
                }}
                initialFocus
                />
            </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
