import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Sparkles } from "lucide-react";

const DailyTipCard = ({ dailyTip }) => {
  return (
    <Card
      className={`bg-accent/20 border-accent/30 backdrop-blur-sm rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300 sidebar-tip`}
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-accent-foreground">
          <Sparkles className="h-5 w-5" />
          <span>Daily Tip</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-accent-foreground/80 leading-relaxed">
          {dailyTip}
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyTipCard;
