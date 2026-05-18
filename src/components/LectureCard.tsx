import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { LectureCardProps } from '@/interfaces/components';
import { format } from 'date-fns';
import { Calendar, Eye, FileText, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const LectureCard = ({
  id,
  title,
  description,
  categoryName,
  categoryColor,
  viewCount,
  createdAt,
  isLocked = false,
  isFreePreview = false,
}: LectureCardProps) => {
  const CardWrapper = isLocked ? 'div' : Link;
  const wrapperProps = isLocked ? {} : { to: `/viewer/${id}` };

  return (
    <CardWrapper {...wrapperProps as any}>
      <Card className={`group h-full gradient-card border-border/50 transition-all duration-300 overflow-hidden ${isLocked ? 'opacity-75 cursor-not-allowed' : 'hover:border-primary/30 hover:shadow-medium cursor-pointer'}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${isLocked ? 'bg-muted' : 'bg-primary/10 group-hover:scale-110'}`}>
              {isLocked ? (
                <Lock className="w-6 h-6 text-muted-foreground" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: categoryColor
                      ? `${categoryColor}20`
                      : 'hsl(var(--secondary))',
                    color: categoryColor || 'hsl(var(--secondary-foreground))',
                  }}
                >
                  {categoryName}
                </Badge>
                {isFreePreview && (
                  <Badge variant="outline" className="text-xs gap-1 border-green-500/50 text-green-500">
                    <Sparkles className="w-3 h-3" />
                    Free Preview
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="text-xs gap-1 border-orange-500/50 text-orange-500">
                    <Lock className="w-3 h-3" />
                    Locked
                  </Badge>
                )}
              </div>

              <h3 className={`font-semibold transition-colors line-clamp-1 ${isLocked ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'}`}>
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
    </CardWrapper>
  );
};

export default LectureCard;
