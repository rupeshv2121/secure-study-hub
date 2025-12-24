import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Brain, Briefcase, Code, BookOpen, LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  lectureCount?: number;
}

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  Brain,
  Briefcase,
  Code,
  BookOpen,
};

const CategoryCard = ({ id, name, description, icon, color, lectureCount = 0 }: CategoryCardProps) => {
  const IconComponent = icon && iconMap[icon] ? iconMap[icon] : BookOpen;

  return (
    <Link to={`/lectures?category=${id}`}>
      <Card className="group h-full gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium cursor-pointer overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: color || 'hsl(var(--primary))' }}
            >
              <IconComponent className="w-6 h-6 text-primary-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {name}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
