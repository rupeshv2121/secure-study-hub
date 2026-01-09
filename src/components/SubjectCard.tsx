import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Lock, IndianRupee, Check } from 'lucide-react';

interface SubjectCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryName: string;
  categoryColor: string | null;
  isPurchased: boolean;
  lectureCount: number;
  onPurchase: (subjectId: string, price: number) => void;
  onView: (subjectId: string) => void;
}

const SubjectCard = ({
  id,
  name,
  description,
  price,
  categoryName,
  categoryColor,
  isPurchased,
  lectureCount,
  onPurchase,
  onView,
}: SubjectCardProps) => {
  return (
    <Card className="group h-full gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${isPurchased ? 'bg-green-500/20' : 'bg-primary/10'}`}>
            {isPurchased ? (
              <Check className="w-6 h-6 text-green-500" />
            ) : (
              <Lock className="w-6 h-6 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Badge
              variant="secondary"
              className="mb-2 text-xs"
              style={{
                backgroundColor: categoryColor
                  ? `${categoryColor}20`
                  : 'hsl(var(--secondary))',
                color: categoryColor || 'hsl(var(--secondary-foreground))',
              }}
            >
              {categoryName}
            </Badge>

            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {name}
            </h3>

            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              {lectureCount} lectures
            </div>

            <div className="mt-4">
              {isPurchased ? (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => onView(id)}
                >
                  <BookOpen className="w-4 h-4" />
                  View Lectures
                </Button>
              ) : (
                <Button
                  variant="hero"
                  className="w-full gap-2"
                  onClick={() => onPurchase(id, price)}
                >
                  <IndianRupee className="w-4 h-4" />
                  Buy for ₹{price}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectCard;
