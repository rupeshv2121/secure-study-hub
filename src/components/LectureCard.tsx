import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface LectureCardProps {
  id: string;
  title: string;
  description: string | null;
  categoryName: string;
  categoryColor: string | null;
  viewCount: number;
  createdAt: string;
}

const LectureCard = ({
  id,
  title,
  description,
  categoryName,
  categoryColor,
  viewCount,
  createdAt,
}: LectureCardProps) => {
  return (
    <Link to={`/viewer/${id}`}>
      <Card className="group h-full gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium cursor-pointer overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <FileText className="w-6 h-6 text-primary" />
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
                {title}
              </h3>

              {description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default LectureCard;
